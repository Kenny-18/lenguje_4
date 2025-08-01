"use client"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import "../Achievements.css" // ✅ Corregido: agregar ../ para subir un nivel

const AchievementCard = ({ achievement }) => {
  return (
    <div className="achievement-card">
      <div className="achievement-badge" dangerouslySetInnerHTML={{ __html: achievement.badgeSvg }} />
      <div className="achievement-details">
        <h3 className="achievement-name">{achievement.name}</h3>
        <p className="achievement-description">{achievement.description}</p>
        <span className="achievement-date">
          Obtenido el: {format(new Date(achievement.achievedAt), "dd/MM/yyyy", { locale: es })}
        </span>
        {achievement.habitId && achievement.habitTitle && (
          <span className="achievement-habit">(Hábito: {achievement.habitTitle})</span>
        )}
      </div>
    </div>
  )
}

export default AchievementCard
