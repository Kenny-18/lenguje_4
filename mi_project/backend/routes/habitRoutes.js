import express from "express"
import { getHabits, createHabit, updateHabit, deleteHabit } from "../controllers/habitController.js"

const router = express.Router()

// Middleware para logging específico de rutas de hábitos
router.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl} - ${new Date().toISOString()}`)
  next()
})

// Rutas para hábitos
router.get("/", getHabits) // GET /api/habits
router.post("/", createHabit) // POST /api/habits
router.put("/:id", updateHabit) // PUT /api/habits/:id
router.delete("/:id", deleteHabit) // DELETE /api/habits/:id

// Ruta específica para obtener un hábito por ID
router.get("/:id", async (req, res) => {
  try {
    const { Habit } = await import("../models/Habit.js")
    const habit = await Habit.default.findById(req.params.id)

    if (!habit) {
      return res.status(404).json({ message: "Hábito no encontrado" })
    }

    res.status(200).json(habit)
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener hábito",
      error: error.message,
    })
  }
})

export default router
