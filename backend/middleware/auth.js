import admin from "firebase-admin"

// Inicializar Firebase Admin solo una vez
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "programacion4-a9a52", // Tu projectId desde config.js
  })
}

// Middleware para verificar el token de Firebase
export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Token de autorización requerido",
        error: "No authorization header found",
      })
    }

    const token = authHeader.split(" ")[1]

    // Verificar el token con Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token)

    // Agregar la información del usuario a la request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email,
    }

    console.log("✅ Usuario autenticado:", req.user.email) // Debug

    next()
  } catch (error) {
    console.error("❌ Error verificando token:", error.code, error.message)

    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        message: "Token expirado",
        error: "Token has expired",
      })
    }

    if (error.code === "auth/argument-error") {
      return res.status(401).json({
        message: "Token inválido",
        error: "Invalid token format",
      })
    }

    return res.status(401).json({
      message: "Token inválido",
      error: error.message,
    })
  }
}

// Middleware opcional para rutas que pueden funcionar con o sin autenticación
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1]
      const decodedToken = await admin.auth().verifyIdToken(token)

      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email,
      }
    }

    next()
  } catch (error) {
    // En caso de error, continúa sin usuario autenticado
    console.warn("Token opcional inválido:", error.message)
    next()
  }
}
