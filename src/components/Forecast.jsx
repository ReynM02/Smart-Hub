import { useState, useEffect } from 'react'

// Map WMO weather codes to descriptions and icon files
const weatherCodeMap = {
  0: { description: 'Clear', iconBase: 'clear' },
  1: { description: 'Mostly Clear', iconBase: 'cloudy-1' },
  2: { description: 'Partly Cloudy', iconBase: 'cloudy-2' },
  3: { description: 'Overcast', iconBase: 'cloudy-3' },
  45: { description: 'Foggy', iconBase: 'fog' },
  48: { description: 'Foggy', iconBase: 'fog' },
  51: { description: 'Light Drizzle', iconBase: 'rainy-1' },
  53: { description: 'Moderate Drizzle', iconBase: 'rainy-1' },
  55: { description: 'Heavy Drizzle', iconBase: 'rainy-2' },
  61: { description: 'Slight Rain', iconBase: 'rainy-1' },
  63: { description: 'Moderate Rain', iconBase: 'rainy-2' },
  65: { description: 'Heavy Rain', iconBase: 'rainy-3' },
  71: { description: 'Slight Snow', iconBase: 'snowy-1' },
  73: { description: 'Moderate Snow', iconBase: 'snowy-2' },
  75: { description: 'Heavy Snow', iconBase: 'snowy-3' },
  77: { description: 'Snow Grains', iconBase: 'snowy-1' },
  80: { description: 'Slight Showers', iconBase: 'rainy-1' },
  81: { description: 'Moderate Showers', iconBase: 'rainy-2' },
  82: { description: 'Heavy Showers', iconBase: 'rainy-3' },
  85: { description: 'Slight Snow Showers', iconBase: 'snowy-1' },
  86: { description: 'Heavy Snow Showers', iconBase: 'snowy-3' },
  95: { description: 'Thunderstorm', iconBase: 'thunderstorms' },
  96: { description: 'Thunderstorm w/ Hail', iconBase: 'severe-thunderstorm' },
  99: { description: 'Thunderstorm w/ Hail', iconBase: 'severe-thunderstorm' }
}

// Determine if it's currently day or night
function isDaytime() {
  const hour = new Date().getHours()
  return hour >= 6 && hour < 18
}

// Get the appropriate icon file based on weather code and time of day
function getWeatherIcon(weatherCode) {
  const weather = weatherCodeMap[weatherCode]
  if (!weather) return 'cloudy.svg'

  const { iconBase } = weather
  const daytime = isDaytime()

  // Icons that have day/night variants
  const dayNightIcons = [
    'clear',
    'cloudy-1',
    'cloudy-2',
    'cloudy-3',
    'fog',
    'frost',
    'haze',
    'rainy-1',
    'rainy-2',
    'rainy-3',
    'snowy-1',
    'snowy-2',
    'snowy-3',
    'isolated-thunderstorms',
    'scattered-thunderstorms'
  ]

  // If icon has day/night variants and it's a variant icon, use the appropriate one
  if (dayNightIcons.includes(iconBase)) {
    return daytime ? `${iconBase}-day.svg` : `${iconBase}-night.svg`
  }

  // Otherwise use the default icon
  return `${iconBase}.svg`
}

export function Forecast({ location }) {
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const CACHE_KEY = 'forecast-cache'
  const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes in milliseconds

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check if cached forecast exists and is still valid
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
          const { data, timestamp } = JSON.parse(cached)
          const now = Date.now()
          
          if (now - timestamp < CACHE_DURATION) {
            // Reconstruct Date objects from cached strings
            const reconstructed = data.map(day => ({
              ...day,
              date: new Date(day.date)
            }))
            setForecast(reconstructed)
            setLoading(false)
            return
          }
        }

        // For demo purposes, using a fixed location
        const position = {
          coords: { latitude: 43.1457025, longitude: -86.196591 }
        }

        const { latitude, longitude } = position.coords

        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto`
        )

        if (!response.ok) throw new Error('Forecast fetch failed')

        const data = await response.json()
        const days = data.daily

        // Get next 7 days
        const forecastDays = days.time.slice(0, 7).map((date, index) => ({
          date: new Date(date),
          high: Math.round(days.temperature_2m_max[index]),
          low: Math.round(days.temperature_2m_min[index]),
          weatherCode: days.weather_code[index],
          description: weatherCodeMap[days.weather_code[index]].description || 'Unknown'
        }))

        setForecast(forecastDays)

        // Cache the forecast data with current timestamp
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: forecastDays,
          timestamp: Date.now()
        }))
      } catch (err) {
        setError('Unable to fetch forecast')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchForecast()
  }, [])

  if (loading) return <div className="forecast-container"><div className="loading">Loading forecast...</div></div>
  if (error) return <div className="forecast-container"><div className="error">{error}</div></div>
  if (!forecast) return null

  return (
    <div className="forecast-container">
      <h2 className="forecast-title">7-Day Forecast</h2>
      <div className="forecast-grid">
        {forecast.map((day, index) => (
          <div key={index} className="forecast-day">
            <div className="forecast-day-name">
              {index === 0 ? 'Today' : day.date.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <img 
              src={`/Assets/Icons/${getWeatherIcon(day.weatherCode)}`} 
              alt={day.description}
              className="forecast-icon"
            />
            <div className="forecast-description">{day.description}</div>
            <div className="forecast-temps">
              <span className="forecast-high">{day.high}°</span>
              <span className="forecast-low">{day.low}°</span>
            </div>
          </div>
        ))}
      </div>
      <div className="forecast-hint">Click to return to main screen</div>
    </div>
  )
}
