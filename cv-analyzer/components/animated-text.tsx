"use client"

import { useState, useEffect } from "react"

interface AnimatedTextProps {
  phrases: string[]
  className?: string
  speed?: number
  delay?: number
}

export function AnimatedText({
  phrases,
  className = "",
  speed = 50,
  delay = 2000,
}: AnimatedTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentText, setCurrentText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!phrases || phrases.length === 0) return
    
    const phrase = phrases[currentIndex]
    
    // Set up the typing effect
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // If still typing the current phrase
        if (currentText.length < phrase.length) {
          setCurrentText(phrase.substring(0, currentText.length + 1))
        } else {
          // Pause at the end of typing before deleting
          setTimeout(() => setIsDeleting(true), delay)
        }
      } else {
        // If deleting
        if (currentText.length > 0) {
          setCurrentText(phrase.substring(0, currentText.length - 1))
        } else {
          // Move to the next phrase
          setIsDeleting(false)
          setCurrentIndex((prevIndex) => (prevIndex + 1) % phrases.length)
        }
      }
    }, isDeleting ? speed / 2 : speed) // Deleting is faster than typing
    
    return () => clearTimeout(timeout)
  }, [currentIndex, currentText, delay, isDeleting, phrases, speed])

  return <span className={className}>{currentText || phrases[0].charAt(0)}</span>
} 