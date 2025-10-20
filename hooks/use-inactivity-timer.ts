"use client"

import { useEffect, useState, useRef } from "react"

export function useInactivityTimer(timeout = 5 * 60 * 1000) {
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(60) // e.g. 60 seconds warning
  const timer = useRef<NodeJS.Timeout | null>(null)
  const countdownInterval = useRef<NodeJS.Timeout | null>(null)

  const resetTimer = () => {
    if (timer.current) clearTimeout(timer.current)
    if (countdownInterval.current) clearInterval(countdownInterval.current)
    setShowWarning(false)

    timer.current = setTimeout(() => {
      setShowWarning(true)
      let seconds = 60
      setCountdown(seconds)
      countdownInterval.current = setInterval(() => {
        seconds -= 1
        setCountdown(seconds)
        if (seconds <= 0) {
          clearInterval(countdownInterval.current!)
          // Log out the user or take any action here
          window.location.href = "/logout" // replace as needed
        }
      }, 1000)
    }, timeout)
  }

  const dismissWarning = () => {
    resetTimer()
  }

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"]
    events.forEach((event) => window.addEventListener(event, resetTimer))
    resetTimer()

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer))
      if (timer.current) clearTimeout(timer.current)
      if (countdownInterval.current) clearInterval(countdownInterval.current)
    }
  }, [])

  return { showWarning, countdown, dismissWarning }
}
