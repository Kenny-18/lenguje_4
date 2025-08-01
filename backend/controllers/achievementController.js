import Achievement from "../models/Achievement.js"

// GET /api/achievements - Obtener todos los logros del usuario autenticado
export const getAchievements = async (req, res) => {
  try {
    const userId = req.user.uid
    const achievements = await Achievement.find({ userId }).sort({ achievedAt: -1 })

    res.status(200).json({
      achievements,
      total: achievements.length,
    })
  } catch (error) {
    console.error("Error obteniendo logros:", error)
    res.status(500).json({
      message: "Error al obtener logros",
      error: error.message,
    })
  }
}
