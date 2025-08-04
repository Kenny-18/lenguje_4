import express from "express"
import cors from "cors"
import morgan from "morgan"
import dotenv from "dotenv"
import connectDB from "./db/connect.js"
import habitRoutes from "./routes/habitRoutes.js"
import statsRoutes from "./routes/statsRoutes.js"
import googleRoutes from "./routes/googleRoutes.js"
import achievementRoutes from "./routes/achievementRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import aiRoutes from "./routes/aiRoutes.js"
import shareRoutes from "./routes/shareRoutes.js"
import moodRoutes from "./routes/moodRoutes.js"
import exportRoutes from "./routes/exportRoutes.js" // NEW: Import export routes
import { loadSentimentModel } from "./controllers/moodController.js"

// Configurar variables de entorno
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middlewares
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000", 
      "http://localhost:5173", 
      "http://localhost:3001"
    ],
    credentials: true,
  }),
)

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan("combined"))

// Rutas principales
app.get("/", (req, res) => {
  res.status(200).json({
    message: "API de Hábitos funcionando correctamente",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      habits: "/api/habits",
      stats: "/api/stats",
      google: "/api/integrations/google",
      achievements: "/api/achievements",
      users: "/api/users",
      ai: "/api/ai",
      share: "/api/share",
      moods: "/api/moods",
      export: "/api/export", // NEW: Add export endpoint
    },
  })
})

// Ruta de prueba
app.get("/api/health", (req, res) => {
  res.status(200).json({
    message: "Servidor funcionando correctamente",
    timestamp: new Date().toISOString(),
    status: "OK",
  })
})

// Rutas de la API
app.use("/api/habits", habitRoutes)
app.use("/api/stats", statsRoutes)
app.use("/api/integrations/google", googleRoutes)
app.use("/api/achievements", achievementRoutes)
app.use("/api/users", userRoutes)
app.use("/api/ai", aiRoutes)
app.use("/api/share", shareRoutes)
app.use("/share", shareRoutes) // Ruta pública para compartir (sin /api)
app.use("/api/moods", moodRoutes)
app.use("/api/export", exportRoutes) // NEW: Use export routes

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
  console.error("Error no manejado:", err.stack)
  res.status(500).json({
    message: "Error interno del servidor",
    error: process.env.NODE_ENV === "production" ? {} : err.message,
  })
})

// Middleware para rutas no encontradas
app.use("*", (req, res) => {
  res.status(404).json({
    message: "Ruta no encontrada",
    availableEndpoints: {
      health: "/api/health",
      habits: "/api/habits",
      stats: "/api/stats",
      google: "/api/integrations/google",
      achievements: "/api/achievements",
      users: "/api/users",
      ai: "/api/ai",
      share: "/api/share",
      moods: "/api/moods",
      export: "/api/export", // NEW: Include export in error message
    },
  })
})

// Función para inicializar el servidor
const startServer = async () => {
  try {
    // Conectar a MongoDB
    await connectDB()
    console.log("🔗 MongoDB conectado correctamente")

    // Inicializar modelo de sentimientos
    await loadSentimentModel()

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`)
      console.log(`🌐 URL base: http://localhost:${PORT}`)
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
      console.log(`📝 API Habits: http://localhost:${PORT}/api/habits`)
      console.log(`📈 API Stats: http://localhost:${PORT}/api/stats`)
      console.log(`🔗 Google Calendar Integration: http://localhost:${PORT}/api/integrations/google/auth`)
      console.log(`🏆 API Achievements: http://localhost:${PORT}/api/achievements`)
      console.log(`👤 API User Preferences: http://localhost:${PORT}/api/users/preferences`)
      console.log(`🧠 API AI Suggestions: http://localhost:${PORT}/api/ai/suggest`)
      console.log(`🔗 API Share: http://localhost:${PORT}/api/share`)
      console.log(`😊 API Moods: http://localhost:${PORT}/api/moods`)
      console.log(`📦 API Export: http://localhost:${PORT}/api/export`) // NEW: Log export endpoint
    })
  } catch (error) {
    console.error("❌ Error al inicializar el servidor:", error)
    process.exit(1)
  }
}

// Inicializar servidor
startServer()