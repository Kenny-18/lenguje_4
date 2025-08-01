import express from "express"
import { updateUserPreferences, getUserPreferences } from "../controllers/userController.js"
import { authenticateUser } from "../middleware/auth.js"

const router = express.Router()

// Middleware para logging específico de rutas de usuario
router.use((req, res, next) => {
  console.log(`👤 User Preferences ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`)
  next()
})

// Aplicar autenticación a todas las rutas de usuario
router.use(authenticateUser)

// Rutas para preferencias de usuario
router.put("/preferences", updateUserPreferences) // PUT /api/users/preferences
router.get("/preferences", getUserPreferences) // GET /api/users/preferences

export default router
