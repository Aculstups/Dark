"use client"

import { useState, useEffect } from "react"
import { collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore"
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"

export default function OtherShops({ user, db }) {
  const [shops, setShops] = useState([])
  const [selectedShop, setSelectedShop] = useState(null)
  const [newShop, setNewShop] = useState({ name: "", description: "" })
  const [requestText, setRequestText] = useState("")
  const [products, setProducts] = useState([])
  const [newProduct, setNewProduct] = useState({ name: "", price: "", description: "" })
  const [file, setFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    const fetchShops = async () => {
      const q = query(collection(db, "shops"))
      const querySnapshot = await getDocs(q)
      const shopList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setShops(shopList)
    }
    fetchShops()
  }, [db])

  useEffect(() => {
    const fetchProducts = async () => {
      if (selectedShop) {
        const q = query(
          collection(db, "shopProducts"),
          where("shopId", "==", selectedShop.id),
          orderBy("timestamp", "desc"),
        )
        const querySnapshot = await getDocs(q)
        const productList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setProducts(productList)
      }
    }
    fetchProducts()
  }, [db, selectedShop])

  const handleShopRequest = async (e) => {
    e.preventDefault()
    if (requestText.trim()) {
      try {
        await addDoc(collection(db, "requests"), {
          text: requestText,
          user: user.anonymousId,
          type: "shop",
          shopName: newShop.name,
          shopDescription: newShop.description,
          timestamp: new Date(),
        })
        setRequestText("")
        setNewShop({ name: "", description: "" })
        alert("Anfrage zur Shoperstellung wurde gesendet!")
      } catch (error) {
        console.error("Error sending shop request: ", error)
        alert("Fehler beim Senden der Anfrage. Bitte versuchen Sie es erneut.")
      }
    }
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    if (newProduct.name && newProduct.price) {
      try {
        setIsUploading(true)
        setUploadProgress(0)
        const storage = getStorage()
        let imageUrl = ""

        if (file) {
          const storageRef = ref(storage, `shop_products/${selectedShop.id}/${Date.now()}_${file.name}`)
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
              await addDoc(collection(db, "shopProducts"), {
                ...newProduct,
                imageUrl,
                shopId: selectedShop.id,
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
          await addDoc(collection(db, "shopProducts"), {
            ...newProduct,
            shopId: selectedShop.id,
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

  const isShopOwner = selectedShop?.owner === user.anonymousId

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl mb-4">Andere Shops</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {shops.map((shop) => (
          <div
            key={shop.id}
            onClick={() => setSelectedShop(shop)}
            className={`bg-gray-800 p-4 rounded-lg shadow-lg cursor-pointer ${
              selectedShop?.id === shop.id ? "ring-2 ring-green-500" : ""
            }`}
          >
            <h3 className="text-xl mb-2">{shop.name}</h3>
            <p>{shop.description}</p>
            <p className="text-sm text-gray-400 mt-2">Besitzer: {shop.owner}</p>
          </div>
        ))}
      </div>

      {selectedShop && (
        <div className="mt-8">
          <h3 className="text-2xl mb-4">{selectedShop.name}</h3>
          {isShopOwner && (
            <form onSubmit={handleAddProduct} className="mb-8 bg-gray-800 p-4 rounded-lg">
              <h4 className="text-xl mb-4">Produkt hinzufügen</h4>
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
        </div>
      )}

      {!user.hasShop && !selectedShop && (
        <div className="mt-8 bg-gray-800 p-4 rounded-lg">
          <h3 className="text-xl mb-2">Beantragen Sie einen eigenen Shop</h3>
          <form onSubmit={handleShopRequest}>
            <input
              type="text"
              placeholder="Shop Name"
              value={newShop.name}
              onChange={(e) => setNewShop({ ...newShop, name: e.target.value })}
              className="w-full p-2 mb-2 bg-gray-700 rounded"
            />
            <textarea
              placeholder="Shop Beschreibung"
              value={newShop.description}
              onChange={(e) => setNewShop({ ...newShop, description: e.target.value })}
              className="w-full p-2 mb-2 bg-gray-700 rounded"
            />
            <textarea
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              className="w-full p-2 mb-2 bg-gray-700 rounded"
              placeholder="Begründen Sie Ihre Anfrage..."
            />
            <button type="submit" className="w-full p-2 bg-blue-700 rounded hover:bg-blue-600">
              Shop-Anfrage senden
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

