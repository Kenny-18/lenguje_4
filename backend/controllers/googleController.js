import { google } from "googleapis"
import UserIntegration from "../models/UserIntegration.js"

// Configuración hardcodeada temporal (SOLO para desarrollo)
const GOOGLE_CLIENT_ID = "565430349554-9g8iv5nhtaohdqu3a22o3aj2rqe6mki1.apps.googleusercontent.com"
const GOOGLE_CLIENT_SECRET = "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"
const GOOGLE_REDIRECT_URI = "http://localhost:3000/api/integrations/google/callback"

// Configurar OAuth2 client con valores hardcodeados
const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)

console.log("🔧 Configuración Google (hardcodeada):")
console.log("CLIENT_ID:", GOOGLE_CLIENT_ID ? "✅ Configurado" : "❌ Falta")
console.log("CLIENT_SECRET:", GOOGLE_CLIENT_SECRET ? "✅ Configurado" : "❌ Falta")
console.log("REDIRECT_URI:", GOOGLE_REDIRECT_URI)

const SCOPES = ["https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/calendar"]

// GET /api/integrations/google/auth - Iniciar el flujo de OAuth
export const googleAuth = (req, res) => {
  console.log("🔗 Iniciando flujo OAuth de Google...")
  console.log("👤 Usuario:", req.user.uid)

  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "consent",
      state: req.user.uid,
    })

    console.log("✅ URL de autorización generada:", authUrl)
    res.json({ authUrl })
  } catch (error) {
    console.error("❌ Error generando URL de autorización:", error)
    res.status(500).json({
      message: "Error generando URL de autorización",
      error: error.message,
    })
  }
}

// GET /api/integrations/google/callback - Manejar el callback de OAuth
export const googleAuthCallback = async (req, res) => {
  console.log("🔄 Procesando callback de Google...")
  console.log("📋 Query params:", req.query)

  const { code, state: userId } = req.query

  if (!code || !userId) {
    console.error("❌ Faltan parámetros:", { code: !!code, userId: !!userId })
    return res.status(400).json({ message: "Faltan parámetros de código o estado." })
  }

  try {
    const { tokens } = await oauth2Client.getToken(code)
    console.log("✅ Tokens obtenidos:", {
      access_token: !!tokens.access_token,
      refresh_token: !!tokens.refresh_token,
    })

    if (!tokens.refresh_token) {
      console.warn("⚠️ No se recibió refresh token")
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001"
      return res.redirect(`${frontendUrl}/dashboard?googleAuthError=no_refresh_token`)
    }

    // Guardar tokens en la base de datos
    await UserIntegration.findOneAndUpdate(
      { userId },
      {
        userId,
        "google.refreshToken": tokens.refresh_token,
        "google.lastSync": new Date(),
      },
      { upsert: true, new: true },
    )

    console.log(`✅ Refresh token guardado para usuario: ${userId}`)
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001"
    res.redirect(`${frontendUrl}/dashboard?googleAuthSuccess=true`)
  } catch (error) {
    console.error("❌ Error en callback:", error.message)
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001"
    res.redirect(`${frontendUrl}/dashboard?googleAuthError=${encodeURIComponent(error.message)}`)
  }
}

// GET /api/integrations/google/status - Verificar si el usuario tiene la integración activa
export const getGoogleIntegrationStatus = async (req, res) => {
  try {
    const userId = req.user.uid
    const userIntegration = await UserIntegration.findOne({ userId })

    res.status(200).json({
      isConnected: !!userIntegration?.google?.refreshToken,
      lastSync: userIntegration?.google?.lastSync,
    })
  } catch (error) {
    console.error("Error obteniendo estado de integración de Google:", error)
    res.status(500).json({ message: "Error al obtener estado de integración de Google" })
  }
}
