import express from "express"
import cors from "cors"
import morgan from "morgan"
import dotenv from "dotenv"
import connectDB from "./db/connect.js"
import habitRoutes from "./routes/habitRoutes.js"

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

// Middleware para rutas no encontradas - CORREGIDO
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
      console.log(`📚 Documentación: http://localhost:${PORT}`)
      console.log(`🔗 MongoDB conectado correctamente`)
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
