import { startOfDay, endOfDay, parseISO } from "date-fns"
import Checkin from "../models/Checkin.js"
import Habit from "../models/Habit.js"
import { updateStreak } from "../services/streakService.js"

// POST /api/habits/:id/checkins - Crear check-in para un hábito
export const createCheckin = async (req, res) => {
  try {
    const { id: habitId } = req.params
    const userId = req.user.uid
    const today = startOfDay(new Date())

    // Verificar que el hábito existe y pertenece al usuario
    const habit = await Habit.findOne({ _id: habitId, userId })
    if (!habit) {
      return res.status(404).json({
        message: "Hábito no encontrado o no tienes permisos para acceder a él",
      })
    }

    // Verificar si ya existe un check-in para hoy
    const existingCheckin = await Checkin.findOne({
      habitId,
      userId,
      date: {
        $gte: today,
        $lt: endOfDay(today),
      },
    })

    if (existingCheckin) {
      return res.status(400).json({
        message: "Ya existe un check-in para hoy",
        checkin: existingCheckin,
      })
    }

    // Crear nuevo check-in
    const newCheckin = new Checkin({
      habitId,
      userId,
      date: today,
      completed: true,
    })

    const savedCheckin = await newCheckin.save()

    // Actualizar racha
    const updatedHabit = await updateStreak(habitId, userId, today)

    res.status(201).json({
      message: "Check-in registrado exitosamente",
      checkin: savedCheckin,
      habit: {
        id: updatedHabit._id,
        streakCurrent: updatedHabit.streakCurrent,
        streakBest: updatedHabit.streakBest,
        lastCheckinDate: updatedHabit.lastCheckinDate,
      },
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Ya existe un check-in para esta fecha",
      })
    }

    console.error("Error creando check-in:", error)
    res.status(500).json({
      message: "Error al crear check-in",
      error: error.message,
    })
  }
}

// GET /api/habits/:id/checkins - Obtener check-ins de un hábito
export const getCheckins = async (req, res) => {
  try {
    const { id: habitId } = req.params
    const userId = req.user.uid
    const { from, to } = req.query

    // Verificar que el hábito existe y pertenece al usuario
    const habit = await Habit.findOne({ _id: habitId, userId })
    if (!habit) {
      return res.status(404).json({
        message: "Hábito no encontrado o no tienes permisos para acceder a él",
      })
    }

    // Construir filtro de fechas
    const dateFilter = {}
    if (from || to) {
      dateFilter.date = {}
      if (from) {
        dateFilter.date.$gte = startOfDay(parseISO(from))
      }
      if (to) {
        dateFilter.date.$lte = endOfDay(parseISO(to))
      }
    }

    // Obtener check-ins
    const checkins = await Checkin.find({
      habitId,
      userId,
      ...dateFilter,
    }).sort({ date: -1 })

    res.status(200).json({
      checkins,
      habit: {
        id: habit._id,
        title: habit.title,
        streakCurrent: habit.streakCurrent,
        streakBest: habit.streakBest,
        lastCheckinDate: habit.lastCheckinDate,
      },
      total: checkins.length,
    })
  } catch (error) {
    console.error("Error obteniendo check-ins:", error)
    res.status(500).json({
      message: "Error al obtener check-ins",
      error: error.message,
    })
  }
}

// GET /api/habits/:id/checkins/today - Verificar si hay check-in hoy
export const getTodayCheckin = async (req, res) => {
  try {
    const { id: habitId } = req.params
    const userId = req.user.uid
    const today = startOfDay(new Date())

    // Verificar que el hábito existe y pertenece al usuario
    const habit = await Habit.findOne({ _id: habitId, userId })
    if (!habit) {
      return res.status(404).json({
        message: "Hábito no encontrado o no tienes permisos para acceder a él",
      })
    }

    // Buscar check-in de hoy
    const todayCheckin = await Checkin.findOne({
      habitId,
      userId,
      date: {
        $gte: today,
        $lt: endOfDay(today),
      },
    })

    res.status(200).json({
      hasCheckinToday: !!todayCheckin,
      checkin: todayCheckin,
      habit: {
        id: habit._id,
        streakCurrent: habit.streakCurrent,
        streakBest: habit.streakBest,
      },
    })
  } catch (error) {
    console.error("Error verificando check-in de hoy:", error)
    res.status(500).json({
      message: "Error al verificar check-in de hoy",
      error: error.message,
    })
  }
}
