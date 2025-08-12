import express from "express"
import {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  getHabitById,
  syncHabitToGoogleCalendar,
  updateHabitReminder, // agregando endpoint de recordatorios
} from "../controllers/habitController.js"
import { authenticateUser } from "../middleware/auth.js"
import checkinRoutes from "./checkinRoutes.js"

const router = express.Router()

// Middleware para logging específico de rutas de hábitos
router.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl} - ${new Date().toISOString()}`)
  next()
})

// Aplicar autenticación a todas las rutas de hábitos
router.use(authenticateUser)

// Rutas anidadas para check-ins
router.use("/:id/checkins", checkinRoutes)

// Rutas para hábitos (todas requieren autenticación)
router.get("/", getHabits) // GET /api/habits
router.post("/", createHabit) // POST /api/habits
router.get("/:id", getHabitById) // GET /api/habits/:id
router.put("/:id", updateHabit) // PUT /api/habits/:id
router.delete("/:id", deleteHabit) // DELETE /api/habits/:id
router.post("/:id/sync-calendar", syncHabitToGoogleCalendar) // New route
router.put("/:id/reminder", updateHabitReminder) // PUT /api/habits/:id/reminder

export default router
