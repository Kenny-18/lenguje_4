import jwt from "jsonwebtoken"
import SharedProgress from "../models/SharedProgress.js"
import { addDays } from "date-fns"

// Ensure JWT_SECRET is loaded
const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey" // Fallback for development

// POST /api/share - Generar link público para compartir progreso
export const createShareLink = async (req, res) => {
  try {
    const { imageUrl, habitId } = req.body // imageUrl can be base64 or a public URL
    const userId = req.user.uid

    if (!imageUrl) {
      return res.status(400).json({ message: "La URL o datos de la imagen son requeridos." })
    }

    // Generate a unique token for this shareable link
    // The token itself will be the identifier for the SharedProgress document
    const uniqueToken = jwt.sign({ userId, habitId, timestamp: Date.now() }, JWT_SECRET, { expiresIn: "7d" }) // Token expires in 7 days

    const expiresAt = addDays(new Date(), 7) // Document also expires in 7 days

    const newSharedProgress = new SharedProgress({
      token: uniqueToken,
      userId,
      imageUrl,
      expiresAt,
      // If habitId is passed, store it
      ...(habitId && { habitId }),
    })

    await newSharedProgress.save()

    // Construct the public share URL, pointing to the backend's public route
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3000"
    const shareUrl = `${backendUrl}/share/${uniqueToken}`

    res.status(201).json({
      message: "Link para compartir generado exitosamente",
      shareUrl,
      token: uniqueToken,
    })
  } catch (error) {
    console.error("Error generando link para compartir:", error)
    res.status(500).json({
      message: "Error al generar link para compartir",
      error: error.message,
    })
  }
}

// GET /share/:token - Renderizar página pública de progreso compartido
export const getSharedProgress = async (req, res) => {
  try {
    const { token } = req.params

    // Verify JWT token
    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (jwtError) {
      return res
        .status(400)
        .send("<h1>Link de progreso inválido o expirado.</h1><p>Por favor, genera un nuevo link.</p>")
    }

    // Find the shared progress entry in the database
    const sharedProgress = await SharedProgress.findOne({ token })

    if (!sharedProgress || sharedProgress.expiresAt < new Date()) {
      return res
        .status(404)
        .send(
          "<h1>Progreso compartido no encontrado o expirado.</h1><p>El link puede haber caducado o fue eliminado.</p>",
        )
    }

    // Render a simple HTML page with the image
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3000"
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001"

    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Progreso de Hábito Compartido</title>
          <meta property="og:title" content="¡Mira mi progreso de hábitos!" />
          <meta property="og:description" content="He estado trabajando en mis hábitos y quiero compartir mi progreso contigo." />
          <meta property="og:image" content="${sharedProgress.imageUrl}" />
          <meta property="og:url" content="${backendUrl}/share/${token}" />
          <meta name="twitter:card" content="summary_large_image" />
          <style>
              body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  margin: 0;
                  background-color: #f0f2f5;
                  color: #333;
                  padding: 20px;
                  box-sizing: border-box;
              }
              .container {
                  background-color: #ffffff;
                  border-radius: 12px;
                  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                  padding: 30px;
                  text-align: center;
                  max-width: 600px;
                  width: 100%;
              }
              h1 {
                  color: #1f2937;
                  font-size: 2.2rem;
                  margin-bottom: 15px;
              }
              p {
                  color: #6b7280;
                  font-size: 1.1rem;
                  margin-bottom: 25px;
              }
              img {
                  max-width: 100%;
                  height: auto;
                  border-radius: 8px;
                  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
                  margin-bottom: 30px;
                  border: 1px solid #e5e7eb;
              }
              .cta-button {
                  display: inline-block;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 12px 25px;
                  border-radius: 8px;
                  text-decoration: none;
                  font-weight: 600;
                  font-size: 1.1rem;
                  transition: transform 0.2s ease, box-shadow 0.2s ease;
              }
              .cta-button:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 8px 15px rgba(102, 126, 234, 0.3);
              }
              .footer-text {
                  margin-top: 30px;
                  font-size: 0.9rem;
                  color: #9ca3af;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>¡Mira mi progreso de hábitos!</h1>
              <p>He estado trabajando en mis hábitos y quiero compartir mi progreso contigo. ¡Únete a mí en este viaje!</p>
              <img src="${sharedProgress.imageUrl}" alt="Progreso de Hábitos" />
              <a href="${frontendUrl}/dashboard" class="cta-button">¡Crea tus propios hábitos!</a>
          </div>
          <p class="footer-text">Compartido desde tu aplicación de seguimiento de hábitos.</p>
      </body>
      </html>
    `)
  } catch (error) {
    console.error("Error obteniendo progreso compartido:", error)
    res
      .status(500)
      .send("<h1>Error al cargar el progreso compartido.</h1><p>Por favor, inténtalo de nuevo más tarde.</p>")
  }
}
