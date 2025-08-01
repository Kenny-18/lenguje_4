import axios from "axios"
import { auth } from "./firebase/config"

// Configuración base de Axios
const axiosInstance = axios.create({
  baseURL: "http://localhost:3000/api", // URL del backend
  timeout: 10000, // Timeout de 10 segundos
  headers: {
    "Content-Type": "application/json",
  },
})

// Interceptor para requests - agregar token de autenticación automáticamente
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      // Obtener el usuario actual
      const currentUser = auth.currentUser

      if (currentUser) {
        // Obtener el token de ID del usuario
        const token = await currentUser.getIdToken()
        config.headers.Authorization = `Bearer ${token}`
      }

      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`)
      return config
    } catch (error) {
      console.error("Error obteniendo token:", error)
      return config
    }
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Interceptor para manejar errores globalmente
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`)
    return response
  },
  async (error) => {
    console.error("❌ Error en la petición:", error.response?.data || error.message)

    // Manejo específico de errores de autenticación
    if (error.response?.status === 401) {
      console.error("🔐 Error de autenticación:", error.response.data)
      
      // Verificar si el usuario aún existe
      const currentUser = auth.currentUser
      if (!currentUser) {
        console.error("❌ Usuario no encontrado en auth")
        window.location.href = "/login"
        return
      }

      console.log("🔄 Intentando renovar token...")
      
      try {
        const newToken = await currentUser.getIdToken(true) // Forzar renovación
        console.log("✅ Token renovado exitosamente")

        // Reintentar la petición original
        const originalRequest = error.config
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        console.error("❌ Error renovando token:", refreshError)
        window.location.href = "/login"
      }
    } else if (error.response?.status === 404) {
      console.error("Recurso no encontrado")
    } else if (error.response?.status === 500) {
      console.error("Error interno del servidor")
    }

    return Promise.reject(error)
  },
)

export default axiosInstance
