// apps/web/app/hooks/useProductCategories.ts
'use client'

import { useState, useEffect } from 'react'
import { api } from '@/app/lib/api'

export interface ProductCategory {
  value: string
  label: string
}

export function useProductCategories() {
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      // Utiliser l'API existante
      const response = await api.getPublicCategories()

      if (response.data) {
        // Ajouter l'option vide au début
        const allCategories = [
          { value: '', label: 'Sélectionner une catégorie' },
          ...response.data
        ]
        setCategories(allCategories)
      } else {
        // Fallback manuel
        setCategories(getFallbackCategories())
      }
    } catch (err) {
      console.error('Erreur chargement catégories:', err)
      setError('Impossible de charger les catégories')
      setCategories(getFallbackCategories())
    } finally {
      setLoading(false)
    }
  }

  const getFallbackCategories = (): ProductCategory[] => {
    return [
      { value: '', label: 'Sélectionner une catégorie' },
      { value: 'smartphone', label: 'Smartphones' },
      { value: 'ordinateur', label: 'Ordinateurs & Tablettes' },
      { value: 'tv', label: 'TV & Home Cinéma' },
      { value: 'audio', label: 'Audio & Casques' },
      { value: 'photo', label: 'Photo & Vidéo' },
      { value: 'vetement-homme', label: 'Vêtements Homme' },
      { value: 'vetement-femme', label: 'Vêtements Femme' },
      { value: 'chaussures', label: 'Chaussures' },
      { value: 'accessoire', label: 'Accessoires' },
      { value: 'sportswear', label: 'Vêtements de sport' },
      { value: 'mobilier', label: 'Meubles' },
      { value: 'decoration', label: 'Décoration' },
      { value: 'cuisine', label: 'Cuisine' },
      { value: 'linge-maison', label: 'Linge de maison' },
      { value: 'logiciel', label: 'Logiciels' },
      { value: 'ebook', label: 'Livres numériques' },
      { value: 'musique', label: 'Musique numérique' },
      { value: 'video', label: 'Vidéos en ligne' },
      { value: 'formation', label: 'Formations en ligne' },
      { value: 'template', label: 'Modèles & Templates' },
      { value: 'graphisme', label: 'Design & Graphisme' },
      { value: 'autre', label: 'Autre' }
    ]
  }

  return { categories, loading, error }
}