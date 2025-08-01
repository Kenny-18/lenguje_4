"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import axiosInstance from "../axiosInstance"
import "./SyncHabitToCalendarButton.css"

const SyncHabitToCalendarButton = ({ habitId, habitTitle }) => {
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState(null)
  const [isError, setIsError] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const timeoutRef = useRef(null)
  const { currentUser } = useAuth()

  // Verificar conexión al montar el componente
  useEffect(() => {
    const checkGoogleConnection = async () => {
      if (!currentUser) return
      
      try {
        const response = await axiosInstance.get("/integrations/google/status")
        setIsConnected(response.data.isConnected)
      } catch (error) {
        console.error("Error verificando conexión Google:", error)
        setIsConnected(false)
      }
    }

    checkGoogleConnection()
  }, [currentUser])

  // Limpiar timeout al desmontar el componente
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleSync = async () => {
    if (!currentUser) {
      setMessage("Debes iniciar sesión para sincronizar con Google Calendar.")
      setIsError(true)
      return
    }

    setSyncing(true)
    setMessage(null)
    setIsError(false)
    
    // Limpiar timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    try {
      if (!isConnected) {
        // Si no está conectado, iniciar el flujo de autenticación
        const response = await axiosInstance.get("/integrations/google/auth")
        if (response.data.authUrl) {
          setMessage("Redirigiendo a Google para autorización...")
          window.location.href = response.data.authUrl
          return
        }
      } else {
        // Si ya está conectado, proceder con la sincronización
        const syncResponse = await axiosInstance.post(`/habits/${habitId}/sync-calendar`)
        setMessage(`"${habitTitle}" sincronizado con Google Calendar!`)
        setIsError(false)
        console.log("Google Calendar Event:", syncResponse.data.event)
      }
    } catch (err) {
      console.error("Error en sincronización:", err)
      setMessage(`Error: ${err.response?.data?.message || err.message}`)
      setIsError(true)
    } finally {
      setSyncing(false)
      // Usar ref para poder limpiar el timeout
      timeoutRef.current = setTimeout(() => setMessage(null), 5000)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
      <button
        onClick={handleSync}
        className="sync-calendar-btn"
        disabled={syncing}
        title={isConnected ? "Sincronizar con Google Calendar" : "Conectar y sincronizar con Google Calendar"}
      >
        {syncing ? "🔄 Sincronizando..." : isConnected ? "📅 Sincronizar GCal" : "🔗 Conectar GCal"}
      </button>
      {message && (
        <span className={`sync-message ${isError ? 'error' : 'success'}`}>
          {message}
        </span>
      )}
    </div>
  )
}

export default SyncHabitToCalendarButton
