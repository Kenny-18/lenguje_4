import Habit from "../models/Habit.js"

// GET /api/habits - Obtener todos los hábitos del usuario autenticado
export const getHabits = async (req, res) => {
  try {
    // Filtrar hábitos solo del usuario autenticado
    const habits = await Habit.find({ userId: req.user.uid }).sort({ createdAt: -1 })

    res.status(200).json(habits)
  } catch (error) {
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
