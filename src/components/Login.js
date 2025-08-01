"use client"

import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Link, useNavigate } from "react-router-dom"

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { login, loginWithGoogle, loginWithFacebook, error, setError } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      setError("Por favor completa todos los campos")
      return
    }

    try {
      setIsLoading(true)
      await login(formData.email, formData.password)
      navigate("/dashboard")
    } catch (error) {
      console.error("Error en login:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      await loginWithGoogle()
      navigate("/dashboard")
    } catch (error) {
      console.error("Error en login con Google:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFacebookLogin = async () => {
    try {
      setIsLoading(true)
      await loginWithFacebook()
      navigate("/dashboard")
    } catch (error) {
      console.error("Error en login con Facebook:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Iniciar Sesión</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Tu contraseña"
                required
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-button primary" disabled={isLoading}>
            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>

        <div className="auth-divider">
          <span>O continúa con</span>
        </div>

        <div className="social-buttons">
          <button onClick={handleGoogleLogin} className="auth-button google" disabled={isLoading}>
            <span className="social-icon">🔍</span>
            Google
          </button>

          <button onClick={handleFacebookLogin} className="auth-button facebook" disabled={isLoading}>
            <span className="social-icon">📘</span>
            Facebook
          </button>
        </div>

        <div className="auth-links">
          <Link to="/forgot-password" className="forgot-link">
            ¿Olvidaste tu contraseña?
          </Link>
          <p>
            ¿No tienes cuenta?
            <Link to="/register" className="register-link">
              {" "}
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
