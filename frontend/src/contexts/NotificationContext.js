"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { io } from "socket.io-client"
import { useAuth } from "./AuthContext"
import axiosInstance from "../axiosInstance"

const NotificationContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications debe ser usado dentro de NotificationProvider")
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const { currentUser } = useAuth()

  // Función para conectar socket
  const connectSocket = useCallback(() => {
    if (!currentUser || socket) return

    const newSocket = io(process.env.REACT_APP_API_URL || "http://localhost:3000", {
      transports: ["websocket", "polling"],
      timeout: 20000,
    })

    newSocket.on("connect", () => {
      console.log("🔗 Conectado a Socket.IO")
      setIsConnected(true)
      // Unirse a la sala personal del usuario
      newSocket.emit("join", currentUser.uid)
    })

    newSocket.on("disconnect", () => {
      console.log("❌ Desconectado de Socket.IO")
      setIsConnected(false)
    })

    // Escuchar notificaciones de recordatorios
    newSocket.on("reminder", (data) => {
      console.log("🔔 Nueva notificación de recordatorio:", data)

      const newNotification = {
        id: data.id,
        title: data.title,
        message: data.message,
        habitId: data.habitId,
        habitTitle: data.habitTitle,
        type: "reminder",
        createdAt: data.createdAt || new Date().toISOString(),
        read: false,
      }

      // Agregar notificación al estado
      setNotifications((prev) => [newNotification, ...prev])
      setUnreadCount((prev) => prev + 1)

      // Mostrar notificación del navegador si está permitido
      if (Notification.permission === "granted") {
        new Notification(`Recordatorio: ${data.habitTitle}`, {
          body: data.message,
          icon: "/favicon.ico",
          tag: `reminder-${data.habitId}`,
        })
      }

      // Mostrar notificación visual en la app
      showToastNotification(newNotification)
    })

    newSocket.on("connect_error", (error) => {
      console.error("❌ Error de conexión Socket.IO:", error)
      setIsConnected(false)
    })

    setSocket(newSocket)
  }, [currentUser, socket])

  // Función para desconectar socket
  const disconnectSocket = useCallback(() => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
      setIsConnected(false)
    }
  }, [socket])

  // Función para mostrar notificación toast
  const showToastNotification = (notification) => {
    // Crear elemento de notificación toast
    const toast = document.createElement("div")
    toast.className = "notification-toast"
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-icon">🔔</div>
        <div class="toast-text">
          <div class="toast-title">${notification.title}</div>
          <div class="toast-message">${notification.message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()">✕</button>
      </div>
    `

    // Agregar estilos si no existen
    if (!document.getElementById("notification-toast-styles")) {
      const styles = document.createElement("style")
      styles.id = "notification-toast-styles"
      styles.textContent = `
        .notification-toast {
          position: fixed;
          top: 20px;
          right: 20px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          z-index: 9999;
          max-width: 400px;
          animation: slideInRight 0.3s ease-out;
        }
        
        .toast-content {
          display: flex;
          align-items: flex-start;
          padding: 16px;
          gap: 12px;
        }
        
        .toast-icon {
          font-size: 20px;
          flex-shrink: 0;
        }
        
        .toast-text {
          flex: 1;
        }
        
        .toast-title {
          font-weight: 600;
          color: #111827;
          margin-bottom: 4px;
        }
        
        .toast-message {
          color: #6b7280;
          font-size: 14px;
        }
        
        .toast-close {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          font-size: 16px;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          flex-shrink: 0;
        }
        
        .toast-close:hover {
          background: #f3f4f6;
          color: #374151;
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @media (max-width: 480px) {
          .notification-toast {
            left: 20px;
            right: 20px;
            max-width: none;
          }
        }
      `
      document.head.appendChild(styles)
    }

    document.body.appendChild(toast)

    // Auto-remover después de 5 segundos
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove()
      }
    }, 5000)
  }

  // Función para obtener notificaciones del servidor
  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return

    try {
      const response = await axiosInstance.get("/notifications?limit=50")
      setNotifications(response.data.notifications || [])

      // Contar no leídas
      const unread = (response.data.notifications || []).filter((n) => !n.read).length
      setUnreadCount(unread)
    } catch (error) {
      console.error("Error obteniendo notificaciones:", error)
    }
  }, [currentUser])

  // Función para marcar notificación como leída
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await axiosInstance.put(`/notifications/${notificationId}/read`)

      setNotifications((prev) => prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n)))

      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error marcando notificación como leída:", error)
    }
  }, [])

  // Función para marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      await axiosInstance.put("/notifications/read-all")

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

      setUnreadCount(0)
    } catch (error) {
      console.error("Error marcando todas las notificaciones como leídas:", error)
    }
  }, [])

  // Función para solicitar permisos de notificación
  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission()
      return permission === "granted"
    }
    return Notification.permission === "granted"
  }, [])

  // Efectos
  useEffect(() => {
    if (currentUser) {
      connectSocket()
      fetchNotifications()
      requestNotificationPermission()
    } else {
      disconnectSocket()
      setNotifications([])
      setUnreadCount(0)
    }

    return () => {
      disconnectSocket()
    }
  }, [currentUser, connectSocket, disconnectSocket, fetchNotifications, requestNotificationPermission])

  const value = {
    socket,
    notifications,
    unreadCount,
    isConnected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    requestNotificationPermission,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
