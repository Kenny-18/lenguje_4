import express from "express"
import { googleAuth, googleAuthCallback, getGoogleIntegrationStatus } from "../controllers/googleController.js"
import { authenticateUser } from "../middleware/auth.js"

const router = express.Router()

// Middleware para logging específico de rutas de Google
router.use((req, res, next) => {
  console.log(`🔗 Google ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`)
  next()
})

// Rutas para Google Calendar Integration
router.get("/auth", authenticateUser, googleAuth) // GET /api/integrations/google/auth
router.get("/callback", googleAuthCallback) // GET /api/integrations/google/callback
router.get("/status", authenticateUser, getGoogleIntegrationStatus) // GET /api/integrations/google/status

export default router
