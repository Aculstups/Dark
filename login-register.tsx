"use client"

import { useState } from "react"
import { collection, addDoc, query, where, getDocs } from "firebase/firestore"

export default function LoginRegister({ onLogin, db }) {
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")

  const hashPassword = async (password: string) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
    return hashHex
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (isLogin) {
      if (name === "Admin" && phone === "17938/00000" && password === "MLesN,!mTs,96") {
        onLogin({ name, phone, isAdmin: true, anonymousId: "Admin" })
        return
      }

      const usersRef = collection(db, "users")
      const q = query(usersRef, where("name", "==", name))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]
        const userData = userDoc.data()

        if (userData.deleted) {
          setError("Dieses Konto wurde von einem Admin gelöscht.")
          return
        }

        const hashedPassword = await hashPassword(password)
        if (userData.password === hashedPassword) {
          onLogin({ id: userDoc.id, ...userData })
        } else {
          setError("Ungültige Anmeldedaten")
        }
      } else {
        setError("Ungültige Anmeldedaten")
      }
    } else {
      if (password !== confirmPassword) {
        setError("Passwörter stimmen nicht überein")
        return
      }
      const q = query(collection(db, "users"), where("name", "==", name))
      const querySnapshot = await getDocs(q)
      if (!querySnapshot.empty) {
        setError("Benutzer existiert bereits")
        return
      }
      const anonymousId = `Anonym${Math.floor(Math.random() * 10000)}`
      const hashedPassword = await hashPassword(password)
      const newUser = {
        name,
        phone,
        password: hashedPassword,
        anonymousId,
        isAdmin: false,
        deleted: false,
        shopCount: 0,
      }
      const docRef = await addDoc(collection(db, "users"), newUser)
      onLogin({ id: docRef.id, ...newUser })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2 className="text-2xl mb-4 text-center">{isLogin ? "Anmelden" : "Registrieren"}</h2>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-2 mb-4 bg-gray-700 rounded text-white"
        required
      />
      <input
        type="tel"
        placeholder="Telefonnummer"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full p-2 mb-4 bg-gray-700 rounded text-white"
        required
      />
      <input
        type="password"
        placeholder="Passwort"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-2 mb-4 bg-gray-700 rounded text-white"
        required
        autoComplete="new-password"
      />
      {!isLogin && (
        <input
          type="password"
          placeholder="Passwort bestätigen"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-2 mb-4 bg-gray-700 rounded text-white"
          required
          autoComplete="new-password"
        />
      )}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <button type="submit" className="w-full p-2 bg-green-700 rounded hover:bg-green-600 text-white">
        {isLogin ? "Anmelden" : "Registrieren"}
      </button>
      <p className="mt-4 text-center">
        <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-blue-400 hover:underline">
          {isLogin ? "Zur Registrierung" : "Zur Anmeldung"}
        </button>
      </p>
    </form>
  )
}

