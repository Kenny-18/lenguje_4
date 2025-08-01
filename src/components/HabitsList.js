"use client"

import { useState, useEffect } from "react"
import axiosInstance from "../axiosInstance"

const HabitsList = () => {
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)

  // Estado para el formulario
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    frequency: "daily",
  })

  // Función para obtener hábitos del backend
  const fetchHabits = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get("/habits")
      setHabits(response.data)
      setError(null)
    } catch (err) {
      setError("Error al cargar los hábitos: " + err.message)
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
      setError("Error al crear hábito: " + err.message)
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
      setError("Error al eliminar hábito: " + err.message)
    }
  }

  // useEffect para cargar datos al montar el componente
  useEffect(() => {
    fetchHabits()
  }, [])

  if (loading) return <div className="loading">Cargando hábitos...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="habits-container">
      <h2>Sistema de Gestión de Hábitos</h2>

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
        <p>No hay hábitos registrados. ¡Crea tu primer hábito!</p>
      ) : (
        <ul className="habits-list">
          {habits.map((habit) => (
            <li key={habit._id} className="habit-item">
              <div className="habit-content">
                <h3>{habit.title}</h3>
                <p>{habit.description}</p>
                <span className="frequency">Frecuencia: {habit.frequency}</span>
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
