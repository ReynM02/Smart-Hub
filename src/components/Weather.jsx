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

export function Weather() {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true)
        setError(null)

        // For demo purposes, using a fixed location (New York City)
        const position = {
          coords: { latitude: 43.1457025, longitude: -86.196591 }
        }

        // Get user's location
        // const position = await new Promise((resolve, reject) => {
        //   navigator.geolocation.getCurrentPosition(resolve, reject)
        // })

        const { latitude, longitude } = position.coords

        // Fetch weather using Open-Meteo API (free, no API key required)
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,relative_humidity_2m&temperature_unit=fahrenheit`
        )

        if (!response.ok) throw new Error('Weather fetch failed')

        const data = await response.json()
        const current = data.current

        // Get location name from coordinates using reverse geocoding
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        )
        const geoData = await geoResponse.json()
        const address = geoData.address || {}
        const city = address.city || address.town || address.village || 'Unknown'
        const state = address.state || ''
        const locationName = state ? `${city}, ${state}` : city

        setWeather({
          temperature: Math.round(current.temperature_2m),
          description: weatherCodeMap[current.weather_code].description || 'Unknown',
          humidity: current.relative_humidity_2m,
          weatherCode: current.weather_code,
          location: locationName
        })
      } catch (err) {
        setError('Unable to fetch weather')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()

    // Refresh weather every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <div className="weather-container"><div className="loading">Loading weather...</div></div>
  if (error) return <div className="weather-container"><div className="error">{error}</div></div>
  if (!weather) return null

  return (
    <div className="weather-container">
      <img 
        src={`/src/Assets/Icons/${getWeatherIcon(weather.weatherCode)}`} 
        alt={weather.description}
        className="weather-icon"
      />
      <div className="weather-main">{weather.temperature}°F</div>
      <div className="weather-details">
        <div>{weather.description}</div>
        <div>Humidity: {weather.humidity}%</div>
      </div>
      <div className="weather-details">{weather.location}</div>
    </div>
  )
}
