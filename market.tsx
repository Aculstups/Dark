"use client"

import { useState, useEffect } from "react"
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore"
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"

export default function Market({ user, db }) {
  const [products, setProducts] = useState([])
  const [newProduct, setNewProduct] = useState({ name: "", price: "", description: "" })
  const [file, setFile] = useState(null)
  const [requestText, setRequestText] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    const fetchProducts = async () => {
      const q = query(collection(db, "products"), orderBy("timestamp", "desc"))
      const querySnapshot = await getDocs(q)
      const productList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setProducts(productList)
    }
    fetchProducts()
  }, [db])

  const handleAddProduct = async (e) => {
    e.preventDefault()
    if (user.isAdmin && newProduct.name && newProduct.price) {
      try {
        setIsUploading(true)
        setUploadProgress(0)
        const storage = getStorage()
        let imageUrl = ""

        if (file) {
          const storageRef = ref(storage, `product_images/${Date.now()}_${file.name}`)
          const uploadTask = uploadBytesResumable(storageRef, file)

          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              setUploadProgress(progress)
            },
            (error) => {
              console.error("Upload error:", error)
              alert("Fehler beim Hochladen der Datei. Bitte versuchen Sie es erneut.")
              setIsUploading(false)
            },
            async () => {
              imageUrl = await getDownloadURL(uploadTask.snapshot.ref)
              await addDoc(collection(db, "products"), {
                ...newProduct,
                imageUrl,
                timestamp: new Date(),
              })
              setNewProduct({ name: "", price: "", description: "" })
              setFile(null)
              setIsUploading(false)
              setUploadProgress(0)
              alert("Produkt erfolgreich hinzugefügt!")
            },
          )
        } else {
          await addDoc(collection(db, "products"), {
            ...newProduct,
            timestamp: new Date(),
          })
          setNewProduct({ name: "", price: "", description: "" })
          setIsUploading(false)
          alert("Produkt erfolgreich hinzugefügt!")
        }
      } catch (error) {
        console.error("Error adding product: ", error)
        setIsUploading(false)
        alert("Fehler beim Hinzufügen des Produkts. Bitte versuchen Sie es erneut.")
      }
    }
  }

  const handleRequest = async () => {
    if (requestText.trim()) {
      try {
        await addDoc(collection(db, "requests"), {
          text: requestText,
          user: user.anonymousId,
          type: "product",
          timestamp: new Date(),
        })
        setRequestText("")
        alert("Anfrage wurde gesendet!")
      } catch (error) {
        console.error("Error sending request: ", error)
        alert("Fehler beim Senden der Anfrage. Bitte versuchen Sie es erneut.")
      }
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl mb-4">Market</h2>
      {user.isAdmin && (
        <form onSubmit={handleAddProduct} className="mb-8 bg-gray-800 p-4 rounded-lg">
          <input
            type="text"
            placeholder="Produktname"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            className="w-full p-2 mb-2 bg-gray-700 rounded"
            disabled={isUploading}
          />
          <input
            type="text"
            placeholder="Preis"
            value={newProduct.price}
            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
            className="w-full p-2 mb-2 bg-gray-700 rounded"
            disabled={isUploading}
          />
          <textarea
            placeholder="Beschreibung"
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            className="w-full p-2 mb-2 bg-gray-700 rounded"
            disabled={isUploading}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full p-2 mb-2 bg-gray-700 rounded"
            disabled={isUploading}
          />
          {isUploading && (
            <div className="w-full bg-gray-700 rounded mb-2">
              <div className="bg-green-600 rounded h-2" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
          <button
            type="submit"
            className="w-full p-2 bg-green-700 rounded hover:bg-green-600 disabled:opacity-50"
            disabled={isUploading}
          >
            {isUploading ? `Wird hochgeladen... ${Math.round(uploadProgress)}%` : "Produkt hinzufügen"}
          </button>
        </form>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div key={product.id} className="bg-gray-800 p-4 rounded-lg shadow-lg">
            {product.imageUrl && (
              <img
                src={product.imageUrl || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-48 object-cover mb-2 rounded"
              />
            )}
            <h3 className="text-xl mb-2">{product.name}</h3>
            <p className="mb-2">{product.description}</p>
            <p className="font-bold">{product.price} Credits</p>
          </div>
        ))}
      </div>
      <div className="mt-8 bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl mb-2">Etwas fehlt? Stellen Sie eine Anfrage!</h3>
        <textarea
          value={requestText}
          onChange={(e) => setRequestText(e.target.value)}
          className="w-full p-2 mb-2 bg-gray-700 rounded"
          placeholder="Beschreiben Sie Ihre Anfrage..."
        />
        <button onClick={handleRequest} className="w-full p-2 bg-blue-700 rounded hover:bg-blue-600">
          Anfrage senden
        </button>
      </div>
    </div>
  )
}

