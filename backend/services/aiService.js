import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import MoodNote from "../models/MoodNote.js" // Import MoodNote model
import { startOfDay, subDays } from "date-fns" // Import date-fns utilities

// Configurar Redis con manejo robusto de errores
let redis = null

const initializeRedis = async () => {
  try {
    // Verificar si Redis está disponible antes de intentar conectar
    const { default: Redis } = await import("ioredis")

    const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      connectTimeout: 1000,
      commandTimeout: 2000,
      enableOfflineQueue: false,
      showFriendlyErrorStack: false,
    })

    // Manejar todos los eventos de error para evitar crashes
    redisClient.on("error", (error) => {
      // Silenciar errores de conexión completamente
      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        return // No hacer nada, error esperado
      }
      console.warn("⚠️ Redis error:", error.message)
    })

    redisClient.on("connect", () => {
      console.log("✅ Redis connected successfully")
    })

    redisClient.on("close", () => {
      console.log("🔌 Redis connection closed")
    })

    // Intentar un ping rápido para verificar conectividad
    try {
      await redisClient.ping()
      redis = redisClient
      console.log("✅ Redis initialized and ready")
      return true
    } catch (error) {
      console.log("⚠️ Redis not available, using fallback mode")
      await redisClient.disconnect()
      return false
    }
  } catch (error) {
    console.warn("⚠️ Redis module not available, using fallback mode")
    return false
  }
}

// Inicializar Redis de forma asíncrona
initializeRedis().catch(() => {
  console.log("⚠️ Redis initialization failed, continuing without cache")
})

// ✅ Define el modelo de Google Gemini en lugar de OpenAI
const aiModel = google("models/gemini-1.5-flash") // Modelo gratuito y rápido

const CACHE_TTL_SECONDS = 24 * 60 * 60 // 24 hours

// Fallback suggestions para cuando la IA no funciona
const FALLBACK_SUGGESTIONS = [
  {
    title: "Beber un vaso de agua al despertar",
    reason: "Hidratarse al inicio del día mejora el metabolismo y la energía.",
  },
  {
    title: "Hacer 5 respiraciones profundas",
    reason: "La respiración consciente reduce el estrés y mejora el enfoque mental.",
  },
  {
    title: "Caminar 10 minutos al aire libre",
    reason: "El ejercicio ligero y el aire fresco mejoran el estado de ánimo.",
  },
  {
    title: "Escribir 3 cosas por las que estás agradecido",
    reason: "La gratitud diaria mejora el bienestar mental y la perspectiva positiva.",
  },
  {
    title: "Leer 10 páginas de un libro",
    reason: "La lectura diaria estimula la mente y amplía el conocimiento.",
  },
  {
    title: "Estirar por 5 minutos",
    reason: "Los estiramientos mejoran la flexibilidad y reducen la tensión muscular.",
  },
  {
    title: "Meditar por 5 minutos",
    reason: "La meditación reduce el estrés y mejora la concentración mental.",
  },
  {
    title: "Organizar el espacio de trabajo",
    reason: "Un entorno ordenado mejora la productividad y reduce el estrés.",
  },
]

const getRandomFallbackSuggestion = () => {
  const index = Math.floor(Math.random() * FALLBACK_SUGGESTIONS.length)
  return FALLBACK_SUGGESTIONS[index]
}

// Función helper para verificar cache de Redis de forma segura
const getFromRedisCache = async (key) => {
  if (!redis) return null

  try {
    const result = await redis.get(key)
    return result ? JSON.parse(result) : null
  } catch (error) {
    console.warn("⚠️ Redis get error:", error.message)
    return null
  }
}

// Función helper para guardar en cache de Redis de forma segura
const setInRedisCache = async (key, value, ttl) => {
  if (!redis) return

  try {
    await redis.setex(key, ttl, JSON.stringify(value))
    console.log("✅ AI Suggestion cached successfully")
  } catch (error) {
    console.warn("⚠️ Redis set error:", error.message)
  }
}

// NEW: Function to weigh recent mood
const weighMood = async (userId, days = 7) => {
  try {
    const today = startOfDay(new Date())
    const startDate = startOfDay(subDays(today, days - 1)) // e.g., for 7 days, start 6 days ago

    const moodNotes = await MoodNote.find({
      userId,
      date: {
        $gte: startDate,
        $lte: today,
      },
    }).sort({ date: -1 })

    if (moodNotes.length === 0) {
      return { context: "", moodFound: false }
    }

    let positiveCount = 0
    let neutralCount = 0
    let negativeCount = 0

    moodNotes.forEach((note) => {
      if (note.sentiment === "positive") positiveCount++
      else if (note.sentiment === "neutral") neutralCount++
      else if (note.sentiment === "negative") negativeCount++
    })

    const totalNotes = moodNotes.length
    const positiveRatio = positiveCount / totalNotes
    const negativeRatio = negativeCount / totalNotes

    let moodSummary = ""
    if (positiveRatio > 0.6) {
      moodSummary = "predominantemente positivo"
    } else if (negativeRatio > 0.6) {
      moodSummary = "predominantemente negativo"
    } else if (positiveRatio > 0.3 && negativeRatio > 0.3) {
      moodSummary = "mixto (con altibajos)"
    } else {
      moodSummary = "generalmente neutral"
    }

    const latestMoodEmoji = moodNotes[0]?.emoji || ""
    const latestMoodNote = moodNotes[0]?.note || ""

    let contextString = `Considera que el usuario ha tenido un estado de ánimo ${moodSummary} en los últimos ${days} días.`
    if (latestMoodEmoji) {
      contextString += ` Su último registro fue "${latestMoodEmoji}" con la nota: "${latestMoodNote}".`
    }
    contextString += ` Sugiere un hábito que se alinee con este ánimo. Por ejemplo, si el ánimo es negativo, sugiere algo para levantarlo. Si es positivo, algo para mantenerlo o potenciarlo. Asegúrate de que la "reason" mencione cómo el hábito se relaciona con el estado de ánimo reciente.`

    return { context: contextString, moodFound: true }
  } catch (error) {
    console.error("Error weighing mood:", error)
    return { context: "", moodFound: false } // Return empty context on error
  }
}

export const getDailyAISuggestion = async (userId) => {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const cacheKey = `ai_suggestion:${userId}:${today}`

  try {
    // 1. Check Redis cache first (only if Redis is available)
    const cachedSuggestion = await getFromRedisCache(cacheKey)
    if (cachedSuggestion) {
      console.log(`✅ AI Suggestion for ${userId} on ${today} found in cache.`)
      return cachedSuggestion
    }

    // 2. ✅ Verificar que tenemos Google Generative AI API key
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.warn("⚠️ Google Generative AI API key not found, using fallback")
      return { ...getRandomFallbackSuggestion(), moodConsidered: false } // Add moodConsidered flag
    }

    // NEW: Get mood context
    let { context: moodContext, moodFound } = await weighMood(userId, 7) // Consider last 7 days

    // 3. If not in cache, call Google Gemini
    console.log(`🔄 Generating new AI suggestion with Google Gemini for ${userId} on ${today}...`)

    // Prompt optimizado para Gemini, ahora incluyendo mood context
    const prompt = `Genera una sugerencia de hábito saludable diario en español.
    ${moodContext}
    Responde ÚNICAMENTE con un objeto JSON válido que tenga exactamente esta estructura:
    {"title": "nombre del hábito", "reason": "explicación breve del beneficio"}

    El hábito debe ser simple, realizable en 5-15 minutos, y beneficioso para la salud física o mental.
    
    Ejemplo válido: {"title": "Beber un vaso de agua tibia con limón", "reason": "Estimula la digestión y aporta vitamina C para empezar el día."}`

    // Crear timeout manual para Google Gemini
    const aiPromise = generateText({
      model: aiModel,
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 150, // Increased maxTokens slightly to accommodate longer reasons
    })

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Google Gemini timeout")), 20000) // ✅ 20 segundos para Gemini
    })

    console.log("⏳ Esperando respuesta de Google Gemini (máximo 20s)...")
    const { text } = await Promise.race([aiPromise, timeoutPromise])

    let suggestion
    try {
      // Limpiar la respuesta por si viene con texto extra
      const cleanText = text
        .trim()
        .replace(/```json\n?/g, "")
        .replace(/```/g, "")
        .trim()
      suggestion = JSON.parse(cleanText)

      // Basic validation
      if (!suggestion.title || !suggestion.reason) {
        throw new Error("AI response missing required fields")
      }
      console.log("✅ Google Gemini suggestion generated successfully:", suggestion.title)
    } catch (parseError) {
      console.error("❌ Error parsing Google Gemini response:", parseError)
      console.log("Raw Gemini response:", text)
      console.log("🔄 Using fallback suggestion")
      suggestion = getRandomFallbackSuggestion()
      moodFound = false // If parsing fails, assume mood wasn't effectively used
    }

    // 4. Store in Redis cache
    const finalSuggestion = { ...suggestion, moodConsidered: moodFound } // Add moodConsidered flag
    await setInRedisCache(cacheKey, finalSuggestion, CACHE_TTL_SECONDS)

    return finalSuggestion
  } catch (error) {
    console.error("❌ Error in getDailyAISuggestion:", error.message)

    // Return a random fallback suggestion in case of any error
    const fallbackSuggestion = getRandomFallbackSuggestion()
    console.log("🔄 Using fallback suggestion due to error:", fallbackSuggestion.title)
    return { ...fallbackSuggestion, moodConsidered: false } // Add moodConsidered flag
  }
}
