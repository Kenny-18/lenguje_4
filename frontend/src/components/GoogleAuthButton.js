"use client"

import { useState, useEffect } from "react"
import axiosInstance from "../axiosInstance"
import { useAuth } from "../contexts/AuthContext"

const GoogleAuthButton = () => {
  const { currentUser } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkConnectionStatus = async () => {
      if (!currentUser) {
        setLoading(false)
        return
      }
      try {
        const response = await axiosInstance.get("/integrations/google/status")
        setIsConnected(response.data.isConnected)
      } catch (err) {
        console.error("Error checking Google connection status:", err)
        setIsConnected(false)
      } finally {
        setLoading(false)
      }
    }

    checkConnectionStatus()

    // Check URL for OAuth success/error messages
    const params = new URLSearchParams(window.location.search)
    if (params.get("googleAuthSuccess")) {
      setIsConnected(true)
      alert("Conexión con Google Calendar exitosa!")
      // Clean up URL
      params.delete("googleAuthSuccess")
      window.history.replaceState(
        {},
        document.title,
        `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`,
      )
    } else if (params.get("googleAuthError")) {
      alert(`Error al conectar con Google Calendar: ${params.get("googleAuthError")}`)
      // Clean up URL
      params.delete("googleAuthError")
      window.history.replaceState(
        {},
        document.title,
        `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`,
      )
    }
  }, [currentUser])

  const handleConnect = async () => {
    if (!currentUser) {
      alert("Debes iniciar sesión para conectar Google Calendar.")
      return
    }
    try {
      setLoading(true)
      const response = await axiosInstance.get("/integrations/google/auth")
      if (response.data.authUrl) {
        window.location.href = response.data.authUrl
      }
    } catch (err) {
      console.error("Error initiating Google OAuth:", err)
      alert("No se pudo iniciar la conexión con Google Calendar.")
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <button className="auth-button google" disabled>
        Cargando...
      </button>
    )
  }

  return (
    <button
      onClick={handleConnect}
      className="auth-button google"
      disabled={isConnected}
      title={isConnected ? "Ya conectado a Google Calendar" : "Conectar Google Calendar"}
    >
      <span className="social-icon">🗓️</span>
      {isConnected ? "Google Calendar Conectado" : "Conectar Google Calendar"}
    </button>
  )
}

export default GoogleAuthButton
