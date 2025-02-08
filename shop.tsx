"use client"

import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"

export default function Shop({ db }) {
  const [products, setProducts] = useState([])

  useEffect(() => {
    const fetchProducts = async () => {
      const querySnapshot = await getDocs(collection(db, "products"))
      const productList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setProducts(productList)
    }
    fetchProducts()
  }, [db])

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl mb-4 text-center">Cybersecurity Tools</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div key={product.id} className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <h3 className="text-xl mb-2">{product.name}</h3>
            <p className="mb-2">{product.description}</p>
            <p className="font-bold">{product.price} Credits</p>
          </div>
        ))}
      </div>
    </div>
  )
}

