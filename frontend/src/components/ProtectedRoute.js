"use client"

import { useAuth } from "../contexts/AuthContext"
import { Navigate } from "react-router-dom"

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Cargando...</div>
      </div>
    )
  }

  return currentUser ? children : <Navigate to="/login" />
}

export default ProtectedRoute
