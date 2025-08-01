"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../contexts/AuthContext"
import axiosInstance from "../axiosInstance"
import AchievementCard from "./AchievementCard"
import "../Achievements.css" // ✅ Corregido: agregar ../ para subir un nivel

const AchievementsList = () => {
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { currentUser } = useAuth()

  const fetchAchievements = useCallback(async () => {
    if (!currentUser) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)

      // Fetch all habits to get their titles for achievements
      const habitsResponse = await axiosInstance.get("/habits")
      const habitMap = new Map(habitsResponse.data.habits.map((h) => [h._id, h.title]))

      // Fetch achievements
      const achievementsResponse = await axiosInstance.get("/achievements")

      // Enrich achievements with habit titles
      const enrichedAchievements = achievementsResponse.data.achievements.map((ach) => ({
        ...ach,
        habitTitle: ach.habitId ? habitMap.get(ach.habitId) : null,
      }))

      setAchievements(enrichedAchievements)
      setError(null)
    } catch (err) {
      setError("Error al cargar logros: " + (err.response?.data?.message || err.message))
      console.error("Error fetching achievements:", err)
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    if (currentUser) {
      fetchAchievements()
    }
  }, [currentUser, fetchAchievements])

  if (!currentUser) {
    return <div className="loading">Verificando autenticación...</div>
  }

  if (loading) {
    return <div className="loading">Cargando tus logros...</div>
  }

  if (error) {
    return (
      <div className="error">
        {error}
        <button onClick={fetchAchievements} className="refresh-btn" style={{ marginTop: "10px" }}>
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="achievements-container">
      <h2>Tus Logros</h2>
      <p className="achievements-subtitle">¡Celebra tus hitos en el camino hacia la mejora personal!</p>

      {achievements.length === 0 ? (
        <div className="no-achievements">
          <p>Aún no has desbloqueado ningún logro.</p>
          <p>¡Sigue completando tus hábitos para ganar medallas!</p>
        </div>
      ) : (
        <div className="achievements-grid">
          {achievements.map((achievement) => (
            <AchievementCard key={achievement._id} achievement={achievement} />
          ))}
        </div>
      )}
      <div className="dashboard-actions">
        <button onClick={fetchAchievements} className="refresh-btn">
          Actualizar Logros
        </button>
      </div>
    </div>
  )
}

export default AchievementsList
