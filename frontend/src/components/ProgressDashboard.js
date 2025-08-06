"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../contexts/AuthContext"
import axiosInstance from "../axiosInstance"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
} from "chart.js"
import { Bar } from "react-chartjs-2"
import html2canvas from "html2canvas"
import ExportDataDialog from "./ExportDataDialog" // NEW: Import ExportDataDialog

// Registrar componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend)

const ProgressDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [shareLink, setShareLink] = useState(null)
  const [sharing, setSharing] = useState(false)
  const [shareError, setShareError] = useState(null)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false) // NEW: State for export dialog
  const { currentUser } = useAuth()

  // Función para obtener estadísticas
  const fetchStats = useCallback(async () => {
    if (!currentUser) return

    try {
      setLoading(true)
      const response = await axiosInstance.get("/stats/overview")
      setStats(response.data)
      setError(null)
    } catch (err) {
      setError("Error al cargar estadísticas: " + (err.response?.data?.message || err.message))
      console.error("Error fetching stats:", err)
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    if (currentUser) {
      fetchStats()
    }
  }, [currentUser, fetchStats])

  // Handle sharing progress
  const handleShareProgress = async () => {
    setSharing(true)
    setShareLink(null)
    setShareError(null)

    try {
      const dashboardElement = document.querySelector(".progress-dashboard")
      if (!dashboardElement) {
        throw new Error("No se encontró el elemento del dashboard para capturar.")
      }

      // Capture the dashboard as an image
      const canvas = await html2canvas(dashboardElement, {
        useCORS: true,
        scale: 2,
        logging: false,
      })

      const imageData = canvas.toDataURL("image/png")

      // Send image data to backend to get a shareable link
      const response = await axiosInstance.post("/share", {
        imageUrl: imageData,
      })

      setShareLink(response.data.shareUrl)
      alert("¡Link para compartir generado! Puedes copiarlo o usar las opciones de compartir.")
    } catch (err) {
      console.error("Error al compartir progreso:", err)
      setShareError("Error al generar link para compartir: " + (err.response?.data?.message || err.message))
    } finally {
      setSharing(false)
    }
  }

  // NEW: Handle export data
  const handleExportData = async (format) => {
    if (!currentUser) {
      alert("Debes iniciar sesión para exportar tus datos.")
      return
    }

    try {
      setLoading(true) // Use loading state for export as well
      const token = await currentUser.getIdToken() // Get the latest ID token

      const backendUrl = "https://backend-6vc1.onrender.com"
      const exportUrl = `${backendUrl}/api/export?format=${format}`

      const response = await fetch(exportUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json", // Or 'text/csv' depending on expected response
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al exportar datos.")
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition")
      let filename = `habit_tracker_export_${new Date().toISOString().slice(0, 10)}.zip`
      if (contentDisposition && contentDisposition.indexOf("attachment") !== -1) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1]
        }
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url) // Clean up the object URL

      alert("¡Datos exportados exitosamente!")
    } catch (err) {
      console.error("Error exporting data:", err)
      alert(`Error al exportar datos: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!currentUser) {
    return <div className="loading">Verificando autenticación...</div>
  }

  if (loading) {
    return <div className="loading">Cargando estadísticas...</div>
  }

  if (error) {
    return (
      <div className="error">
        {error}
        <button onClick={fetchStats} className="refresh-btn" style={{ marginTop: "10px" }}>
          Reintentar
        </button>
      </div>
    )
  }

  if (!stats) {
    return <div className="no-data">No hay datos disponibles</div>
  }

  // Configuración de la gráfica de barras
  const chartData = {
    labels: stats.chartData.last30Days.map((day) => day.dateFormatted),
    datasets: [
      {
        label: "Check-ins diarios",
        data: stats.chartData.last30Days.map((day) => day.checkins),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Check-ins de los últimos 30 días",
        font: {
          size: 16,
          weight: "bold",
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const day = stats.chartData.last30Days[context.dataIndex]
            return [`Check-ins: ${context.parsed.y}`, `Hábitos únicos: ${day.uniqueHabits}`]
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  }

  return (
    <div className="progress-dashboard">
      <div className="dashboard-header-section">
        <h2>Dashboard de Progreso</h2>
        <p className="dashboard-subtitle">Resumen de tu progreso en los últimos 30 días</p>
      </div>
      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card primary">
          <div className="kpi-icon">📊</div>
          <div className="kpi-content">
            <h3>Cumplimiento Global</h3>
            <div className="kpi-value">{stats.overview.globalCompletionRate}%</div>
            <p className="kpi-description">De todos tus hábitos</p>
          </div>
        </div>

        <div className="kpi-card success">
          <div className="kpi-icon">🔥</div>
          <div className="kpi-content">
            <h3>Mejor Racha</h3>
            <div className="kpi-value">{stats.overview.maxStreakBest}</div>
            <p className="kpi-description">Días consecutivos</p>
          </div>
        </div>

        <div className="kpi-card info">
          <div className="kpi-icon">📈</div>
          <div className="kpi-content">
            <h3>Días Activos</h3>
            <div className="kpi-value">{stats.overview.activeDaysLast30}</div>
            <p className="kpi-description">De los últimos 30 días</p>
          </div>
        </div>

        <div className="kpi-card warning">
          <div className="kpi-icon">🎯</div>
          <div className="kpi-content">
            <h3>Total Hábitos</h3>
            <div className="kpi-value">{stats.overview.totalHabits}</div>
            <p className="kpi-description">Hábitos registrados</p>
          </div>
        </div>
      </div>
      {/* Chart Section */}
      <div className="chart-section">
        <div className="chart-container">
          <Bar data={chartData} options={chartOptions} height={300} />
        </div>
      </div>
      {/* Additional Stats */}
      <div className="additional-stats">
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Promedio diario:</span>
            <span className="stat-value">{stats.overview.averageCheckinsPerDay} check-ins</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Hábitos con racha activa:</span>
            <span className="stat-value">{stats.overview.habitsWithActiveStreak}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total check-ins (30 días):</span>
            <span className="stat-value">{stats.chartData.totalCheckinsLast30Days}</span>
          </div>
          {stats.chartData.bestDay && (
            <div className="stat-item">
              <span className="stat-label">Mejor día:</span>
              <span className="stat-value">
                {stats.chartData.bestDay.dateFormatted} ({stats.chartData.bestDay.checkins} check-ins)
              </span>
            </div>
          )}
        </div>
      </div>
      {/* Share Button and Message */}
      <div className="dashboard-actions" style={{ marginTop: "30px" }}>
        <button onClick={handleShareProgress} className="refresh-btn" disabled={sharing}>
          {sharing ? "Generando link..." : "✨ Compartir Progreso"}
        </button>
        {shareLink && (
          <div style={{ marginTop: "15px", fontSize: "0.9rem", color: "#333" }}>
            <p>¡Tu link para compartir está listo!</p>
            <a
              href={shareLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#667eea", wordBreak: "break-all" }}
            >
              {shareLink}
            </a>
          </div>
        )}
        {shareError && (
          <div style={{ marginTop: "15px", fontSize: "0.9rem", color: "#dc3545" }}>
            <p>{shareError}</p>
          </div>
        )}
      </div>
      {/* NEW: Export Data Button */}
      <div className="dashboard-actions" style={{ marginTop: "20px" }}>
        <button onClick={() => setIsExportDialogOpen(true)} className="refresh-btn">
          ⬇️ Exportar Datos
        </button>
      </div>
      {/* Refresh Button */}
      <div className="dashboard-actions" style={{ marginTop: "20px" }}>
        <button onClick={fetchStats} className="refresh-btn">
          Actualizar Estadísticas
        </button>
      </div>

      {/* NEW: Export Data Dialog */}
      <ExportDataDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        onExport={handleExportData}
      />
    </div>
  )
}

export default ProgressDashboard
