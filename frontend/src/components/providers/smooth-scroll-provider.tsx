"use client"

import { useEffect, ReactNode } from 'react'

interface SmoothScrollProviderProps {
  children: ReactNode
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  useEffect(() => {
    const initLenis = async () => {
      const Lenis = (await import('@studio-freight/lenis')).default
      
      const lenis = new Lenis({
        lerp: 0.1,
        duration: 1.2,
        smoothWheel: true,
      })

      function raf(time: number) {
        lenis.raf(time)
        requestAnimationFrame(raf)
      }

      requestAnimationFrame(raf)

      return () => {
        lenis.destroy()
      }
    }

    initLenis()
  }, [])

  return <>{children}</>
}