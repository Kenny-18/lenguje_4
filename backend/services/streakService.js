import { startOfDay, subDays, isEqual } from "date-fns"
import Checkin from "../models/Checkin.js"
import Habit from "../models/Habit.js"

export const updateStreak = async (habitId, userId, checkinDate) => {
  try {
    const habit = await Habit.findOne({ _id: habitId, userId })
    if (!habit) {
      throw new Error("Hábito no encontrado")
    }

    const today = startOfDay(checkinDate)
    const yesterday = startOfDay(subDays(today, 1))

    // Obtener todos los check-ins del hábito ordenados por fecha
    const checkins = await Checkin.find({ habitId, userId }).sort({ date: -1 }).lean()

    if (checkins.length === 0) {
      // Primer check-in
      habit.streakCurrent = 1
      habit.streakBest = Math.max(habit.streakBest, 1)
      habit.lastCheckinDate = today
      await habit.save()
      return habit
    }

    // Calcular racha actual
    let currentStreak = 0
    let checkDate = today

    // Contar días consecutivos hacia atrás desde hoy
    for (let i = 0; i < checkins.length; i++) {
      const checkinDate = startOfDay(new Date(checkins[i].date))

      if (isEqual(checkinDate, checkDate)) {
        currentStreak++
        checkDate = subDays(checkDate, 1)
      } else {
        break
      }
    }

    // Actualizar racha actual y mejor racha
    habit.streakCurrent = currentStreak
    habit.streakBest = Math.max(habit.streakBest, currentStreak)
    habit.lastCheckinDate = today

    await habit.save()
    return habit
  } catch (error) {
    console.error("Error actualizando racha:", error)
    throw error
  }
}

export const calculateCurrentStreak = async (habitId, userId) => {
  try {
    const today = startOfDay(new Date())
    const checkins = await Checkin.find({ habitId, userId }).sort({ date: -1 }).lean()

    if (checkins.length === 0) {
      return 0
    }

    let currentStreak = 0
    let checkDate = today

    // Si no hay check-in hoy, empezar desde ayer
    const todayCheckin = checkins.find((c) => isEqual(startOfDay(new Date(c.date)), today))

    if (!todayCheckin) {
      checkDate = subDays(today, 1)
    }

    // Contar días consecutivos hacia atrás
    for (let i = 0; i < checkins.length; i++) {
      const checkinDate = startOfDay(new Date(checkins[i].date))

      if (isEqual(checkinDate, checkDate)) {
        currentStreak++
        checkDate = subDays(checkDate, 1)
      } else {
        break
      }
    }

    return currentStreak
  } catch (error) {
    console.error("Error calculando racha actual:", error)
    return 0
  }
}
