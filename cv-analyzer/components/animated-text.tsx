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
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!phrases || phrases.length === 0 || !isMounted) return
    
    const phrase = phrases[currentIndex]
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (currentText.length < phrase.length) {
          setCurrentText(phrase.substring(0, currentText.length + 1))
        } else {
          setTimeout(() => setIsDeleting(true), delay)
        }
      } else {
        if (currentText.length > 0) {
          setCurrentText(phrase.substring(0, currentText.length - 1))
        } else {
          setIsDeleting(false)
          setCurrentIndex((prevIndex) => (prevIndex + 1) % phrases.length)
        }
      }
    }, isDeleting ? speed / 2 : speed)
    
    return () => clearTimeout(timeout)
  }, [currentIndex, currentText, delay, isDeleting, phrases, speed, isMounted])

  return (
    <span className={className}>
      {isMounted ? currentText || "\u00A0" : phrases[0]}
    </span>
  )
}