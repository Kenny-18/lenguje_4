"use client"

import { createContext, useContext, useState, useEffect } from "react"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth"
import { auth, googleProvider, facebookProvider } from "../firebase/config"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Registro con email y password
  const signup = async (email, password, displayName) => {
    try {
      setError(null)
      const result = await createUserWithEmailAndPassword(auth, email, password)

      // Actualizar el perfil con el nombre
      if (displayName) {
        await updateProfile(result.user, {
          displayName: displayName,
        })
      }

      return result
    } catch (error) {
      setError(getErrorMessage(error.code))
      throw error
    }
  }

  // Login con email y password
  const login = async (email, password) => {
    try {
      setError(null)
      const result = await signInWithEmailAndPassword(auth, email, password)
      return result
    } catch (error) {
      setError(getErrorMessage(error.code))
      throw error
    }
  }

  // Login con Google
  const loginWithGoogle = async () => {
    try {
      setError(null)
      const result = await signInWithPopup(auth, googleProvider)
      return result
    } catch (error) {
      setError(getErrorMessage(error.code))
      throw error
    }
  }

  // Login con Facebook
  const loginWithFacebook = async () => {
    try {
      setError(null)
      const result = await signInWithPopup(auth, facebookProvider)
      return result
    } catch (error) {
      setError(getErrorMessage(error.code))
      throw error
    }
  }

  // Logout
  const logout = async () => {
    try {
      setError(null)
      await signOut(auth)
    } catch (error) {
      setError(getErrorMessage(error.code))
      throw error
    }
  }

  // Resetear password
  const resetPassword = async (email) => {
    try {
      setError(null)
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      setError(getErrorMessage(error.code))
      throw error
    }
  }

  // Función para obtener mensajes de error en español
  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      "auth/user-not-found": "No existe una cuenta con este correo electrónico",
      "auth/wrong-password": "Contraseña incorrecta",
      "auth/email-already-in-use": "Ya existe una cuenta con este correo electrónico",
      "auth/weak-password": "La contraseña debe tener al menos 6 caracteres",
      "auth/invalid-email": "Correo electrónico inválido",
      "auth/user-disabled": "Esta cuenta ha sido deshabilitada",
      "auth/too-many-requests": "Demasiados intentos fallidos. Intenta más tarde",
      "auth/popup-closed-by-user": "Ventana de autenticación cerrada por el usuario",
      "auth/cancelled-popup-request": "Solicitud de autenticación cancelada",
      "auth/popup-blocked": "Ventana emergente bloqueada por el navegador",
    }

    return errorMessages[errorCode] || "Ha ocurrido un error inesperado"
  }

  // Efecto para escuchar cambios en el estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    loading,
    error,
    signup,
    login,
    loginWithGoogle,
    loginWithFacebook,
    logout,
    resetPassword,
    setError,
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}
