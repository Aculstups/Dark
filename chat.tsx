"use client"

import { useState, useEffect } from "react"
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore"

export default function Chat({ user, db }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("timestamp"))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setMessages(messages)
    })
    return unsubscribe
  }, [db])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (newMessage.trim()) {
      await addDoc(collection(db, "messages"), {
        text: newMessage,
        user: "Anonym",
        timestamp: new Date(),
      })
      setNewMessage("")
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl mb-4 text-center">Willkommen im Darknet der United Islands</h2>
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
        <div className="h-64 overflow-y-auto mb-4">
          {messages.map((message, index) => (
            <div key={index} className="mb-2">
              <span className="font-bold">{message.user}: </span>
              <span>{message.text}</span>
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-grow p-2 bg-gray-700 rounded-l"
            placeholder="Nachricht eingeben..."
          />
          <button type="submit" className="p-2 bg-green-700 rounded-r hover:bg-green-600">
            Senden
          </button>
        </form>
      </div>
    </div>
  )
}

