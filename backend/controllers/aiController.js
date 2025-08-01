import { getDailyAISuggestion } from "../services/aiService.js"

// GET /api/ai/suggest - Obtener sugerencia diaria de IA
export const getAISuggestion = async (req, res) => {
  try {
    const userId = req.user.uid // Assumes req.user.uid is set by authentication middleware

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado." })
    }

    const suggestion = await getDailyAISuggestion(userId)

    res.status(200).json(suggestion)
  } catch (error) {
    console.error("Error obteniendo sugerencia de IA:", error)
    res.status(500).json({
      message: "Error al obtener sugerencia de IA",
      error: error.message,
    })
  }
}