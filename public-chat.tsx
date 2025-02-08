"use client"

import { useState, useEffect, useRef } from "react"
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore"

export default function PublicChat({ user, db, socket }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const chatBoxRef = useRef(null)

  useEffect(() => {
    const q = query(collection(db, "publicMessages"), orderBy("timestamp"))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setMessages(messages)
    })

    socket.on("chatMessage", (message) => {
      setMessages((prevMessages) => [...prevMessages, message])
    })

    return () => {
      unsubscribe()
      socket.off("chatMessage")
    }
  }, [db, socket])

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
    }
  }, [chatBoxRef]) //Fixed unnecessary dependency

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (newMessage.trim()) {
      const messageData = {
        text: newMessage,
        user: user.anonymousId,
        timestamp: new Date(),
      }
      await addDoc(collection(db, "publicMessages"), messageData)
      socket.emit("chatMessage", messageData)
      setNewMessage("")
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl mb-4">Öffentlicher Chat</h2>
      <div ref={chatBoxRef} className="chat-messages bg-black text-green-500 mb-4">
        {messages.map((message) => (
          <div key={message.id} className="mb-2">
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
          className="flex-grow p-2 bg-black text-green-500 border border-green-500 rounded-l"
          placeholder="Nachricht eingeben..."
        />
        <button
          type="submit"
          className="p-2 bg-black text-green-500 border border-green-500 rounded-r hover:bg-green-500 hover:text-black"
        >
          Senden
        </button>
      </form>
    </div>
  )
}

