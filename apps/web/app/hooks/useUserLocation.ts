// apps/web/app/hooks/useUserLocation.ts
'use client'

import { useState, useEffect } from 'react'

export function useUserLocation() {
  const [country, setCountry] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const detectCountry = async () => {
      try {
        // Utiliser une API gratuite de géolocalisation IP
        const response = await fetch('https://ipapi.co/json/')
        const data = await response.json()
        setCountry(data.country_code)
      } catch (error) {
        console.error('Erreur détection pays:', error)
        setCountry(null)
      } finally {
        setLoading(false)
      }
    }

    detectCountry()
  }, [])

  return { country, loading }
}