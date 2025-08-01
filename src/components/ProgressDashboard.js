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

// Registrar componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend)

const ProgressDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
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
  }, [currentUser]) // fetchStats depende de currentUser

  useEffect(() => {
    if (currentUser) {
      fetchStats()
    }
  }, [currentUser, fetchStats]) // Agregar fetchStats a las dependencias

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

      {/* Refresh Button */}
      <div className="dashboard-actions">
        <button onClick={fetchStats} className="refresh-btn">
          Actualizar Estadísticas
        </button>
      </div>
    </div>
  )
}

export default ProgressDashboard
