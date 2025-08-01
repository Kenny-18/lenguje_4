"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../contexts/AuthContext"
import axiosInstance from "../axiosInstance"
import EmojiPicker from "emoji-picker-react"
import { format, isSameDay, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import "../MoodTracker.css"

const MoodTracker = () => {
  const [selectedEmoji, setSelectedEmoji] = useState("")
  const [noteText, setNoteText] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [todayMoodNote, setTodayMoodNote] = useState(null)
  const [moodNotes, setMoodNotes] = useState([])
  const [dateRange, setDateRange] = useState("last30days") // Default range

  const { currentUser } = useAuth()
  const MAX_NOTE_CHARS = 200

  const fetchTodayMoodNote = useCallback(async () => {
    if (!currentUser) return
    try {
      const response = await axiosInstance.get("/moods?range=today")
      if (response.data.moodNotes.length > 0) {
        setTodayMoodNote(response.data.moodNotes[0])
        setSelectedEmoji(response.data.moodNotes[0].emoji)
        setNoteText(response.data.moodNotes[0].note)
      } else {
        setTodayMoodNote(null)
        setSelectedEmoji("")
        setNoteText("")
      }
    } catch (err) {
      console.error("Error fetching today's mood note:", err)
      // Don't set global error for this, just indicate no note found
      setTodayMoodNote(null)
    }
  }, [currentUser])

  const fetchMoodNotes = useCallback(
    async (range) => {
      if (!currentUser) return
      setIsLoading(true)
      setError(null)
      try {
        const response = await axiosInstance.get(`/moods?range=${range}`)
        setMoodNotes(response.data.moodNotes)
      } catch (err) {
        setError("Error al cargar el historial de estados de ánimo: " + (err.response?.data?.message || err.message))
        console.error("Error fetching mood notes:", err)
      } finally {
        setIsLoading(false)
      }
    },
    [currentUser],
  )

  useEffect(() => {
    if (currentUser) {
      fetchTodayMoodNote()
      fetchMoodNotes(dateRange)
    }
  }, [currentUser, fetchTodayMoodNote, fetchMoodNotes, dateRange])

  const handleEmojiClick = (emojiObject) => {
    setSelectedEmoji(emojiObject.emoji)
    setError(null) // Clear error when emoji is selected
  }

  const handleNoteChange = (e) => {
    const text = e.target.value
    if (text.length <= MAX_NOTE_CHARS) {
      setNoteText(text)
    }
    setError(null) // Clear error when note is changed
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedEmoji) {
      setError("Por favor, selecciona un emoji para tu estado de ánimo.")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await axiosInstance.post("/moods", {
        emoji: selectedEmoji,
        note: noteText,
      })
      setSuccessMessage(response.data.message)
      setTodayMoodNote(response.data.moodNote) // Update with the newly created note
      fetchMoodNotes(dateRange) // Refresh the list
    } catch (err) {
      setError("Error al registrar estado de ánimo: " + (err.response?.data?.message || err.message))
      console.error("Error submitting mood note:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRangeChange = (e) => {
    const newRange = e.target.value
    setDateRange(newRange)
    fetchMoodNotes(newRange)
  }

  if (!currentUser) {
    return <div className="loading">Verificando autenticación...</div>
  }

  if (isLoading && moodNotes.length === 0) {
    return <div className="loading">Cargando estados de ánimo...</div>
  }

  return (
    <div className="mood-tracker-container">
      <h2>Registro de Estado de Ánimo</h2>
      <p className="mood-subtitle">Selecciona un emoji y escribe una nota corta sobre cómo te sientes hoy.</p>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="mood-input-section">
        {todayMoodNote ? (
          <div className="mood-today-recorded">
            <h3>¡Ya registraste tu estado de ánimo de hoy!</h3>
            <div className="recorded-mood-display">
              <span className="recorded-emoji">{todayMoodNote.emoji}</span>
              <p className="recorded-note">{todayMoodNote.note || "Sin nota."}</p>
            </div>
            <p className="recorded-message">Puedes ver tu historial abajo.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mood-form">
            <div className="emoji-picker-wrapper">
              <label className="form-label">Selecciona tu emoji:</label>
              <div className="selected-emoji-display">
                {selectedEmoji ? (
                  <span className="current-emoji">{selectedEmoji}</span>
                ) : (
                  <span className="placeholder-emoji">😊</span>
                )}
              </div>
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width="100%"
                height={300}
                emojiStyle="native"
                searchDisabled={false}
                skinToneDisabled={true}
                lazyLoadEmojis={true}
                previewConfig={{ showPreview: false }}
                suggestedEmojisMode="recent"
              />
            </div>

            <div className="form-group">
              <label htmlFor="mood-note" className="form-label">
                Nota diaria (opcional, {noteText.length}/{MAX_NOTE_CHARS} caracteres):
              </label>
              <textarea
                id="mood-note"
                value={noteText}
                onChange={handleNoteChange}
                placeholder="Escribe una nota corta sobre tu día..."
                maxLength={MAX_NOTE_CHARS}
                rows="3"
                className="mood-textarea"
              ></textarea>
            </div>

            <button type="submit" className="submit-mood-btn" disabled={isLoading || !selectedEmoji}>
              {isLoading ? "Guardando..." : "Guardar Estado de Ánimo"}
            </button>
          </form>
        )}
      </div>

      <div className="mood-history-section">
        <h3>Historial de Estados de Ánimo</h3>
        <div className="history-controls">
          <label htmlFor="mood-range-filter">Mostrar:</label>
          <select id="mood-range-filter" value={dateRange} onChange={handleRangeChange} className="range-select">
            <option value="last7days">Últimos 7 días</option>
            <option value="last30days">Últimos 30 días</option>
            <option value="all">Todo el historial</option>
          </select>
        </div>

        {isLoading ? (
          <div className="loading">Cargando historial...</div>
        ) : moodNotes.length === 0 ? (
          <div className="no-mood-notes">
            <p>No hay registros de estado de ánimo para el rango seleccionado.</p>
            <p>¡Empieza a registrar cómo te sientes hoy!</p>
          </div>
        ) : (
          <ul className="mood-notes-list">
            {moodNotes.map((mood) => (
              <li key={mood._id} className="mood-note-item">
                <div className="mood-item-date">
                  {format(parseISO(mood.date), "dd/MM/yyyy", { locale: es })}
                  {isSameDay(parseISO(mood.date), new Date()) && <span className="today-badge">Hoy</span>}
                </div>
                <div className="mood-item-content">
                  <span className="mood-item-emoji">{mood.emoji}</span>
                  <p className="mood-item-note">{mood.note || "Sin nota."}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default MoodTracker
