import express from "express"
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/notificationController.js"
import { authenticateUser } from "../middleware/auth.js"

const router = express.Router()

// Middleware para logging específico de rutas de notificaciones
router.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl} - ${new Date().toISOString()}`)
  next()
})

// Aplicar autenticación a todas las rutas de notificaciones
router.use(authenticateUser)

// Rutas para notificaciones (todas requieren autenticación)
router.get("/", getNotifications) // GET /api/notifications
router.put("/:id/read", markNotificationAsRead) // PUT /api/notifications/:id/read
router.put("/read-all", markAllNotificationsAsRead) // PUT /api/notifications/read-all

export default router
