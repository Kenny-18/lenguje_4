import express from "express"
import { createCheckin, getCheckins, getTodayCheckin } from "../controllers/checkinController.js"
import { authenticateUser } from "../middleware/auth.js"

const router = express.Router({ mergeParams: true }) // mergeParams para acceder a :id del parent router

// Middleware para logging específico de rutas de check-ins
router.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl} - ${new Date().toISOString()}`)
  next()
})

// Aplicar autenticación a todas las rutas de check-ins
router.use(authenticateUser)

// Rutas para check-ins (todas requieren autenticación)
router.post("/", createCheckin) // POST /api/habits/:id/checkins
router.get("/", getCheckins) // GET /api/habits/:id/checkins
router.get("/today", getTodayCheckin) // GET /api/habits/:id/checkins/today

export default router
