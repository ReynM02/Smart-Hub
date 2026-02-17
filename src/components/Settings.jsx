import { useState, useEffect } from 'react'
import { addImage, getImages, deleteImage, clearAllImages } from '../utils/imageDatabase'

export function Settings({ onClose, inactivityTimeout, setInactivityTimeout, imageDuration, setImageDuration }) {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [deviceIp, setDeviceIp] = useState('loading...')

  useEffect(() => {
    loadImages()
    fetchDeviceIp()
  }, [])

  const fetchDeviceIp = async () => {
    try {
      const response = await fetch('/api/device-ip')
      if (response.ok) {
        const data = await response.json()
        setDeviceIp(data.ip || 'localhost')
      }
    } catch (err) {
      console.error('Failed to fetch device IP:', err)
      setDeviceIp('localhost')
    }
  }

  const loadImages = async () => {
    try {
      const loadedImages = await getImages()
      setImages(loadedImages)
      setLoading(false)
    } catch (err) {
      console.error('Failed to load images:', err)
      setMessage('Error loading images')
      setLoading(false)
    }
  }

  const handleFileUpload = async (event) => {
    const files = event.target.files
    if (!files) return

    setUploading(true)
    setMessage('')

    try {
      const uploadPromises = Array.from(files).map((file) => addImage(file))
      await Promise.all(uploadPromises)
      setMessage(`Successfully uploaded ${files.length} image(s)`)
      await loadImages()
    } catch (err) {
      console.error('Upload failed:', err)
      setMessage('Failed to upload images')
    } finally {
      setUploading(false)
      event.target.value = '' // Reset file input
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteImage(id)
      await loadImages()
      setMessage('Image deleted')
    } catch (err) {
      console.error('Delete failed:', err)
      setMessage('Failed to delete image')
    }
  }

  const handleClearAll = async () => {
    if (!window.confirm('Delete all images? This cannot be undone.')) return

    try {
      await clearAllImages()
      await loadImages()
      setMessage('All images deleted')
    } catch (err) {
      console.error('Clear failed:', err)
      setMessage('Failed to clear images')
    }
  }

  return (
    <div className="settings-container" onClick={(e) => e.stopPropagation()}>
      <div className="settings-header">
        <h1>Screensaver Settings</h1>
        <button onClick={onClose} className="settings-close">
          ✕
        </button>
      </div>

      <div className="settings-content">
        <div className="upload-section">
          <h2>📱 Upload from Phone/Computer</h2>
          <p className="upload-hint">
            Open a web browser on your phone or computer and visit:
          </p>
          <div className="web-upload-url">
            <code>http://{deviceIp}:3000/upload.html</code>
          </div>
          <p className="upload-hint">
            (If this doesn't work, find your Raspberry Pi's IP address and replace it manually)
          </p>
        </div>

        <div className="settings-section">
          <h2>⏱️ Screensaver Settings</h2>
          <div className="setting-item">
            <label htmlFor="inactivity-timeout">Inactivity Timeout (before screensaver activates):</label>
            <select
              id="inactivity-timeout"
              value={inactivityTimeout}
              onChange={(e) => setInactivityTimeout(parseInt(e.target.value))}
              onMouseDown={(e) => e.stopPropagation()}
              className="settings-dropdown"
            >
              <option value={5 * 60 * 1000}>5 minutes</option>
              <option value={10 * 60 * 1000}>10 minutes</option>
              <option value={15 * 60 * 1000}>15 minutes</option>
            </select>
          </div>

          <div className="setting-item">
            <label htmlFor="image-duration">Image Duration (seconds per image):</label>
            <select
              id="image-duration"
              value={imageDuration}
              onChange={(e) => setImageDuration(parseInt(e.target.value))}
              onMouseDown={(e) => e.stopPropagation()}
              className="settings-dropdown"
            >
              <option value={5 * 1000}>5 seconds</option>
              <option value={10 * 1000}>10 seconds</option>
              <option value={15 * 1000}>15 seconds</option>
            </select>
          </div>
        </div>

        {message && <div className="message">{message}</div>}

        <div className="images-section">
          <div className="images-header">
            <h2>Uploaded Images ({images.length})</h2>
            {images.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleClearAll()
                }}
                className="clear-all-button"
              >
                Clear All
              </button>
            )}
          </div>

          {loading ? (
            <div className="loading-text">Loading images...</div>
          ) : images.length === 0 ? (
            <div className="no-images">No images uploaded yet</div>
          ) : (
            <div className="images-grid">
              {images.map((image) => (
                <div key={image.id} className="image-thumbnail">
                  <img src={image.dataUrl} alt={image.name} />
                  <div className="image-info">
                    <p>{image.name}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(image.id)
                      }}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="settings-footer">
          <p>
            Each slideshow image displays for 15 seconds.
          </p>
        </div>
      </div>
    </div>
  )
}
