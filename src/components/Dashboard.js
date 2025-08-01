"use client"

import { useAuth } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import HabitsList from "./HabitsList"

const Dashboard = () => {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate("/login")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="user-info">
          <div className="user-avatar">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL || "/placeholder.svg"} alt="Avatar" />
            ) : (
              <div className="avatar-placeholder">
                {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || "U"}
              </div>
            )}
          </div>
          <div className="user-details">
            <h3>¡Hola, {currentUser?.displayName || "Usuario"}!</h3>
            <p>{currentUser?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Cerrar Sesión
        </button>
      </header>

      <main className="dashboard-content">
        <HabitsList />
      </main>
    </div>
  )
}

export default Dashboard
