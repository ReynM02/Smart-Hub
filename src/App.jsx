import { useState, useEffect, useRef } from 'react'
import { Clock } from './components/Clock'
import { Weather } from './components/Weather'
import { Forecast } from './components/Forecast'
import { Screensaver } from './components/Screensaver'
import { Settings } from './components/Settings'

// DEBUG MODE: Set to true to enable screensaver without inactivity timer
const DEBUG_SCREENSAVER = false // Change to true to manually enable screensaver for testing

const INACTIVITY_TIMEOUT = 5*1000 // 10 * 60 * 1000 // 10 minutes
// For testing screensaver quickly, temporarily set to: 5 * 1000 (5 seconds)

function App() {
  const [currentPage, setCurrentPage] = useState('main')
  const [prevPage, setPrevPage] = useState('main')
  const [isAnimating, setIsAnimating] = useState(false)
  const [location, setLocation] = useState('')
  const [isScreensaverActive, setIsScreensaverActive] = useState(DEBUG_SCREENSAVER)
  const [inactivityTimeout, setInactivityTimeout] = useState(() => {
    const saved = localStorage.getItem('screensaver-inactivity-timeout')
    return saved ? parseInt(saved) : 10 * 60 * 1000 // Default: 10 minutes
  })
  const [imageDuration, setImageDuration] = useState(() => {
    const saved = localStorage.getItem('screensaver-image-duration')
    return saved ? parseInt(saved) : 15 * 1000 // Default: 15 seconds
  })
  const inactivityTimerRef = useRef(null)
  const lastActivityRef = useRef(Date.now())
  const isScreensaverActiveRef = useRef(DEBUG_SCREENSAVER)
  const inactivityTimeoutRef = useRef(inactivityTimeout) // Track timeout value for event handler

  // Update timeout ref when state changes
  useEffect(() => {
    inactivityTimeoutRef.current = inactivityTimeout
  }, [inactivityTimeout])

  // Save inactivity timeout to localStorage
  useEffect(() => {
    localStorage.setItem('screensaver-inactivity-timeout', inactivityTimeout.toString())
  }, [inactivityTimeout])

  // Save image duration to localStorage
  useEffect(() => {
    localStorage.setItem('screensaver-image-duration', imageDuration.toString())
  }, [imageDuration])

  // Update the ref whenever state changes so event handlers can access current value
  useEffect(() => {
    isScreensaverActiveRef.current = isScreensaverActive
  }, [isScreensaverActive])

  // Log debug mode on mount
  useEffect(() => {
    if (DEBUG_SCREENSAVER) {
      console.log('🔧 DEBUG MODE: Screensaver is manually enabled. Set DEBUG_SCREENSAVER to false to use inactivity timer.')
    }
  }, [])

  useEffect(() => {
    // Forecast auto-return after 60 seconds
    if (currentPage === 'forecast' && !isScreensaverActive) {
      const timer = setTimeout(() => {
        setCurrentPage('main')
      }, 60000) // 60 seconds

      return () => clearTimeout(timer)
    }
  }, [currentPage, isScreensaverActive])

  // Inactivity detection - set up event listeners once on mount
  useEffect(() => {
    // Skip inactivity logic if in debug mode
    if (DEBUG_SCREENSAVER) return

    const resetInactivityTimer = () => {
      lastActivityRef.current = Date.now()

      // Clear existing timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }

      // Exit screensaver on activity
      if (isScreensaverActiveRef.current) {
        console.log('📸 User activity detected, exiting screensaver')
        setIsScreensaverActive(false)
        return
      }

      // Set new timer
      console.log('⏱️ Inactivity timer started (timeout: ' + (inactivityTimeoutRef.current / 1000) + 's)')
      inactivityTimerRef.current = setTimeout(() => {
        console.log('⏱️ Inactivity timeout reached, activating screensaver')
        setIsScreensaverActive(true)
      }, inactivityTimeoutRef.current)
    }

    // List of events that trigger inactivity reset
    const events = ['click', 'touch', 'keydown', 'mousemove']
    events.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer)
    })

    console.log('🔧 Inactivity detection initialized')

    // Initialize timer on first mount
    resetInactivityTimer()

    return () => {
      console.log('🔧 Cleaning up inactivity detection')
      events.forEach((event) => {
        window.removeEventListener(event, resetInactivityTimer)
      })
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
    }
  }, []) // Empty dependency array - only runs once on mount

  const handleScreenClick = (e) => {
    if (isAnimating || isScreensaverActive) return

    // If on settings page, ignore regular clicks (only close button or right-click allowed)
    if (currentPage === 'settings' && e.button !== 2 && e.type !== 'contextmenu') {
      return
    }

    // Right-click or long-press toggles settings
    if (e.button === 2 || e.type === 'contextmenu') {
      e.preventDefault()
      setCurrentPage(currentPage === 'settings' ? 'main' : 'settings')
      return
    }

    // Regular left-click only navigates between main and forecast (not from settings)
    if (currentPage !== 'settings') {
      e.preventDefault()
      setIsAnimating(true)
      setPrevPage(currentPage)
      setCurrentPage(currentPage === 'main' ? 'forecast' : 'main')

      setTimeout(() => {
        setIsAnimating(false)
      }, 500)
    }
  }

  const handleOpenSettings = () => {
    setCurrentPage('settings')
  }

  const handleCloseSettings = () => {
    setCurrentPage('main')
  }

  const exitScreensaver = () => {
    setIsScreensaverActive(false)
  }

  const getExitClass = () => {
    if (!isAnimating) return ''
    
    const isGoingFromMainToForecast = prevPage === 'main'
    return isGoingFromMainToForecast ? 'page-exit-left' : 'page-exit-right'
  }

  const getEnterClass = () => {
    if (!isAnimating) return ''
    
    const isGoingFromMainToForecast = prevPage === 'main'
    return isGoingFromMainToForecast ? 'page-enter-right' : 'page-enter-left'
  }

  return (
    <div
      className="app-container"
      onClick={handleScreenClick}
      onContextMenu={handleScreenClick}
      style={{ cursor: isScreensaverActive ? 'default' : 'pointer' }}
    >
      {isScreensaverActive && (
        <Screensaver onExit={exitScreensaver} imageDuration={imageDuration} />
      )}

      {!isScreensaverActive && (
        <>
          {isAnimating && (
            <div className={`page-content ${getExitClass()}`}>
              {prevPage === 'main' ? (
                <>
                  <Clock />
                  <Weather />
                </>
              ) : prevPage === 'forecast' ? (
                <Forecast location={location} />
              ) : (
                <Settings
                  onClose={handleCloseSettings}
                  inactivityTimeout={inactivityTimeout}
                  setInactivityTimeout={setInactivityTimeout}
                  imageDuration={imageDuration}
                  setImageDuration={setImageDuration}
                />
              )}
            </div>
          )}
          <div className={`page-content ${isAnimating ? getEnterClass() : ''}`}>
            {currentPage === 'main' ? (
              <>
                <Clock />
                <Weather />
              </>
            ) : currentPage === 'forecast' ? (
              <Forecast location={location} />
            ) : (
              <Settings
                onClose={handleCloseSettings}
                inactivityTimeout={inactivityTimeout}
                setInactivityTimeout={setInactivityTimeout}
                imageDuration={imageDuration}
                setImageDuration={setImageDuration}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default App

