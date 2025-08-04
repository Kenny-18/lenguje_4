// Importar funciones necesarias de Firebase
import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth"

// Configuración de Firebase (ya con tus credenciales reales)
const firebaseConfig = {
  apiKey: "AIzaSyDZ9NP41zA-xUCjqMmPaTObp3IrBonqAM4",
  authDomain: "programacion4-a9a52.firebaseapp.com",
  projectId: "programacion4-a9a52",
  storageBucket: "programacion4-a9a52.firebasestorage.app",
  messagingSenderId: "565430349554",
  appId: "1:565430349554:web:775ca5eb456078d868ea6b",
  measurementId: "G-4VJ19YL1C9",
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)

// Inicializar Auth y proveedores
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const facebookProvider = new FacebookAuthProvider()

googleProvider.setCustomParameters({
  prompt: "select_account",
})

facebookProvider.setCustomParameters({
  display: "popup",
})

// Exportar app
export default app
