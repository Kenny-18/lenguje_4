import express from "express"
import { getAISuggestion } from "../controllers/aiController.js"
import { authenticateUser } from "../middleware/auth.js"

const router = express.Router()

// Middleware para logging específico de rutas de IA
router.use((req, res, next) => {
  console.log(`🧠 AI ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`)
  next()
})

// Aplicar autenticación a todas las rutas de IA
router.use(authenticateUser)

// Rutas para sugerencias de IA
router.get("/suggest", getAISuggestion) // GET /api/ai/suggest

export default router
