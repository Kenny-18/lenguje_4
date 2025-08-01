import express from "express"
import { getOverview, getHabitStats } from "../controllers/StatsController.js"
import { authenticateUser } from "../middleware/auth.js"

const router = express.Router()

// Middleware para logging específico de rutas de estadísticas
router.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl} - ${new Date().toISOString()}`)
  next()
})

// Aplicar autenticación a todas las rutas de estadísticas
router.use(authenticateUser)

// Rutas para estadísticas (todas requieren autenticación)
router.get("/overview", getOverview) // GET /api/stats/overview
router.get("/habits/:id", getHabitStats) // GET /api/stats/habits/:id

export default router
