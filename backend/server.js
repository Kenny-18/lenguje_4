import express from "express"
import cors from "cors"
import morgan from "morgan"
import dotenv from "dotenv"
import connectDB from "./db/connect.js"
import habitRoutes from "./routes/habitRoutes.js"
import statsRoutes from "./routes/statsRoutes.js"
import googleRoutes from "./routes/googleRoutes.js"
import achievementRoutes from "./routes/achievementRoutes.js"
import shareRoutes from "./routes/shareRoutes.js" // NEW

// Configurar variables de entorno
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middlewares
app.use(
  cors({
    origin: [process.env.FRONTEND_URL || "http://localhost:3000", "http://localhost:5173", "http://localhost:3001"],
    credentials: true,
  }),
)

app.use(express.json({ limit: "10mb" })) // Ensure it can handle large base64 images
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
      share: "/api/share", // NEW
      publicShare: "/share/:token", // NEW
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
app.use("/api/share", shareRoutes) // NEW: for creating share links (authenticated)

// NEW: Public route for shared progress (no /api prefix)
app.use("/share", shareRoutes) // This will handle GET /share/:token

// Middleware para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    message: `Ruta ${req.originalUrl} no encontrada`,
    availableRoutes: [
      "GET /",
      "GET /api/health",
      "GET /api/habits",
      "POST /api/habits",
      "PUT /api/habits/:id",
      "DELETE /api/habits/:id",
      "GET /api/stats/overview",
      "GET /api/stats/habits/:id",
      "GET /api/integrations/google/auth",
      "GET /api/integrations/google/callback",
      "GET /api/achievements",
      "POST /api/share", // NEW
      "GET /share/:token", // NEW
    ],
  })
})

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
  console.error("Error stack:", err.stack)

  res.status(err.status || 500).json({
    message: err.message || "Error interno del servidor",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  })
})

// Función para iniciar el servidor
const startServer = async () => {
  try {
    // Verificar que existe la URI de MongoDB
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI no está definida en las variables de entorno")
    }

    // Conectar a MongoDB antes de iniciar el servidor
    await connectDB()

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`)
      console.log(`🌐 URL base: http://localhost:${PORT}`)
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
      console.log(`📝 API Habits: http://localhost:${PORT}/api/habits`)
      console.log(`📈 API Stats: http://localhost:${PORT}/api/stats`)
      console.log(`🔗 MongoDB conectado correctamente`)
      console.log(`🔗 Google Calendar Integration: http://localhost:${PORT}/api/integrations/google/auth`)
      console.log(`🏆 API Achievements: http://localhost:${PORT}/api/achievements`)
      console.log(`🔗 API Share: http://localhost:${PORT}/api/share`) // NEW
      console.log(`🌐 Public Share Links: http://localhost:${PORT}/share/:token`) // NEW
    })
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error.message)
    process.exit(1)
  }
}

// Manejo de señales para cerrar gracefully
process.on("SIGTERM", () => {
  console.log("SIGTERM recibido, cerrando servidor...")
  process.exit(0)
})

process.on("SIGINT", () => {
  console.log("SIGINT recibido, cerrando servidor...")
  process.exit(0)
})

// Iniciar servidor
startServer()
