"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import axiosInstance from "../axiosInstance"

const HabitsList = () => {
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)

  const { currentUser } = useAuth()

  // Estado para el formulario
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    frequency: "daily",
  })

  // Función para obtener hábitos del backend
  const fetchHabits = async () => {
    if (!currentUser) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await axiosInstance.get("/habits")
      setHabits(response.data)
      setError(null)
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Sesión expirada. Por favor, inicia sesión nuevamente.")
      } else {
        setError("Error al cargar los hábitos: " + (err.response?.data?.message || err.message))
      }
      console.error("Error fetching habits:", err)
    } finally {
      setLoading(false)
    }
  }

  // Función para crear un nuevo hábito
  const createHabit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    try {
      setCreating(true)
      const response = await axiosInstance.post("/habits", formData)
      setHabits([response.data, ...habits])
      setFormData({ title: "", description: "", frequency: "daily" })
      setError(null)
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Sesión expirada. Por favor, inicia sesión nuevamente.")
      } else {
        setError("Error al crear hábito: " + (err.response?.data?.message || err.message))
      }
    } finally {
      setCreating(false)
    }
  }

  // Función para eliminar un hábito
  const deleteHabit = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este hábito?")) return

    try {
      await axiosInstance.delete(`/habits/${id}`)
      setHabits(habits.filter((habit) => habit._id !== id))
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Sesión expirada. Por favor, inicia sesión nuevamente.")
      } else if (err.response?.status === 404) {
        setError("Hábito no encontrado o no tienes permisos para eliminarlo.")
      } else {
        setError("Error al eliminar hábito: " + (err.response?.data?.message || err.message))
      }
    }
  }

  // useEffect para cargar datos cuando el usuario esté autenticado
  useEffect(() => {
    if (currentUser) {
      fetchHabits()
    }
  }, [currentUser])

  if (!currentUser) {
    return <div className="loading">Verificando autenticación...</div>
  }

  if (loading) return <div className="loading">Cargando tus hábitos...</div>

  if (error) {
    return (
      <div className="error">
        {error}
        <button onClick={fetchHabits} className="refresh-btn" style={{ marginTop: "10px" }}>
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="habits-container">
      <h2>Mis Hábitos Personales</h2>
      <p className="user-info">Gestiona tus hábitos, {currentUser.displayName || currentUser.email}</p>

      {/* Formulario para crear hábitos */}
      <form onSubmit={createHabit} className="habit-form">
        <input
          type="text"
          placeholder="Título del hábito"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
        <textarea
          placeholder="Descripción (opcional)"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
        <select value={formData.frequency} onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}>
          <option value="daily">Diario</option>
          <option value="weekly">Semanal</option>
          <option value="monthly">Mensual</option>
        </select>
        <button type="submit" disabled={creating}>
          {creating ? "Creando..." : "Crear Hábito"}
        </button>
      </form>

      {/* Lista de hábitos */}
      {habits.length === 0 ? (
        <div className="no-habits">
          <p>No tienes hábitos registrados aún.</p>
          <p>¡Crea tu primer hábito usando el formulario de arriba!</p>
        </div>
      ) : (
        <ul className="habits-list">
          {habits.map((habit) => (
            <li key={habit._id} className="habit-item">
              <div className="habit-content">
                <h3>{habit.title}</h3>
                {habit.description && <p>{habit.description}</p>}
                <div className="habit-meta">
                  <span className="frequency">Frecuencia: {habit.frequency}</span>
                  <span className="created-date">Creado: {new Date(habit.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <button onClick={() => deleteHabit(habit._id)} className="delete-btn">
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}

      <button onClick={fetchHabits} className="refresh-btn">
        Actualizar Lista
      </button>
    </div>
  )
}

export default HabitsList
