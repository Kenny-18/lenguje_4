"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../contexts/AuthContext"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import axiosInstance from "../axiosInstance"
import HabitsSearch from "./HabitsSearch"
import SyncHabitToCalendarButton from "./SyncHabitToCalendarButton" // ✅ Corregido
import "../HabitsSearch.css"

const HabitsList = () => {
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)
  const [checkingIn, setCheckingIn] = useState({})
  const [todayCheckins, setTodayCheckins] = useState({})

  const { currentUser } = useAuth()

  // Estado para el formulario
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    frequency: "daily",
  })

  // Estado para manejar la edición
  const [editingHabit, setEditingHabit] = useState(null)
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    frequency: "daily",
  })
  const [updating, setUpdating] = useState(false)

  // Estados para búsqueda y filtros
  const [searchMeta, setSearchMeta] = useState({
    total: 0,
    filtered: 0,
    hasFilters: false,
    filters: {},
  })
  const [currentFilters, setCurrentFilters] = useState({
    search: null,
    frequency: null,
  })

  // Función para obtener hábitos del backend con filtros
  const fetchHabits = useCallback(
    async (filters = {}) => {
      if (!currentUser) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Construir query parameters
        const params = new URLSearchParams()
        if (filters.search) params.append("search", filters.search)
        if (filters.frequency) params.append("frequency", filters.frequency)

        const queryString = params.toString()
        const url = queryString ? `/habits?${queryString}` : "/habits"

        const response = await axiosInstance.get(url)

        // Manejar respuesta con metadata
        if (response.data.habits) {
          setHabits(response.data.habits)
          setSearchMeta(response.data.meta)
        } else {
          // Compatibilidad con respuesta anterior
          setHabits(response.data)
          setSearchMeta({
            total: response.data.length,
            filtered: response.data.length,
            hasFilters: false,
            filters: {},
          })
        }

        setError(null)

        // Verificar check-ins de hoy para cada hábito
        const habitsData = response.data.habits || response.data
        const checkinPromises = habitsData.map(async (habit) => {
          try {
            const checkinResponse = await axiosInstance.get(`/habits/${habit._id}/checkins/today`)
            return {
              habitId: habit._id,
              hasCheckinToday: checkinResponse.data.hasCheckinToday,
              checkin: checkinResponse.data.checkin,
            }
          } catch (err) {
            console.error(`Error verificando check-in para hábito ${habit._id}:`, err)
            return {
              habitId: habit._id,
              hasCheckinToday: false,
              checkin: null,
            }
          }
        })

        const checkinResults = await Promise.all(checkinPromises)
        const checkinMap = {}
        checkinResults.forEach((result) => {
          checkinMap[result.habitId] = result
        })
        setTodayCheckins(checkinMap)
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
    },
    [currentUser],
  )

  // Función para manejar cambios en filtros
  const handleFiltersChange = useCallback(
    (newFilters) => {
      setCurrentFilters(newFilters)
      fetchHabits(newFilters)
    },
    [fetchHabits],
  )

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

      // Inicializar check-in status para el nuevo hábito
      setTodayCheckins((prev) => ({
        ...prev,
        [response.data._id]: {
          habitId: response.data._id,
          hasCheckinToday: false,
          checkin: null,
        },
      }))
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

  // Función para hacer check-in
  const handleCheckin = async (habitId) => {
    try {
      setCheckingIn((prev) => ({ ...prev, [habitId]: true }))

      const response = await axiosInstance.post(`/habits/${habitId}/checkins`)

      // Actualizar el estado local
      setTodayCheckins((prev) => ({
        ...prev,
        [habitId]: {
          habitId,
          hasCheckinToday: true,
          checkin: response.data.checkin,
        },
      }))

      // Actualizar el hábito con las nuevas rachas
      setHabits((prevHabits) =>
        prevHabits.map((habit) =>
          habit._id === habitId
            ? {
                ...habit,
                streakCurrent: response.data.habit.streakCurrent,
                streakBest: response.data.habit.streakBest,
                lastCheckinDate: response.data.habit.lastCheckinDate,
              }
            : habit,
        ),
      )

      setError(null)
    } catch (err) {
      if (err.response?.status === 400) {
        setError("Ya realizaste el check-in de hoy para este hábito")
      } else if (err.response?.status === 401) {
        setError("Sesión expirada. Por favor, inicia sesión nuevamente.")
      } else {
        setError("Error al realizar check-in: " + (err.response?.data?.message || err.message))
      }
    } finally {
      setCheckingIn((prev) => ({ ...prev, [habitId]: false }))
    }
  }

  // Función para eliminar un hábito
  const deleteHabit = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este hábito?")) return

    try {
      await axiosInstance.delete(`/habits/${id}`)
      setHabits(habits.filter((habit) => habit._id !== id))
      // Limpiar check-in status
      setTodayCheckins((prev) => {
        const newState = { ...prev }
        delete newState[id]
        return newState
      })
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

  // Función para iniciar la edición de un hábito
  const startEditing = (habit) => {
    setEditingHabit(habit._id)
    setEditFormData({
      title: habit.title,
      description: habit.description || "",
      frequency: habit.frequency,
    })
  }

  // Función para cancelar la edición
  const cancelEditing = () => {
    setEditingHabit(null)
    setEditFormData({ title: "", description: "", frequency: "daily" })
  }

  // Función para actualizar un hábito
  const updateHabit = async (id) => {
    if (!editFormData.title.trim()) return

    try {
      setUpdating(true)
      const response = await axiosInstance.put(`/habits/${id}`, editFormData)

      // Actualizar el hábito en la lista local
      setHabits(habits.map((habit) => (habit._id === id ? response.data : habit)))

      // Limpiar el estado de edición
      setEditingHabit(null)
      setEditFormData({ title: "", description: "", frequency: "daily" })
      setError(null)
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Sesión expirada. Por favor, inicia sesión nuevamente.")
      } else if (err.response?.status === 404) {
        setError("Hábito no encontrado o no tienes permisos para modificarlo.")
      } else {
        setError("Error al actualizar hábito: " + (err.response?.data?.message || err.message))
      }
    } finally {
      setUpdating(false)
    }
  }

  // useEffect para cargar datos cuando el usuario esté autenticado
  useEffect(() => {
    if (currentUser) {
      fetchHabits()
    }
  }, [currentUser, fetchHabits])

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

      {/* Componente de búsqueda y filtros */}
      <HabitsSearch
        onFiltersChange={handleFiltersChange}
        totalHabits={searchMeta.total}
        filteredCount={searchMeta.filtered}
        currentFilters={currentFilters}
      />

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
              {editingHabit === habit._id ? (
                // Formulario de edición inline
                <div className="habit-edit-form">
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    placeholder="Título del hábito"
                    className="edit-input"
                  />
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    placeholder="Descripción (opcional)"
                    className="edit-textarea"
                  />
                  <select
                    value={editFormData.frequency}
                    onChange={(e) => setEditFormData({ ...editFormData, frequency: e.target.value })}
                    className="edit-select"
                  >
                    <option value="daily">Diario</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                  </select>
                  <div className="edit-buttons">
                    <button onClick={() => updateHabit(habit._id)} className="save-btn" disabled={updating}>
                      {updating ? "Guardando..." : "Guardar"}
                    </button>
                    <button onClick={cancelEditing} className="cancel-btn" disabled={updating}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                // Vista normal del hábito
                <>
                  <div className="habit-content">
                    <h3>{habit.title}</h3>
                    {habit.description && <p>{habit.description}</p>}
                    <div className="habit-meta">
                      <span className="frequency">Frecuencia: {habit.frequency}</span>
                      <span className="created-date">Creado: {new Date(habit.createdAt).toLocaleDateString()}</span>
                      {habit.streakCurrent > 0 && (
                        <span className="streak-current">Racha actual: {habit.streakCurrent} días</span>
                      )}
                      {habit.streakBest > 0 && (
                        <span className="streak-best">Mejor racha: {habit.streakBest} días</span>
                      )}
                      {habit.lastCheckinDate && (
                        <span className="last-checkin">
                          Último check-in: {format(new Date(habit.lastCheckinDate), "dd/MM/yyyy", { locale: es })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="habit-actions">
                    {/* Botón de Check-in */}
                    {habit.frequency === "daily" && (
                      <button
                        onClick={() => handleCheckin(habit._id)}
                        className={`checkin-btn ${
                          todayCheckins[habit._id]?.hasCheckinToday ? "checkin-completed" : ""
                        }`}
                        disabled={
                          todayCheckins[habit._id]?.hasCheckinToday || checkingIn[habit._id] || editingHabit !== null
                        }
                      >
                        {checkingIn[habit._id]
                          ? "..."
                          : todayCheckins[habit._id]?.hasCheckinToday
                            ? "✅ Completado"
                            : "✔ Hoy"}
                      </button>
                    )}
                    <SyncHabitToCalendarButton habitId={habit._id} habitTitle={habit.title} /> {/* New button */}
                    <button onClick={() => startEditing(habit)} className="edit-btn" disabled={editingHabit !== null}>
                      Editar
                    </button>
                    <button
                      onClick={() => deleteHabit(habit._id)}
                      className="delete-btn"
                      disabled={editingHabit !== null}
                    >
                      Eliminar
                    </button>
                  </div>
                </>
              )}
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
