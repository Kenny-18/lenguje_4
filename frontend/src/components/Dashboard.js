"use client"

import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import HabitsList from "./HabitsList"
import ProgressDashboard from "./ProgressDashboard"
import GoogleAuthButton from "./GoogleAuthButton"
import AchievementsList from "./AchievementsList"
import ThemeToggle from "./ThemeToggle"
import DailySuggestionCard from "./DailySuggestionCard"
import MoodTracker from "./MoodTracker"
import NotificationBell from "./NotificationBell" // agregando componente de notificaciones
import "../ProgressDashboard.css"

const Dashboard = () => {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("habits")

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
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h3>¡Hola, {currentUser?.displayName || "Usuario"}!</h3>
            <p>{currentUser?.email}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <NotificationBell />
          <ThemeToggle />
          <GoogleAuthButton />
          <button onClick={handleLogout} className="logout-btn">
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="dashboard-nav">
        <div className="nav-container">
          <button
            className={`nav-tab ${activeTab === "habits" ? "active" : ""}`}
            onClick={() => setActiveTab("habits")}
          >
            📝 Mis Hábitos
          </button>
          <button
            className={`nav-tab ${activeTab === "progress" ? "active" : ""}`}
            onClick={() => setActiveTab("progress")}
          >
            📊 Progreso
          </button>
          <button
            className={`nav-tab ${activeTab === "achievements" ? "active" : ""}`}
            onClick={() => setActiveTab("achievements")}
          >
            🏆 Logros
          </button>
          <button className={`nav-tab ${activeTab === "mood" ? "active" : ""}`} onClick={() => setActiveTab("mood")}>
            😊 Estado de Ánimo
          </button>
        </div>
      </nav>

      <main className="dashboard-content">
        <DailySuggestionCard />
        {activeTab === "habits" && <HabitsList />}
        {activeTab === "progress" && <ProgressDashboard />}
        {activeTab === "achievements" && <AchievementsList />}
        {activeTab === "mood" && <MoodTracker />}
      </main>
    </div>
  )
}

export default Dashboard
