'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, X, Loader2 } from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  image?: string
  shop_name: string
  category?: string
  tags?: string[]
  description?: string
}

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  // Charger les catégories disponibles
  useEffect(() => {
    const loadCategories = async () => {
      try {
        // Utiliser le proxy Next.js
        const res = await fetch('/api/v1/public/categories/products')
        const data = await res.json()
        setCategories(Array.isArray(data) ? data.map(c => c.value).filter(Boolean) : [])
      } catch (err) {
        console.error('Erreur chargement catégories:', err)
      }
    }
    loadCategories()
  }, [])

  // Fermer les résultats au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 🔍 RECHERCHE INSTANTANÉE
  useEffect(() => {
    const searchProducts = async () => {
      if (query.length < 2) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        // ✅ Utiliser le proxy Next.js (recommandé)
        const response = await fetch(`/api/v1/public/search/instant?q=${encodeURIComponent(query)}&limit=6`)

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}`)
        }

        const data = await response.json()
        setResults(data.products || [])
        setShowResults(true)
      } catch (err) {
        console.error('Erreur recherche:', err)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(searchProducts, 150)
    return () => clearTimeout(debounce)
  }, [query])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
      setShowResults(false)
      setQuery('')
    }
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    try {
      const regex = new RegExp(`(${query})`, 'gi')
      const parts = text.split(regex)
      return parts.map((part, i) => 
        regex.test(part) ? <mark key={i} className="bg-yellow-200 font-normal">{part}</mark> : part
      )
    } catch {
      return text
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price / 100)
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-xl mx-2">
      <form onSubmit={handleSearch} className="relative">
        {/* Icône recherche */}
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un produit..."
          className="w-full pl-9 pr-20 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-colors"
          onFocus={() => query.length >= 2 && setShowResults(true)}
        />

        {/* Bouton effacer */}
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setResults([])
              inputRef.current?.focus()
            }}
            className="absolute right-16 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}

        {/* Loader */}
        {isLoading && (
          <Loader2 className="absolute right-16 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600 animate-spin" />
        )}

        {/* Bouton recherche */}
        <button
          type="submit"
          disabled={!query.trim()}
          className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          OK
        </button>
      </form>

      {/* Résultats instantanés */}
      {showResults && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {results.length > 0 ? (
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
              {results.map(product => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setShowResults(false)
                    setQuery('')
                  }}
                >
                  {/* Image */}
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">
                        📦
                      </div>
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {highlightMatch(product.name, query)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">
                        {product.shop_name}
                      </span>
                      {product.category && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-500">
                            {product.category}
                          </span>
                        </>
                      )}
                    </div>
                    {product.description && (
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                        {highlightMatch(product.description, query)}
                      </p>
                    )}
                  </div>

                  {/* Prix */}
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-600">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </Link>
              ))}

              {/* Lien vers tous les résultats */}
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                className="block p-3 text-center text-sm text-blue-600 hover:bg-blue-50 font-medium border-t"
                onClick={() => {
                  setShowResults(false)
                  setQuery('')
                }}
              >
                Voir tous les résultats pour "{query}"
              </Link>
            </div>
          ) : !isLoading && (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-4xl mb-3">🔍</div>
              <p className="text-gray-600 text-sm">Aucun produit trouvé</p>
              <p className="text-xs text-gray-500 mt-1">Essayez avec d'autres mots</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}