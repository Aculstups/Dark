"use client"

import { useState, useEffect } from "react"
import { collection, addDoc, onSnapshot, query, where, orderBy, updateDoc, doc, getDocs } from "firebase/firestore"

export default function PrivateChat({ user, db }) {
  const [chats, setChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [newChatUser, setNewChatUser] = useState("")
  const [users, setUsers] = useState([])

  useEffect(() => {
    const fetchUsers = async () => {
      const usersQuery = query(collection(db, "users"), where("deleted", "==", false))
      const querySnapshot = await getDocs(usersQuery)
      setUsers(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    }
    fetchUsers()
  }, [db])

  useEffect(() => {
    const q = query(collection(db, "privateChats"), where("participants", "array-contains", user.anonymousId))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const chatList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setChats(chatList)
    })
    return unsubscribe
  }, [db, user.anonymousId])

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

  const startNewChat = async () => {
    if (newChatUser.trim()) {
      const targetUser = users.find((u) => u.anonymousId === newChatUser)
      if (!targetUser) {
        alert("Benutzer nicht gefunden")
        return
      }

      const existingChats = chats.filter(
        (chat) => chat.participants.includes(newChatUser) && chat.participants.includes(user.anonymousId),
      )

      if (existingChats.length > 0) {
        setSelectedChat(existingChats[0])
        setNewChatUser("")
        return
      }

      const chatDoc = await addDoc(collection(db, "privateChats"), {
        participants: [user.anonymousId, newChatUser],
        lastMessageTime: new Date(),
      })
      setSelectedChat({ id: chatDoc.id, participants: [user.anonymousId, newChatUser] })
      setNewChatUser("")
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (newMessage.trim() && selectedChat) {
      await addDoc(collection(db, "privateMessages"), {
        chatId: selectedChat.id,
        sender: user.anonymousId,
        text: newMessage,
        timestamp: new Date(),
      })
      await updateDoc(doc(db, "privateChats", selectedChat.id), {
        lastMessageTime: new Date(),
      })
      setNewMessage("")
    }
  }

  return (
    <div className="container mx-auto p-4 flex">
      <div className="w-1/3 pr-4">
        <h2 className="text-2xl mb-4">Private Chats</h2>
        <div className="mb-4">
          <input
            type="text"
            value={newChatUser}
            onChange={(e) => setNewChatUser(e.target.value)}
            placeholder="Neuen Chat starten (Anonym ID)"
            className="w-full p-2 bg-gray-700 rounded mb-2"
          />
          <button onClick={startNewChat} className="w-full p-2 bg-blue-700 rounded hover:bg-blue-600">
            Neuen Chat starten
          </button>
        </div>
        <div className="bg-gray-800 rounded-lg p-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={`p-2 cursor-pointer ${selectedChat?.id === chat.id ? "bg-gray-700" : "hover:bg-gray-700"}`}
            >
              {chat.participants.find((p) => p !== user.anonymousId)}
            </div>
          ))}
        </div>
      </div>
      <div className="w-2/3 pl-4">
        {selectedChat ? (
          <>
            <h3 className="text-xl mb-4">Chat mit {selectedChat.participants.find((p) => p !== user.anonymousId)}</h3>
            <div className="bg-gray-800 p-4 rounded-lg shadow-lg h-[calc(100vh-250px)] flex flex-col">
              <div className="flex-grow overflow-y-auto mb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-2 ${message.sender === user.anonymousId ? "text-right" : "text-left"}`}
                  >
                    <span className="font-bold">{message.sender === user.anonymousId ? "You" : "Other"}: </span>
                    <span>{message.text}</span>
                  </div>
                ))}
              </div>
              <form onSubmit={sendMessage} className="flex">
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
          </>
        ) : (
          <p>Wählen Sie einen Chat aus oder starten Sie einen neuen.</p>
        )}
      </div>
    </div>
  )
}

