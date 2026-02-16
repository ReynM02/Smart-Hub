import { useState, useEffect } from 'react'
import { Clock } from './components/Clock'
import { Weather } from './components/Weather'
import { Forecast } from './components/Forecast'

function App() {
  const [currentPage, setCurrentPage] = useState('main')
  const [prevPage, setPrevPage] = useState('main')
  const [isAnimating, setIsAnimating] = useState(false)
  const [location, setLocation] = useState('')

  useEffect(() => {
    if (currentPage === 'forecast') {
      const timer = setTimeout(() => {
        setCurrentPage('main')
      }, 60000) // 60 seconds

      return () => clearTimeout(timer)
    }
  }, [currentPage])

  const handleScreenClick = () => {
    if (isAnimating) return

    setIsAnimating(true)
    setPrevPage(currentPage)
    setCurrentPage(currentPage === 'main' ? 'forecast' : 'main')
    
    setTimeout(() => {
      setIsAnimating(false)
    }, 500)
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
    <div className="app-container" onClick={handleScreenClick} style={{ cursor: 'pointer' }}>
      {isAnimating && (
        <div className={`page-content ${getExitClass()}`}>
          {prevPage === 'main' ? (
            <>
              <Clock />
              <Weather />
            </>
          ) : (
            <Forecast location={location} />
          )}
        </div>
      )}
      <div className={`page-content ${isAnimating ? getEnterClass() : ''}`}>
        {currentPage === 'main' ? (
          <>
            <Clock />
            <Weather />
          </>
        ) : (
          <Forecast location={location} />
        )}
      </div>
    </div>
  )
}

export default App

