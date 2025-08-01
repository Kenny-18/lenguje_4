import UserPreference from "../models/UserPreference.js"

// PUT /api/users/preferences - Actualizar preferencias del usuario
export const updateUserPreferences = async (req, res) => {
  try {
    const userId = req.user.uid
    const { theme } = req.body

    if (!theme || !["light", "dark"].includes(theme)) {
      return res.status(400).json({ message: "Tema inválido. Debe ser 'light' o 'dark'." })
    }

    const updatedPreference = await UserPreference.findOneAndUpdate(
      { userId },
      { userId, theme },
      { upsert: true, new: true, runValidators: true },
    )

    res.status(200).json({
      message: "Preferencias de usuario actualizadas exitosamente",
      preferences: updatedPreference,
    })
  } catch (error) {
    console.error("Error actualizando preferencias de usuario:", error)
    res.status(500).json({
      message: "Error al actualizar preferencias de usuario",
      error: error.message,
    })
  }
}

// GET /api/users/preferences - Obtener preferencias del usuario
export const getUserPreferences = async (req, res) => {
  try {
    const userId = req.user.uid
    const preferences = await UserPreference.findOne({ userId })

    res.status(200).json({
      preferences: preferences || { userId, theme: "light" }, // Retorna el valor por defecto si no se encuentra
    })
  } catch (error) {
    console.error("Error obteniendo preferencias de usuario:", error)
    res.status(500).json({
      message: "Error al obtener preferencias de usuario",
      error: error.message,
    })
  }
}
