"use client"

import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Link } from "react-router-dom"

const ForgotPassword = () => {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  const { resetPassword, error, setError } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email) {
      setError("Por favor ingresa tu correo electrónico")
      return
    }

    try {
      setIsLoading(true)
      setMessage("")
      await resetPassword(email)
      setMessage("Revisa tu correo electrónico para restablecer tu contraseña")
    } catch (error) {
      console.error("Error al enviar email de recuperación:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    setEmail(e.target.value)
    if (error) setError(null)
    if (message) setMessage("")
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Recuperar Contraseña</h2>
        <p className="auth-description">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleChange}
              placeholder="tu@email.com"
              required
            />
          </div>

          <button type="submit" className="auth-button primary" disabled={isLoading}>
            {isLoading ? "Enviando..." : "Enviar Enlace de Recuperación"}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login" className="back-link">
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
