import express from "express"
import { getAchievements } from "../controllers/achievementController.js"
import { authenticateUser } from "../middleware/auth.js"

const router = express.Router()

// Middleware para logging específico de rutas de logros
router.use((req, res, next) => {
  console.log(`🏆 Achievements ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`)
  next()
})

// Aplicar autenticación a todas las rutas de logros
router.use(authenticateUser)

// Rutas para logros
router.get("/", getAchievements) // GET /api/achievements

export default router
