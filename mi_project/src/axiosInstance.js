import axios from "axios"

// Configuración base de Axios
const axiosInstance = axios.create({
  baseURL: "http://localhost:3000/api", // URL del backend
  timeout: 10000, // Timeout de 10 segundos
  headers: {
    "Content-Type": "application/json",
  },
})

// Interceptor para requests (opcional - para agregar tokens, etc.)
axiosInstance.interceptors.request.use(
  (config) => {
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`)
    return config
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
  (error) => {
    console.error("❌ Error en la petición:", error.response?.data || error.message)

    // Manejo específico de errores
    if (error.response?.status === 404) {
      console.error("Recurso no encontrado")
    } else if (error.response?.status === 500) {
      console.error("Error interno del servidor")
    }

    return Promise.reject(error)
  },
)

export default axiosInstance
