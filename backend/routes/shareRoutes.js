import express from "express"
import { createShareLink, getSharedProgress } from "../controllers/shareController.js"
import { authenticateUser } from "../middleware/auth.js"

const router = express.Router()

// Middleware para logging específico de rutas de compartir
router.use((req, res, next) => {
  console.log(`🔗 Share ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`)
  next()
})

// POST /api/share - Generar link para compartir (requiere autenticación)
router.post("/", authenticateUser, createShareLink)

// GET /share/:token - Ver progreso compartido (público, no requiere autenticación)
// Nota: Esta ruta no tiene el prefijo /api para que sea una URL más limpia para compartir
router.get("/:token", getSharedProgress)

export default router
