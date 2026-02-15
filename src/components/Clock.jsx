import { useState, useEffect } from 'react'

export function Clock() {
  const [time, setTime] = useState(new Date())
  const [date, setDate] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setTime(now)
      setDate(now)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    // second: '2-digit',
    hour12: true
  })

  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <div className="clock">
      <div className="time">{formattedTime}</div>
      <div className="date">{formattedDate}</div>
    </div>
  )
}
