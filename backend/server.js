import express from "express"
import cors from "cors"
import morgan from "morgan"
import dotenv from "dotenv"
import { createServer } from "http" // agregando soporte para socket.io
import { Server } from "socket.io" // importando socket.io
import connectDB from "./db/connect.js"
import habitRoutes from "./routes/habitRoutes.js"
import statsRoutes from "./routes/statsRoutes.js"
import googleRoutes from "./routes/googleRoutes.js"
import achievementRoutes from "./routes/achievementRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import aiRoutes from "./routes/aiRoutes.js"
import shareRoutes from "./routes/shareRoutes.js"
import moodRoutes from "./routes/moodRoutes.js"
import exportRoutes from "./routes/exportRoutes.js"
import notificationRoutes from "./routes/notificationRoutes.js" // importando rutas de notificaciones
import { loadSentimentModel } from "./controllers/moodController.js"
import { initializeReminderJob } from "./services/reminderService.js" // importando servicio de recordatorios

// Configurar variables de entorno
dotenv.config()

const app = express()
const server = createServer(app) // creando servidor HTTP para socket.io
const PORT = process.env.PORT || 3000

const io = new Server(server, {
  cors: {
    origin: [
      "https://lenguje-4.vercel.app",
      process.env.FRONTEND_URL || "http://localhost:3001",
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    credentials: true,
  },
})

io.on("connection", (socket) => {
  console.log(`👤 Usuario conectado: ${socket.id}`)

  // El usuario se une a su sala personal para recibir notificaciones
  socket.on("join", (userId) => {
    socket.join(userId)
    console.log(`👤 Usuario ${userId} se unió a su sala personal`)
  })

  socket.on("disconnect", () => {
    console.log(`👤 Usuario desconectado: ${socket.id}`)
  })
})

// Middlewares
app.use(
  cors({
    origin: [
      "https://lenguje-4.vercel.app", // 🔧 Tu frontend en Vercel
      process.env.FRONTEND_URL || "http://localhost:3001",
      "http://localhost:5173",
      "http://localhost:3000",
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
      export: "/api/export",
      notifications: "/api/notifications", // agregando endpoint de notificaciones
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
app.use("/api/export", exportRoutes)
app.use("/api/notifications", notificationRoutes) // agregando rutas de notificaciones

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
      export: "/api/export",
      notifications: "/api/notifications", // incluyendo notificaciones en mensaje de error
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

    initializeReminderJob(io)

    // Iniciar servidor
    server.listen(PORT, () => {
      // usando server en lugar de app
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
      console.log(`📦 API Export: http://localhost:${PORT}/api/export`)
      console.log(`🔔 API Notifications: http://localhost:${PORT}/api/notifications`) // agregando log de notificaciones
      console.log(`📡 Socket.IO habilitado para notificaciones en tiempo real`) // agregando log de socket.io
    })
  } catch (error) {
    console.error("❌ Error al inicializar el servidor:", error)
    process.exit(1)
  }
}

// Inicializar servidor
startServer()
