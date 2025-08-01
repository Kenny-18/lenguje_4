import Redis from "ioredis"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// Initialize Redis client with error handling
let redis
try {
  redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  })
  console.log("✅ Redis client initialized")
} catch (error) {
  console.warn("⚠️ Redis not available, using fallback mode")
  redis = null
}

// Define the AI model to use
const aiModel = openai("gpt-3.5-turbo") // ✅ Usar modelo más rápido

const CACHE_TTL_SECONDS = 24 * 60 * 60 // 24 hours

export const getDailyAISuggestion = async (userId) => {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const cacheKey = `ai_suggestion:${userId}:${today}`

  try {
    // 1. Check Redis cache first (only if Redis is available)
    if (redis) {
      try {
        const cachedSuggestion = await redis.get(cacheKey)
        if (cachedSuggestion) {
          console.log(`✅ AI Suggestion for ${userId} on ${today} found in cache.`)
          return JSON.parse(cachedSuggestion)
        }
      } catch (redisError) {
        console.warn("⚠️ Redis error, proceeding without cache:", redisError.message)
      }
    }

    // 2. If not in cache, call the AI model
    console.log(`🔄 Generating new AI suggestion for ${userId} on ${today}...`)

    const prompt = `Genera una sugerencia de hábito personal diario en español. La sugerencia debe ser concisa y motivadora.
    El formato de la respuesta debe ser un objeto JSON con dos campos: "title" (string, el título del hábito) y "reason" (string, una breve explicación de por qué es beneficioso).
    Ejemplo: {"title": "Beber un vaso de agua al despertar", "reason": "Hidratarse al inicio del día mejora el metabolismo y la energía."}`

    const { text } = await generateText({
      model: aiModel,
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 120, // ✅ Reducido para respuesta más rápida
    })

    let suggestion
    try {
      suggestion = JSON.parse(text)
      // Basic validation
      if (!suggestion.title || !suggestion.reason) {
        throw new Error("AI response missing required fields")
      }
    } catch (parseError) {
      console.error("❌ Error parsing AI response:", parseError)
      // Fallback to a generic suggestion
      suggestion = {
        title: "Hacer 5 minutos de respiración consciente",
        reason: "La respiración consciente reduce el estrés y mejora el enfoque mental.",
      }
    }

    // 3. Store in Redis cache (only if Redis is available)
    if (redis) {
      try {
        await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(suggestion))
        console.log(`✅ AI Suggestion cached successfully.`)
      } catch (redisError) {
        console.warn("⚠️ Failed to cache suggestion:", redisError.message)
      }
    }

    return suggestion
  } catch (error) {
    console.error("❌ Error in getDailyAISuggestion:", error)
    // Return a fallback suggestion in case of any error
    return {
      title: "Caminar 10 minutos al aire libre",
      reason: "El ejercicio ligero y el aire fresco mejoran el estado de ánimo y la energía.",
    }
  }
}
