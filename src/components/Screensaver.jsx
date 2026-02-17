import { useState, useEffect } from 'react'
import { getImages } from '../utils/imageDatabase'

export function Screensaver({ onExit, imageDuration = 15000 }) {
  const [images, setImages] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadImages = async () => {
      try {
        const loadedImages = await getImages()
        if (loadedImages.length > 0) {
          setImages(loadedImages)
        }
        setLoading(false)
      } catch (err) {
        console.error('Failed to load screensaver images:', err)
        setLoading(false)
      }
    }

    loadImages()
  }, [])

  useEffect(() => {
    if (!images.length) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, imageDuration)

    return () => clearInterval(interval)
  }, [images, imageDuration])

  const handleClick = () => {
    onExit()
  }

  if (loading) {
    return (
      <div className="screensaver-container" onClick={handleClick}>
        <div className="screensaver-loading">Loading images...</div>
      </div>
    )
  }

  if (!images.length) {
    return (
      <div className="screensaver-container" onClick={handleClick}>
        <div className="screensaver-no-images">
          No images uploaded. Click to return.
        </div>
      </div>
    )
  }

  return (
    <div className="screensaver-container" onClick={handleClick}>
      <div className="screensaver-image-wrapper">
        <img
          src={images[currentIndex].dataUrl}
          alt="Screensaver"
          className="screensaver-image"
        />
        <div className="screensaver-counter">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  )
}
