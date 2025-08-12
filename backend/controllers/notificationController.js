import Notification from "../models/Notification.js"

// GET /api/notifications - Obtener notificaciones del usuario
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.uid
    const { read, limit = 20, page = 1 } = req.query

    // Construir filtro
    const filter = { userId }
    if (read !== undefined) {
      filter.read = read === "true"
    }

    // Calcular skip para paginación
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Obtener notificaciones con paginación
    const notifications = await Notification.find(filter)
      .populate("habitId", "title description")
      .sort({ createdAt: -1 })
      .limit(Number.parseInt(limit))
      .skip(skip)

    // Contar total para paginación
    const total = await Notification.countDocuments(filter)
    const totalPages = Math.ceil(total / Number.parseInt(limit))

    res.status(200).json({
      notifications,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: Number.parseInt(limit),
        hasNextPage: Number.parseInt(page) < totalPages,
        hasPrevPage: Number.parseInt(page) > 1,
      },
    })
  } catch (error) {
    console.error("Error al obtener notificaciones:", error)
    res.status(500).json({
      message: "Error al obtener notificaciones",
      error: error.message,
    })
  }
}

// PUT /api/notifications/:id/read - Marcar notificación como leída
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.uid

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true },
      { new: true },
    ).populate("habitId", "title description")

    if (!notification) {
      return res.status(404).json({
        message: "Notificación no encontrada",
      })
    }

    res.status(200).json({
      message: "Notificación marcada como leída",
      notification,
    })
  } catch (error) {
    console.error("Error al marcar notificación como leída:", error)
    res.status(500).json({
      message: "Error al marcar notificación como leída",
      error: error.message,
    })
  }
}

// PUT /api/notifications/read-all - Marcar todas las notificaciones como leídas
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.uid

    const result = await Notification.updateMany({ userId, read: false }, { read: true })

    res.status(200).json({
      message: "Todas las notificaciones marcadas como leídas",
      modifiedCount: result.modifiedCount,
    })
  } catch (error) {
    console.error("Error al marcar todas las notificaciones como leídas:", error)
    res.status(500).json({
      message: "Error al marcar todas las notificaciones como leídas",
      error: error.message,
    })
  }
}
