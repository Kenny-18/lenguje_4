"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import axiosInstance from "../axiosInstance"
import { useAuth } from "./AuthContext"

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme debe ser usado dentro de ThemeProvider")
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const { currentUser, loading: authLoading } = useAuth()
  const [theme, setTheme] = useState("light") // Tema por defecto
  const [isThemeInitialized, setIsThemeInitialized] = useState(false)

  // Función para aplicar el tema al DOM
  const applyThemeToDOM = useCallback((newTheme) => {
    const root = document.documentElement
    if (newTheme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }, [])

  // Función para guardar el tema en el backend
  const saveThemeToBackend = useCallback(
    async (newTheme) => {
      if (!currentUser) return // No guardar si no está logueado
      try {
        await axiosInstance.put("/users/preferences", { theme: newTheme })
        console.log("Tema guardado en el backend:", newTheme)
      } catch (error) {
        console.error("Error guardando tema en el backend:", error)
        // Opcionalmente, revertir el tema o mostrar un error al usuario
      }
    },
    [currentUser],
  )

  // Inicializar el tema en la primera renderización y cuando el usuario inicia sesión
  useEffect(() => {
    if (authLoading) return

    const initializeTheme = async () => {
      const storedTheme = localStorage.getItem("theme")
      let initialTheme = "light"

      if (currentUser) {
        // Si está logueado, intentar obtener del backend
        try {
          const response = await axiosInstance.get("/users/preferences")
          if (response.data.preferences?.theme) {
            initialTheme = response.data.preferences.theme
            localStorage.setItem("theme", initialTheme) // Actualizar localStorage con la preferencia del backend
          } else if (storedTheme) {
            initialTheme = storedTheme // Usar localStorage si el backend no tiene preferencia
            saveThemeToBackend(initialTheme) // Guardar la preferencia local en el backend
          } else {
            // No hay preferencia en backend ni local, usar preferencia del sistema o por defecto
            initialTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
            saveThemeToBackend(initialTheme) // Guardar la preferencia del sistema en el backend
          }
        } catch (error) {
          console.error("Error obteniendo preferencias de usuario, usando local/sistema:", error)
          // Fallback a localStorage o preferencia del sistema si la llamada al backend falla
          initialTheme = storedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
          // No intentar guardar en el backend de nuevo si acaba de fallar
        }
      } else {
        // No logueado, usar localStorage o preferencia del sistema
        initialTheme = storedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      }

      setTheme(initialTheme)
      applyThemeToDOM(initialTheme)
      setIsThemeInitialized(true)
    }

    initializeTheme()
  }, [currentUser, authLoading, applyThemeToDOM, saveThemeToBackend])

  // Efecto para actualizar el DOM y guardar en el backend cuando el estado del tema cambia
  useEffect(() => {
    if (isThemeInitialized) {
      // Solo ejecutar después de que el tema inicial ha sido establecido
      applyThemeToDOM(theme)
      localStorage.setItem("theme", theme)
      saveThemeToBackend(theme)
    }
  }, [theme, isThemeInitialized, applyThemeToDOM, saveThemeToBackend])

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"))
  }

  const value = {
    theme,
    toggleTheme,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
