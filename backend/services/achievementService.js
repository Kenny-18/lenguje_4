import Achievement from "../models/Achievement.js"
import Habit from "../models/Habit.js"
import { startOfDay } from "date-fns"

// Define SVG for "Perfect Week" badge
const PERFECT_WEEK_BADGE_SVG = `
<svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="#FFD700"/>
<path d="M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="url(#paint0_linear_1_2)"/>
<defs>
<linearGradient id="paint0_linear_1_2" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
<stop stop-color="#FFEB3B"/>
<stop offset="1" stop-color="#FBC02D"/>
</linearGradient>
</defs>
</svg>
`

export const checkAchievements = async (userId, habitId, checkinDate) => {
  try {
    const habit = await Habit.findOne({ _id: habitId, userId })
    if (!habit) {
      console.warn(`Achievement check: Habit ${habitId} not found for user ${userId}`)
      return
    }

    // Check for "Perfect Week" achievement (7-day streak for a specific habit)
    if (habit.streakCurrent >= 7) {
      const achievementName = "Semana Perfecta"
      const achievementDescription = `Completaste el hábito "${habit.title}" por 7 días consecutivos. ¡Felicidades!`
      const achievementType = "perfect_week"

      // Check if this achievement already exists for this habit
      const existingAchievement = await Achievement.findOne({
        userId,
        habitId,
        type: achievementType,
      })

      if (!existingAchievement) {
        const newAchievement = new Achievement({
          userId,
          habitId,
          name: achievementName,
          description: achievementDescription,
          type: achievementType,
          criteria: { days: 7 },
          badgeSvg: PERFECT_WEEK_BADGE_SVG,
          achievedAt: startOfDay(checkinDate),
        })
        await newAchievement.save()
        console.log(`🎉 Logro "${achievementName}" otorgado a usuario ${userId} para hábito ${habit.title}`)
      } else {
        console.log(`Logro "${achievementName}" ya existe para hábito ${habit.title}.`)
      }
    }

    // Add more achievement checks here in the future
    // Example: Total check-ins, specific habit completion count, etc.
  } catch (error) {
    console.error("Error checking achievements:", error)
  }
}
