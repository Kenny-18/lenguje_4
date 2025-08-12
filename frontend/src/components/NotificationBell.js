"use client"

import { useState } from "react"
import { useNotifications } from "../contexts/NotificationContext"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import "./NotificationBell.css"

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllAsRead, isConnected } = useNotifications()

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification._id)
    }
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  return (
    <div className="notification-bell-container">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`notification-bell ${unreadCount > 0 ? "has-unread" : ""}`}
        title={`${unreadCount} notificaciones no leídas`}
      >
        🔔{unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notificaciones</h3>
            <div className="notification-status">
              <span className={`connection-status ${isConnected ? "connected" : "disconnected"}`}>
                {isConnected ? "🟢 Conectado" : "🔴 Desconectado"}
              </span>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="no-notifications">
              <p>No tienes notificaciones</p>
            </div>
          ) : (
            <>
              <div className="notification-actions">
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllAsRead} className="mark-all-read-btn">
                    Marcar todas como leídas
                  </button>
                )}
              </div>

              <div className="notifications-list">
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification._id}
                    className={`notification-item ${!notification.read ? "unread" : ""}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon">{notification.type === "reminder" ? "⏰" : "🔔"}</div>
                    <div className="notification-content">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">
                        {format(new Date(notification.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                      </div>
                    </div>
                    {!notification.read && <div className="unread-indicator"></div>}
                  </div>
                ))}
              </div>

              {notifications.length > 10 && (
                <div className="notification-footer">
                  <p>Mostrando las 10 más recientes de {notifications.length} notificaciones</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {isOpen && <div className="notification-overlay" onClick={() => setIsOpen(false)}></div>}
    </div>
  )
}

export default NotificationBell
