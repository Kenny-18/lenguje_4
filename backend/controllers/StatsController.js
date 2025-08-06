import { startOfDay, subDays, format, eachDayOfInterval } from "date-fns"
// ✅ Alternativa: importar como módulo completo
import { es as esLocale } from "date-fns/locale";
import Habit from "../models/Habit.js"
import Checkin from "../models/Checkin.js"

// GET /api/stats/overview - Obtener estadísticas generales del usuario
export const getOverview = async (req, res) => {
  try {
    const userId = req.user.uid
    const today = startOfDay(new Date())
    const thirtyDaysAgo = startOfDay(subDays(today, 29)) // 30 días incluyendo hoy

    // Usar agregación para obtener todas las estadísticas en una sola consulta
    const [statsResult] = await Habit.aggregate([
      {
        $match: { userId },
      },
      {
        $facet: {
          // Estadísticas generales de hábitos
          habitStats: [
            {
              $group: {
                _id: null,
                totalHabits: { $sum: 1 },
                totalStreakCurrent: { $sum: "$streakCurrent" },
                maxStreakBest: { $max: "$streakBest" },
                avgStreakCurrent: { $avg: "$streakCurrent" },
                habitsWithStreak: {
                  $sum: {
                    $cond: [{ $gt: ["$streakCurrent", 0] }, 1, 0],
                  },
                },
              },
            },
          ],
          // Lista de hábitos para obtener IDs
          habitIds: [
            {
              $project: { _id: 1 },
            },
          ],
        },
      },
    ])

    const habitStats = statsResult.habitStats[0] || {
      totalHabits: 0,
      totalStreakCurrent: 0,
      maxStreakBest: 0,
      avgStreakCurrent: 0,
      habitsWithStreak: 0,
    }

    const habitIds = statsResult.habitIds.map((h) => h._id)

    // Obtener check-ins de los últimos 30 días
    const checkinsLast30Days = await Checkin.aggregate([
      {
        $match: {
          userId,
          habitId: { $in: habitIds },
          date: {
            $gte: thirtyDaysAgo,
            $lte: today,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date",
            },
          },
          count: { $sum: 1 },
          habits: { $addToSet: "$habitId" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ])

    // Crear array de los últimos 30 días con datos
    const last30DaysData = eachDayOfInterval({
      start: thirtyDaysAgo,
      end: today,
    }).map((date) => {
      const dateStr = format(date, "yyyy-MM-dd")
      const dayData = checkinsLast30Days.find((c) => c._id === dateStr)

      return {
        date: dateStr,
        dateFormatted: format(date, "dd/MM", { locale: esLocale }), // ✅ Usar esLocale
        checkins: dayData ? dayData.count : 0,
        uniqueHabits: dayData ? dayData.habits.length : 0,
      }
    })

    // Calcular porcentaje de cumplimiento global (últimos 30 días)
    const totalPossibleCheckins = habitStats.totalHabits * 30 // Asumiendo hábitos diarios
    const totalActualCheckins = checkinsLast30Days.reduce((sum, day) => sum + day.count, 0)
    const globalCompletionRate =
      totalPossibleCheckins > 0 ? Math.round((totalActualCheckins / totalPossibleCheckins) * 100) : 0

    // Calcular estadísticas adicionales
    const averageCheckinsPerDay = last30DaysData.reduce((sum, day) => sum + day.checkins, 0) / 30
    const bestDay = last30DaysData.reduce((max, day) => (day.checkins > max.checkins ? day : max), {
      checkins: 0,
      dateFormatted: "",
    })

    // Calcular días activos (días con al menos un check-in)
    const activeDays = last30DaysData.filter((day) => day.checkins > 0).length

    res.status(200).json({
      overview: {
        totalHabits: habitStats.totalHabits,
        globalCompletionRate,
        maxStreakBest: habitStats.maxStreakBest,
        totalCurrentStreak: habitStats.totalStreakCurrent,
        averageStreak: Math.round(habitStats.avgStreakCurrent * 10) / 10,
        habitsWithActiveStreak: habitStats.habitsWithStreak,
        activeDaysLast30: activeDays,
        averageCheckinsPerDay: Math.round(averageCheckinsPerDay * 10) / 10,
      },
      chartData: {
        last30Days: last30DaysData,
        bestDay: bestDay.checkins > 0 ? bestDay : null,
        totalCheckinsLast30Days: totalActualCheckins,
      },
      period: {
        from: format(thirtyDaysAgo, "yyyy-MM-dd"),
        to: format(today, "yyyy-MM-dd"),
        days: 30,
      },
    })
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error)
    res.status(500).json({
      message: "Error al obtener estadísticas",
      error: error.message,
    })
  }
}

// GET /api/stats/habits/:id - Obtener estadísticas específicas de un hábito
export const getHabitStats = async (req, res) => {
  try {
    const { id: habitId } = req.params
    const userId = req.user.uid
    const today = startOfDay(new Date())
    const thirtyDaysAgo = startOfDay(subDays(today, 29))

    // Verificar que el hábito existe y pertenece al usuario
    const habit = await Habit.findOne({ _id: habitId, userId })
    if (!habit) {
      return res.status(404).json({
        message: "Hábito no encontrado o no tienes permisos para acceder a él",
      })
    }

    // Obtener check-ins del hábito en los últimos 30 días
    const checkins = await Checkin.find({
      habitId,
      userId,
      date: {
        $gte: thirtyDaysAgo,
        $lte: today,
      },
    }).sort({ date: 1 })

    // Calcular estadísticas del hábito
    const totalDays = 30
    const completedDays = checkins.length
    const completionRate = Math.round((completedDays / totalDays) * 100)

    // Crear datos para gráfica
    const chartData = eachDayOfInterval({
      start: thirtyDaysAgo,
      end: today,
    }).map((date) => {
      const dateStr = format(date, "yyyy-MM-dd")
      const hasCheckin = checkins.some((c) => format(new Date(c.date), "yyyy-MM-dd") === dateStr)

      return {
        date: dateStr,
        dateFormatted: format(date, "dd/MM", { locale: esLocale }), // ✅ Usar esLocale
        completed: hasCheckin ? 1 : 0,
      }
    })

    res.status(200).json({
      habit: {
        id: habit._id,
        title: habit.title,
        streakCurrent: habit.streakCurrent,
        streakBest: habit.streakBest,
        completionRate,
        completedDaysLast30: completedDays,
        totalDaysLast30: totalDays,
      },
      chartData: chartData,
      period: {
        from: format(thirtyDaysAgo, "yyyy-MM-dd"),
        to: format(today, "yyyy-MM-dd"),
        days: 30,
      },
    })
  } catch (error) {
    console.error("Error obteniendo estadísticas del hábito:", error)
    res.status(500).json({
      message: "Error al obtener estadísticas del hábito",
      error: error.message,
    })
  }
}
