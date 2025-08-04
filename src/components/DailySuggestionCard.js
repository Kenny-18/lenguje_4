"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../contexts/AuthContext"
import axiosInstance from "../axiosInstance"
import "../DailySuggestionCard.css"

const DailySuggestionCard = () => {
  const [suggestion, setSuggestion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const { currentUser } = useAuth()

  const fetchSuggestion = useCallback(async () => {
    if (!currentUser) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await axiosInstance.get("/ai/suggest", {
        timeout: 25000,
      })

      setSuggestion(response.data)
      setRetryCount(0)
    } catch (err) {
      console.error("Error fetching AI suggestion:", err)

      let errorMessage = "Error al cargar la sugerencia diaria"

      if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
        errorMessage = "La IA está tardando más de lo esperado. Reintenta en unos momentos."
      } else if (err.response?.status === 503) {
        errorMessage = "El servicio de IA está temporalmente no disponible."
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      }

      setError(errorMessage)

      if (retryCount < 2 && (err.code === "ECONNABORTED" || err.response?.status >= 500)) {
        const nextRetryCount = retryCount + 1
        setRetryCount(nextRetryCount)

        setTimeout(() => {
          fetchSuggestion()
        }, 3000 * nextRetryCount)
      }
    } finally {
      setLoading(false)
    }
  }, [currentUser, retryCount])

  useEffect(() => {
    if (currentUser) {
      fetchSuggestion()
    }
  }, [currentUser, fetchSuggestion]) // ✅ Agregar fetchSuggestion a las dependencias

  const handleManualRetry = () => {
    setRetryCount(0)
    setError(null)
    fetchSuggestion()
  }

  if (!currentUser) {
    return null
  }

  if (loading) {
    return (
      <div className="daily-suggestion-card loading">
        <p>{retryCount > 0 ? `Reintentando... (${retryCount}/2)` : "Cargando tu sugerencia diaria..."}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="daily-suggestion-card error">
        <p>{error}</p>
        <button onClick={handleManualRetry} className="refresh-suggestion-btn">
          Reintentar
        </button>
      </div>
    )
  }

  if (!suggestion) {
    return (
      <div className="daily-suggestion-card no-suggestion">
        <p>No se pudo cargar una sugerencia diaria hoy.</p>
        <button onClick={handleManualRetry} className="refresh-suggestion-btn">
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="daily-suggestion-card">
      <div className="suggestion-header">
        <h3>✨ Sugerencia Diaria de IA</h3>
        <button onClick={handleManualRetry} className="refresh-suggestion-btn" title="Obtener nueva sugerencia">
          🔄
        </button>
      </div>
      <h4 className="suggestion-title">{suggestion.title}</h4>
      <p className="suggestion-reason">{suggestion.reason}</p>
      {suggestion.moodConsidered && ( // NEW: Display badge if mood was considered
        <span className="mood-badge">Basado en tu ánimo reciente</span>
      )}
    </div>
  )
}

export default DailySuggestionCard
