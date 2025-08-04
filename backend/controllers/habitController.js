import Habit from "../models/Habit.js"
import UserIntegration from "../models/UserIntegration.js"
import { google } from "googleapis"
import { startOfDay, addDays } from "date-fns"

// Usar las MISMAS credenciales hardcodeadas que en googleController.js
const GOOGLE_CLIENT_ID = "565430349554-9g8iv5nhtaohdqu3a22o3aj2rqe6mki1.apps.googleusercontent.com"
const GOOGLE_CLIENT_SECRET = "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"
const GOOGLE_REDIRECT_URI = "http://localhost:3000/api/integrations/google/callback"

// Helper para obtener el cliente OAuth2
const getOAuth2Client = async (userId) => {
  console.log("🔍 Buscando integración para usuario:", userId)

  const userIntegration = await UserIntegration.findOne({ userId })
  console.log("📋 Integración encontrada:", {
    exists: !!userIntegration,
    hasRefreshToken: !!userIntegration?.google?.refreshToken,
  })

  if (!userIntegration || !userIntegration.google?.refreshToken) {
    throw new Error("No se encontró la integración de Google Calendar para este usuario.")
  }

  const oAuth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)

  oAuth2Client.setCredentials({
    refresh_token: userIntegration.google.refreshToken,
  })

  console.log("🔐 OAuth2Client configurado correctamente")

  try {
    // Obtener access token (esto también refresca si es necesario)
    const { credentials } = await oAuth2Client.refreshAccessToken()
    console.log("✅ Access token obtenido:", !!credentials.access_token)
    return oAuth2Client
  } catch (error) {
    console.error("❌ Error obteniendo access token:", error)
    throw new Error("Error refrescando token de acceso de Google Calendar.")
  }
}

// POST /api/habits/:id/sync-calendar - Sincronizar un hábito con Google Calendar
export const syncHabitToGoogleCalendar = async (req, res) => {
  console.log("🔄 Iniciando sincronización con Google Calendar...")
  console.log("📋 Datos del request:", {
    habitId: req.params.id,
    userId: req.user.uid,
  })

  try {
    const { id: habitId } = req.params
    const userId = req.user.uid

    // Verificar que el hábito existe
    const habit = await Habit.findOne({ _id: habitId, userId })
    if (!habit) {
      console.error("❌ Hábito no encontrado")
      return res.status(404).json({
        message: "Hábito no encontrado o no tienes permisos para acceder a él",
      })
    }
    console.log("✅ Hábito encontrado:", habit.title)

    // Obtener cliente OAuth2
    const oAuth2Client = await getOAuth2Client(userId)
    const calendar = google.calendar({ version: "v3", auth: oAuth2Client })

    const today = startOfDay(new Date())
    const eventDate = habit.lastCheckinDate ? startOfDay(habit.lastCheckinDate) : today

    let recurrenceRule = ""
    switch (habit.frequency) {
      case "daily":
        recurrenceRule = "RRULE:FREQ=DAILY"
        break
      case "weekly":
        recurrenceRule = "RRULE:FREQ=WEEKLY"
        break
      case "monthly":
        recurrenceRule = "RRULE:FREQ=MONTHLY;BYMONTHDAY=" + eventDate.getDate()
        break
      default:
        break
    }

    const event = {
      summary: `Hábito: ${habit.title}`,
      description: habit.description || "Hábito a completar.",
      start: {
        dateTime: eventDate.toISOString(),
        timeZone: "America/Mexico_City",
      },
      end: {
        dateTime: addDays(eventDate, 1).toISOString(),
        timeZone: "America/Mexico_City",
      },
      recurrence: recurrenceRule ? [recurrenceRule] : [],
      reminders: {
        useDefault: false,
        overrides: [{ method: "email", minutes: 60 * 24 }],
      },
    }

    console.log("📅 Creando evento en Google Calendar...")
    console.log("📋 Evento a crear:", {
      summary: event.summary,
      start: event.start.dateTime,
      recurrence: event.recurrence,
    })

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    })

    console.log("✅ Evento creado exitosamente:", response.data.id)

    res.status(200).json({
      message: "Hábito sincronizado con Google Calendar exitosamente",
      event: response.data,
    })
  } catch (error) {
    console.error("❌ Error sincronizando hábito con Google Calendar:", error)
    res.status(500).json({
      message: "Error al sincronizar hábito con Google Calendar",
      error: error.message,
    })
  }
}

// GET /api/habits - Obtener todos los hábitos del usuario autenticado con filtros
export const getHabits = async (req, res) => {
  try {
    const userId = req.user.uid
    const { search, frequency, category, sortBy = "createdAt", sortOrder = "desc" } = req.query

    // Construir filtro base
    const filter = { userId }

    // Filtro por frecuencia
    if (frequency && frequency !== "all") {
      filter.frequency = frequency
    }

    // Filtro por categoría (si se implementa en el futuro)
    if (category && category !== "all") {
      filter.category = category
    }

    let query

    // Búsqueda por texto
    if (search && search.trim()) {
      // Usar búsqueda de texto de MongoDB
      query = Habit.find(
        {
          ...filter,
          $text: { $search: search.trim() },
        },
        {
          score: { $meta: "textScore" },
        },
      ).sort({
        score: { $meta: "textScore" },
        [sortBy]: sortOrder === "desc" ? -1 : 1,
      })
    } else {
      // Consulta normal sin búsqueda de texto
      query = Habit.find(filter).sort({
        [sortBy]: sortOrder === "desc" ? -1 : 1,
      })
    }

    const habits = await query.exec()

    // Estadísticas de la búsqueda
    const totalHabits = await Habit.countDocuments({ userId })
    const filteredCount = habits.length

    res.status(200).json({
      habits,
      meta: {
        total: totalHabits,
        filtered: filteredCount,
        hasFilters: !!(search || (frequency && frequency !== "all") || (category && category !== "all")),
        filters: {
          search: search || null,
          frequency: frequency || null,
          category: category || null,
        },
      },
    })
  } catch (error) {
    console.error("Error al obtener hábitos:", error)
    res.status(500).json({
      message: "Error al obtener hábitos",
      error: error.message,
    })
  }
}

// POST /api/habits - Crear un nuevo hábito para el usuario autenticado
export const createHabit = async (req, res) => {
  try {
    const { title, description, frequency } = req.body

    const newHabit = new Habit({
      title,
      description,
      frequency,
      userId: req.user.uid,
      userEmail: req.user.email,
    })

    const savedHabit = await newHabit.save()
    res.status(201).json(savedHabit)
  } catch (error) {
    if (error.name === "ValidationError") {
      res.status(400).json({
        message: "Error de validación",
        error: error.message,
      })
    } else {
      res.status(500).json({
        message: "Error al crear hábito",
        error: error.message,
      })
    }
  }
}

// PUT /api/habits/:id - Actualizar un hábito del usuario autenticado
export const updateHabit = async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, frequency } = req.body

    // Buscar y actualizar solo si pertenece al usuario autenticado
    const updatedHabit = await Habit.findOneAndUpdate(
      { _id: id, userId: req.user.uid }, // Filtrar por ID y usuario
      { title, description, frequency },
      { new: true, runValidators: true },
    )

    if (!updatedHabit) {
      return res.status(404).json({
        message: "Hábito no encontrado o no tienes permisos para modificarlo",
      })
    }

    res.status(200).json(updatedHabit)
  } catch (error) {
    if (error.name === "ValidationError") {
      res.status(400).json({
        message: "Error de validación",
        error: error.message,
      })
    } else {
      res.status(500).json({
        message: "Error al actualizar hábito",
        error: error.message,
      })
    }
  }
}

// DELETE /api/habits/:id - Eliminar un hábito del usuario autenticado
export const deleteHabit = async (req, res) => {
  try {
    const { id } = req.params

    // Buscar y eliminar solo si pertenece al usuario autenticado
    const deletedHabit = await Habit.findOneAndDelete({
      _id: id,
      userId: req.user.uid,
    })

    if (!deletedHabit) {
      return res.status(404).json({
        message: "Hábito no encontrado o no tienes permisos para eliminarlo",
      })
    }

    res.status(200).json({
      message: "Hábito eliminado correctamente",
      habit: deletedHabit,
    })
  } catch (error) {
    res.status(500).json({
      message: "Error al eliminar hábito",
      error: error.message,
    })
  }
}

// GET /api/habits/:id - Obtener un hábito específico del usuario autenticado
export const getHabitById = async (req, res) => {
  try {
    const { id } = req.params

    const habit = await Habit.findOne({
      _id: id,
      userId: req.user.uid,
    })

    if (!habit) {
      return res.status(404).json({
        message: "Hábito no encontrado o no tienes permisos para verlo",
      })
    }

    res.status(200).json(habit)
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener hábito",
      error: error.message,
    })
  }
}
