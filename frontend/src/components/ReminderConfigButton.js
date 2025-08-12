"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import axiosInstance from "../axiosInstance"
import "./ReminderConfigButton.css"

const ReminderConfigButton = ({ habitId, habitTitle, currentReminder }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [isError, setIsError] = useState(false)
  const { currentUser } = useAuth()

  // Estado del formulario
  const [formData, setFormData] = useState({
    time: "",
    channels: [],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })

  // Cargar datos actuales del recordatorio
  useEffect(() => {
    if (currentReminder && currentReminder.enabled) {
      setFormData({
        time: currentReminder.time || "",
        channels: currentReminder.channels || [],
        timezone: currentReminder.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
    }
  }, [currentReminder])

  const handleChannelChange = (channel) => {
    setFormData((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel],
    }))
  }

  const handleSave = async () => {
    if (!currentUser) {
      setMessage("Debes iniciar sesión para configurar recordatorios.")
      setIsError(true)
      return
    }

    if (!formData.time) {
      setMessage("Por favor selecciona una hora para el recordatorio.")
      setIsError(true)
      return
    }

    if (formData.channels.length === 0) {
      setMessage("Por favor selecciona al menos un canal de notificación.")
      setIsError(true)
      return
    }

    setSaving(true)
    setMessage(null)
    setIsError(false)

    try {
        await axiosInstance.put(`/habits/${habitId}/reminder`, {
            time: formData.time,
            channels: formData.channels,
            timezone: formData.timezone,
        })

      setMessage("Recordatorio configurado correctamente!")
      setIsError(false)
      setIsOpen(false)

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      console.error("Error configurando recordatorio:", err)
      setMessage(`Error: ${err.response?.data?.message || err.message}`)
      setIsError(true)
    } finally {
      setSaving(false)
    }
  }

  const handleDisable = async () => {
    setSaving(true)
    setMessage(null)
    setIsError(false)

    try {
      await axiosInstance.put(`/habits/${habitId}/reminder`, {
        time: null,
        channels: [],
        timezone: null,
      })

      setMessage("Recordatorio desactivado correctamente!")
      setIsError(false)
      setIsOpen(false)
      setFormData({
        time: "",
        channels: [],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      console.error("Error desactivando recordatorio:", err)
      setMessage(`Error: ${err.response?.data?.message || err.message}`)
      setIsError(true)
    } finally {
      setSaving(false)
    }
  }

  const isReminderActive = currentReminder && currentReminder.enabled

  return (
    <div className="reminder-config-container">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`reminder-btn ${isReminderActive ? "reminder-active" : ""}`}
        title={isReminderActive ? "Recordatorio configurado" : "Configurar recordatorio"}
      >
        {isReminderActive ? "🔔 Recordatorio" : "⏰ Recordatorio"}
      </button>

      {isOpen && (
        <div className="reminder-modal">
          <div className="reminder-modal-content">
            <div className="reminder-modal-header">
              <h3>Configurar Recordatorio</h3>
              <p>Para: {habitTitle}</p>
              <button onClick={() => setIsOpen(false)} className="close-btn">
                ✕
              </button>
            </div>

            <div className="reminder-form">
              <div className="form-group">
                <label htmlFor="reminder-time">Hora del recordatorio:</label>
                <input
                  id="reminder-time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="time-input"
                />
                <small>Hora local: {formData.timezone}</small>
              </div>

              <div className="form-group">
                <label>Canales de notificación:</label>
                <div className="channels-group">
                  <label className="channel-option">
                    <input
                      type="checkbox"
                      checked={formData.channels.includes("email")}
                      onChange={() => handleChannelChange("email")}
                    />
                    <span>📧 E-mail</span>
                  </label>
                  <label className="channel-option">
                    <input
                      type="checkbox"
                      checked={formData.channels.includes("in-app")}
                      onChange={() => handleChannelChange("in-app")}
                    />
                    <span>🔔 Notificación in-app</span>
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button onClick={handleSave} className="save-btn" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar Recordatorio"}
                </button>
                {isReminderActive && (
                  <button onClick={handleDisable} className="disable-btn" disabled={saving}>
                    {saving ? "Desactivando..." : "Desactivar"}
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="cancel-btn" disabled={saving}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {message && <div className={`reminder-message ${isError ? "error" : "success"}`}>{message}</div>}
    </div>
  )
}

export default ReminderConfigButton
