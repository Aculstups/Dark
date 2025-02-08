"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"

export default function Requests({ db }) {
  const [requests, setRequests] = useState([])

  useEffect(() => {
    const q = query(collection(db, "requests"), orderBy("timestamp", "desc"))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const requestList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setRequests(requestList)
    })
    return unsubscribe
  }, [db])

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl mb-4">Anfragen</h2>
      <div className="bg-gray-800 rounded-lg p-4">
        {requests.map((request) => (
          <div key={request.id} className="mb-4 p-4 bg-gray-700 rounded-lg">
            <p className="font-bold">{request.user}</p>
            <p>{request.text}</p>
            <p className="text-sm text-gray-400">{request.timestamp.toDate().toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

