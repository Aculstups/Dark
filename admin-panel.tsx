"use client"

import { useState, useEffect } from "react"
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore"

export default function AdminPanel({ db }) {
  const [activeTab, setActiveTab] = useState("chats")
  const [chats, setChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [requests, setRequests] = useState([])
  const [users, setUsers] = useState([])

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

  useEffect(() => {
    const q = query(collection(db, "requests"), orderBy("timestamp", "desc"))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const requestList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setRequests(requestList)
    })
    return unsubscribe
  }, [db])

  useEffect(() => {
    const fetchUsers = async () => {
      const q = query(collection(db, "users"), where("deleted", "==", false))
      const querySnapshot = await getDocs(q)
      const userList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setUsers(userList)
    }
    fetchUsers()
  }, [db])

  const handleRequestAction = async (requestId, action) => {
    try {
      const requestRef = doc(db, "requests", requestId)
      const request = requests.find((r) => r.id === requestId)

      if (action === "accept") {
        await updateDoc(requestRef, { status: "accepted" })

        if (request && request.type === "shop") {
          // Get user's current shop count
          const userQuery = query(collection(db, "users"), where("anonymousId", "==", request.user))
          const userSnapshot = await getDocs(userQuery)
          const userData = userSnapshot.docs[0]

          // Update user's shop count
          await updateDoc(doc(db, "users", userData.id), {
            shopCount: (userData.data().shopCount || 0) + 1,
          })

          // Create the shop
          await addDoc(collection(db, "shops"), {
            owner: request.user,
            name: request.shopName,
            description: request.shopDescription,
            createdAt: new Date(),
          })
        }
      } else if (action === "reject") {
        await updateDoc(requestRef, { status: "rejected" })
      } else if (action === "delete") {
        await deleteDoc(requestRef)
      }

      alert(`Anfrage wurde ${action === "accept" ? "angenommen" : action === "reject" ? "abgelehnt" : "gelöscht"}!`)
    } catch (error) {
      console.error("Error handling request: ", error)
      alert("Fehler beim Bearbeiten der Anfrage. Bitte versuchen Sie es erneut.")
    }
  }

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Möchten Sie diesen Benutzer wirklich löschen?")) {
      try {
        const userRef = doc(db, "users", userId)
        await updateDoc(userRef, { deleted: true })
        alert("Benutzer wurde erfolgreich gelöscht!")
      } catch (error) {
        console.error("Error deleting user: ", error)
        alert("Fehler beim Löschen des Benutzers. Bitte versuchen Sie es erneut.")
      }
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl mb-4">Admin Panel</h2>
      <div className="mb-4">
        <button
          onClick={() => setActiveTab("chats")}
          className={`mr-2 p-2 ${activeTab === "chats" ? "bg-blue-700" : "bg-gray-700"} rounded`}
        >
          Chats
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`mr-2 p-2 ${activeTab === "requests" ? "bg-blue-700" : "bg-gray-700"} rounded`}
        >
          Anfragen
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`mr-2 p-2 ${activeTab === "users" ? "bg-blue-700" : "bg-gray-700"} rounded`}
        >
          Benutzer
        </button>
      </div>
      {activeTab === "chats" && (
        <div className="flex">
          <div className="w-1/3 pr-4">
            <h3 className="text-xl mb-4">Alle Chats</h3>
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
      )}
      {activeTab === "requests" && (
        <div>
          <h3 className="text-xl mb-4">Anfragen</h3>
          <div className="bg-gray-800 rounded-lg p-4">
            {requests.map((request) => {
              const user = users.find((u) => u.anonymousId === request.user)
              return (
                <div key={request.id} className="mb-4 p-4 bg-gray-700 rounded-lg">
                  <p className="font-bold">{request.user}</p>
                  <p>{request.text}</p>
                  {request.type === "shop" && (
                    <p className="text-sm text-gray-400">Aktuelle Shops: {user?.shopCount || 0}</p>
                  )}
                  <p className="text-sm text-gray-400">{request.timestamp.toDate().toLocaleString()}</p>
                  <div className="mt-2">
                    <button
                      onClick={() => handleRequestAction(request.id, "accept")}
                      className="mr-2 p-2 bg-green-700 rounded hover:bg-green-600"
                    >
                      Annehmen
                    </button>
                    <button
                      onClick={() => handleRequestAction(request.id, "reject")}
                      className="mr-2 p-2 bg-red-700 rounded hover:bg-red-600"
                    >
                      Ablehnen
                    </button>
                    <button
                      onClick={() => handleRequestAction(request.id, "delete")}
                      className="p-2 bg-gray-600 rounded hover:bg-gray-500"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {activeTab === "users" && (
        <div>
          <h3 className="text-xl mb-4">Benutzerverwaltung</h3>
          <div className="bg-gray-800 rounded-lg p-4">
            {users.map((user) => (
              <div key={user.id} className="mb-2 p-2 bg-gray-700 rounded flex justify-between items-center">
                <div>
                  <p>
                    <strong>Name:</strong> {user.name}
                  </p>
                  <p>
                    <strong>Anonym ID:</strong> {user.anonymousId}
                  </p>
                  <p>
                    <strong>Admin:</strong> {user.isAdmin ? "Ja" : "Nein"}
                  </p>
                  <p>
                    <strong>Shops:</strong> {user.shopCount || 0}
                  </p>
                </div>
                {!user.isAdmin && (
                  <button onClick={() => handleDeleteUser(user.id)} className="p-2 bg-red-700 rounded hover:bg-red-600">
                    Löschen
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

