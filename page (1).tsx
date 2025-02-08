"use client"

import { useState, useEffect } from "react"
import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import io from "socket.io-client"
import Header from "./components/header"
import Sidebar from "./components/sidebar"
import LoginRegister from "./components/login-register"
import PublicChat from "./components/public-chat"
import PrivateChat from "./components/private-chat"
import Market from "./components/market"
import OtherShops from "./components/other-shops"
import AdminPanel from "./components/admin-panel"

const firebaseConfig = {
  apiKey: "AIzaSyAQs1xShbSf-rtamiTqwU10ypfkjuGFGVo",
  authDomain: "dark-a7a65.firebaseapp.com",
  projectId: "dark-a7a65",
  storageBucket: "dark-a7a65.appspot.com",
  messagingSenderId: "735669962343",
  appId: "1:735669962343:web:a0870cfcc13394e47176c2",
  measurementId: "G-XCZYPK22JM",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const storage = getStorage(app)

let socket

export default function Home() {
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState("public-chat")

  useEffect(() => {
    socket = io("http://localhost:3000")
    return () => {
      socket.disconnect()
    }
  }, [])

  const renderPage = () => {
    switch (currentPage) {
      case "public-chat":
        return <PublicChat user={user} db={db} socket={socket} />
      case "private-chat":
        return <PrivateChat user={user} db={db} />
      case "market":
        return <Market user={user} db={db} storage={storage} />
      case "other-shops":
        return <OtherShops user={user} db={db} storage={storage} />
      case "admin":
        return user?.isAdmin ? <AdminPanel db={db} /> : <PublicChat user={user} db={db} socket={socket} />
      case "logout":
        setUser(null)
        setCurrentPage("public-chat")
        return null
      default:
        return <PublicChat user={user} db={db} socket={socket} />
    }
  }

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono">
      {!user ? (
        <div className="bg-hacker-screen min-h-screen flex items-center justify-center">
          <LoginRegister onLogin={setUser} db={db} />
        </div>
      ) : (
        <div className="flex">
          <Sidebar setCurrentPage={setCurrentPage} isAdmin={user.isAdmin} />
          <div className="flex-1">
            <Header user={user} />
            {renderPage()}
          </div>
        </div>
      )}
    </div>
  )
}

