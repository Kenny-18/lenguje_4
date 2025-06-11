import Habit from '../models/Habit.js';

// GET /api/habits - Obtener todos los hábitos
export const getHabits = async (req, res) => {
  try {
    const habits = await Habit.find().sort({ createdAt: -1 });
    res.status(200).json(habits);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener hábitos', 
      error: error.message 
    });
  }
};

// POST /api/habits - Crear un nuevo hábito
export const createHabit = async (req, res) => {
  try {
    const { title, description, frequency } = req.body;
    
    const newHabit = new Habit({
      title,
      description,
      frequency
    });

    const savedHabit = await newHabit.save();
    res.status(201).json(savedHabit);
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ 
        message: 'Error de validación', 
        error: error.message 
      });
    } else {
      res.status(500).json({ 
        message: 'Error al crear hábito', 
        error: error.message 
      });
    }
  }
};

// PUT /api/habits/:id - Actualizar un hábito
export const updateHabit = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, frequency } = req.body;

    const updatedHabit = await Habit.findByIdAndUpdate(
      id,
      { title, description, frequency },
      { new: true, runValidators: true }
    );

    if (!updatedHabit) {
      return res.status(404).json({ message: 'Hábito no encontrado' });
    }

    res.status(200).json(updatedHabit);
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ 
        message: 'Error de validación', 
        error: error.message 
      });
    } else {
      res.status(500).json({ 
        message: 'Error al actualizar hábito', 
        error: error.message 
      });
    }
  }
};

// DELETE /api/habits/:id - Eliminar un hábito
export const deleteHabit = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedHabit = await Habit.findByIdAndDelete(id);
    
    if (!deletedHabit) {
      return res.status(404).json({ message: 'Hábito no encontrado' });
    }

    res.status(200).json({ 
      message: 'Hábito eliminado correctamente',
      habit: deletedHabit 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al eliminar hábito', 
      error: error.message 
    });
  }
};