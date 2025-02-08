"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore"

export default function AdminChats({ db }) {
  const [chats, setChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])

  useEffect(() => {
    const q = query(collection(db, "privateChats"), orderBy("lastMessageTime", "desc"))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const chatList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setChats(chatList)
    })
    return unsubscribe
  }, [db])

  useEffect(() => {
    if (selectedChat) {
      const q = query(collection(db, "privateMessages"), where("chatId", "==", selectedChat.id), orderBy("timestamp"))
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messageList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setMessages(messageList)
      })
      return unsubscribe
    }
  }, [db, selectedChat])

  return (
    <div className="container mx-auto p-4 flex">
      <div className="w-1/3 pr-4">
        <h2 className="text-2xl mb-4">Alle Chats</h2>
        <div className="bg-gray-800 rounded-lg p-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={`p-2 cursor-pointer ${selectedChat?.id === chat.id ? "bg-gray-700" : "hover:bg-gray-700"}`}
            >
              {chat.participants ? chat.participants.join(", ") : "Loading..."}
            </div>
          ))}
        </div>
      </div>
      <div className="w-2/3 pl-4">
        {selectedChat ? (
          <>
            <h3 className="text-xl mb-4">
              Chat zwischen {selectedChat.participants ? selectedChat.participants.join(" und ") : "Loading..."}
            </h3>
            <div className="bg-gray-800 p-4 rounded-lg shadow-lg h-[calc(100vh-200px)] overflow-y-auto">
              {messages.map((message) => (
                <div key={message.id} className="mb-2">
                  <span className="font-bold">{message.sender}: </span>
                  <span>{message.text}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p>Wählen Sie einen Chat aus, um die Nachrichten einzusehen.</p>
        )}
      </div>
    </div>
  )
}

