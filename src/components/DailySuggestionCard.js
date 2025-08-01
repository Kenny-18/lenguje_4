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
      
      // Crear una instancia de axios con timeout específico para IA
      const aiRequest = axiosInstance.get("/ai/suggest", {
        timeout: 25000, // 25 segundos específico para IA
      })
      
      const response = await aiRequest
      setSuggestion(response.data)
      setRetryCount(0) // Reset retry count on success
    } catch (err) {
      console.error("Error fetching AI suggestion:", err)
      
      let errorMessage = "Error al cargar la sugerencia diaria"
      
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        errorMessage = "La IA está tardando más de lo esperado. Reintenta en unos momentos."
      } else if (err.response?.status === 503) {
        errorMessage = "El servicio de IA está temporalmente no disponible."
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      }
      
      setError(errorMessage)
      
      // Auto-retry hasta 2 veces con delay
      if (retryCount < 2 && (err.code === 'ECONNABORTED' || err.response?.status >= 500)) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
          fetchSuggestion()
        }, 3000 * (retryCount + 1)) // Delay incremental: 3s, 6s
      }
    } finally {
      setLoading(false)
    }
  }, [currentUser, retryCount])

  useEffect(() => {
    if (currentUser) {
      fetchSuggestion()
    }
  }, [currentUser, fetchSuggestion])

  const handleManualRetry = () => {
    setRetryCount(0)
    fetchSuggestion()
  }

  if (!currentUser) {
    return null // Don't render if not authenticated
  }

  if (loading) {
    return (
      <div className="daily-suggestion-card loading">
        <p>
          {retryCount > 0 
            ? `Reintentando... (${retryCount}/2)` 
            : "Cargando tu sugerencia diaria..."
          }
        </p>
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
    </div>
  )
}

export default DailySuggestionCard
