import cron from "node-cron"
import nodemailer from "nodemailer"
import Habit from "../models/Habit.js"
import Notification from "../models/Notification.js"

// Configurar transporter de nodemailer
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

// Función para enviar email de recordatorio
const sendReminderEmail = async (userEmail, habitTitle, habitDescription) => {
  try {
    const transporter = createEmailTransporter()

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Recordatorio: ${habitTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">¡Es hora de tu hábito!</h2>
          <h3 style="color: #333;">${habitTitle}</h3>
          ${habitDescription ? `<p style="color: #666;">${habitDescription}</p>` : ""}
          <p style="color: #333;">No olvides completar tu hábito de hoy para mantener tu racha.</p>
          <div style="margin: 20px 0;">
            <a href="${process.env.FRONTEND_URL}" 
               style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Ir a Habit Wise
            </a>
          </div>
          <p style="color: #999; font-size: 12px;">
            Este es un recordatorio automático de Habit Wise. Si no deseas recibir estos emails, puedes desactivar las notificaciones por email en tu configuración de hábitos.
          </p>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log(`✅ Email de recordatorio enviado a ${userEmail} para hábito: ${habitTitle}`)
  } catch (error) {
    console.error(`❌ Error enviando email de recordatorio:`, error)
  }
}

// Función para crear notificación in-app
const createInAppNotification = async (userId, habitId, habitTitle) => {
  try {
    const notification = new Notification({
      userId,
      habitId,
      title: "Recordatorio de hábito",
      message: `Es hora de completar tu hábito: ${habitTitle}`,
      type: "reminder",
      scheduledFor: new Date(),
    })

    await notification.save()
    console.log(`✅ Notificación in-app creada para usuario ${userId}, hábito: ${habitTitle}`)
    return notification
  } catch (error) {
    console.error(`❌ Error creando notificación in-app:`, error)
    return null
  }
}

// Función principal para procesar recordatorios
const processReminders = async (io) => {
  try {
    const now = new Date()
    const currentHour = now.getUTCHours().toString().padStart(2, "0")
    const currentMinute = now.getUTCMinutes().toString().padStart(2, "0")
    const currentTime = `${currentHour}:${currentMinute}`

    console.log(`🔍 Buscando recordatorios para la hora UTC: ${currentTime}`)

    // Buscar hábitos con recordatorios activos para la hora actual
    const habitsWithReminders = await Habit.find({
      "reminder.enabled": true,
      "reminder.time": currentTime,
    })

    console.log(`📋 Encontrados ${habitsWithReminders.length} hábitos con recordatorios`)

    for (const habit of habitsWithReminders) {
      const { userId, userEmail, title, description, reminder } = habit

      // Enviar email si está configurado
      if (reminder.channels.includes("email")) {
        await sendReminderEmail(userEmail, title, description)
      }

      // Crear notificación in-app si está configurado
      if (reminder.channels.includes("in-app")) {
        const notification = await createInAppNotification(userId, habit._id, title)

        // Enviar notificación en tiempo real via socket.io
        if (notification && io) {
          io.to(userId).emit("reminder", {
            id: notification._id,
            title: notification.title,
            message: notification.message,
            habitId: habit._id,
            habitTitle: title,
            createdAt: notification.createdAt,
          })
          console.log(`📡 Notificación enviada via socket.io a usuario ${userId}`)
        }
      }
    }
  } catch (error) {
    console.error("❌ Error procesando recordatorios:", error)
  }
}

// Inicializar el job de recordatorios
export const initializeReminderJob = (io) => {
  console.log("🚀 Inicializando job de recordatorios...")

  // Ejecutar cada minuto
  cron.schedule("* * * * *", () => {
    processReminders(io)
  })

  console.log("✅ Job de recordatorios configurado para ejecutarse cada minuto")
}

// Función para testing manual
export const testReminders = async (io) => {
  console.log("🧪 Ejecutando test manual de recordatorios...")
  await processReminders(io)
}
