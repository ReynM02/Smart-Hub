// IndexedDB utility functions for storing and retrieving images

const DB_NAME = 'SmartHubDB'
const STORE_NAME = 'screensaver-images'

export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

export const addImage = async (file) => {
  const db = await initDatabase()
  const reader = new FileReader()

  return new Promise((resolve, reject) => {
    reader.onload = () => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const imageData = {
        name: file.name,
        data: reader.result,
        type: file.type,
        uploadedAt: new Date().toISOString()
      }

      const request = store.add(imageData)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

export const getImages = async () => {
  try {
    // First try to get images from the server API (uploaded via web interface)
    const apiResponse = await fetch('/api/images')
    if (apiResponse.ok) {
      const serverImages = await apiResponse.json()
      
      // Convert server images to the same format as IndexedDB images
      const formattedImages = serverImages.map((img) => ({
        id: img.id,
        name: img.name,
        dataUrl: img.url, // Server images use direct URLs
        uploadedAt: img.uploadedAt,
        source: 'server'
      }))

      // Also get locally stored images from IndexedDB
      const localImages = await getLocalImages()
      
      // Combine both sources (server images + local IndexedDB images)
      const allImages = [...formattedImages, ...localImages]
      
      return allImages
    }
  } catch (err) {
    console.log('Server API not available, using local storage only')
  }

  // Fallback to local IndexedDB only if server is not available
  return getLocalImages()
}

const getLocalImages = async () => {
  const db = await initDatabase()
  const transaction = db.transaction([STORE_NAME], 'readonly')
  const store = transaction.objectStore(STORE_NAME)

  return new Promise((resolve, reject) => {
    const request = store.getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const images = request.result.map((img) => ({
        id: img.id,
        name: img.name,
        dataUrl: URL.createObjectURL(new Blob([img.data], { type: img.type })),
        uploadedAt: img.uploadedAt,
        source: 'local'
      }))
      resolve(images)
    }
  })
}

export const deleteImage = async (id) => {
  const db = await initDatabase()
  const transaction = db.transaction([STORE_NAME], 'readwrite')
  const store = transaction.objectStore(STORE_NAME)

  return new Promise((resolve, reject) => {
    const request = store.delete(id)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export const clearAllImages = async () => {
  const db = await initDatabase()
  const transaction = db.transaction([STORE_NAME], 'readwrite')
  const store = transaction.objectStore(STORE_NAME)

  return new Promise((resolve, reject) => {
    const request = store.clear()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}
