'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/app/hooks/useCart'
import { useParams } from 'next/navigation'
import { api, type PublicProduct } from '@/app/lib/api'  // ← CORRECT
import Link from 'next/link'
import CartSidebar from '@/app/components/CartSidebar'

// Composant ProductCard
function ProductCard({ product, slug, addToCart, cartLoading, cartHook }: any) {
  const [localLoading, setLocalLoading] = useState(false)
  
  const cartItem = cartHook?.cart?.items?.find((item: any) => item.product_id === product.id)
  const quantityInCart = cartItem?.quantity || 0
  const availableStock = product.stock - quantityInCart
  const canAdd = availableStock > 0

  const handleAddToCart = async () => {
    if (availableStock <= 0) {
      alert(`Stock insuffisant!`)
      return
    }

    setLocalLoading(true)
    try {
      await addToCart(slug, product.id, 1)
    } catch (err) {
      console.error('Erreur ajout panier:', err)
    } finally {
      setLocalLoading(false)
    }
  }

  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toFixed(2) + ' €'
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Image du produit */}
      <Link href={`/product/${product.id}`}>
        <div className="h-48 bg-gray-100 relative overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <span className="text-gray-300 text-5xl">📦</span>
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.is_featured && (
              <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">⭐ Vedette</span>
            )}
            {product.has_discount && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">-{product.discount_percentage}%</span>
            )}
            {product.is_digital && (
              <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">📦 Numérique</span>
            )}
          </div>
          
          {/* Quantité dans le panier */}
          {quantityInCart > 0 && (
            <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-md">
              {quantityInCart} dans le panier
            </div>
          )}
          
          {/* Stock faible */}
          {availableStock > 0 && availableStock <= 5 && (
            <div className="absolute bottom-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full shadow-md">
              Plus que {availableStock}
            </div>
          )}
          
          {/* Rupture */}
          {availableStock <= 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">Rupture</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        {/* Catégorie et vues */}
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
            {product.category || 'Général'}
          </span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            👁️ {product.view_count || 0}
          </span>
        </div>

        {/* Nom et description */}
        <Link href={`/product/${product.id}`}>
          <h3 className="font-semibold text-gray-900 mb-1 hover:text-blue-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {product.description || 'Pas de description'}
        </p>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.tags.slice(0, 3).map((tag: string) => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Prix et stock */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-xl font-bold text-gray-900">{formatPrice(product.price)}</span>
            {product.has_discount && product.formatted_compare_price && (
              <div className="text-sm text-gray-500 line-through">{product.formatted_compare_price}</div>
            )}
          </div>
          <span className={`text-sm ${
            availableStock > 5 ? 'text-green-600' :
            availableStock > 0 ? 'text-orange-600' : 'text-red-600'
          }`}>
            {availableStock > 0 ? `${availableStock} disponible${availableStock !== 1 ? 's' : ''}` : 'Rupture'}
          </span>
        </div>

        {/* Bouton Ajouter au panier */}
        <button
          onClick={handleAddToCart}
          disabled={!canAdd || localLoading || cartLoading}
          className={`w-full py-2 px-4 rounded-md font-medium flex items-center justify-center gap-2 transition-colors ${
            !canAdd
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : localLoading
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {localLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Ajout...
            </>
          ) : !canAdd ? (
            'Rupture de stock'
          ) : quantityInCart > 0 ? (
            `Ajouter + (${quantityInCart} déjà)`
          ) : (
            'Ajouter au panier'
          )}
        </button>
        
        {/* Lien vers la page produit */}
        <Link href={`/product/${product.id}`} className="block text-center text-blue-600 hover:text-blue-700 text-sm mt-3">
          Voir les détails →
        </Link>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [allProducts, setAllProducts] = useState<PublicProduct[]>([])  // ← CHANGÉ
  const [filteredProducts, setFilteredProducts] = useState<PublicProduct[]>([])  // ← CHANGÉ
  const [displayedProducts, setDisplayedProducts] = useState<PublicProduct[]>([])  // ← CHANGÉ
  const [isLoading, setIsLoading] = useState(true)
  const [shop, setShop] = useState<any>(null)
  
  // Filtres
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [minPrice, setMinPrice] = useState<number | ''>('')
  const [maxPrice, setMaxPrice] = useState<number | ''>('')
  const [inStock, setInStock] = useState<boolean | ''>('')
  const [featured, setFeatured] = useState<boolean | ''>('')
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [sortBy, setSortBy] = useState<'created_at' | 'name' | 'price' | 'view_count'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const perPage = 12
  
  const cartHook = useCart(slug)
  const { addToCart, isLoading: cartLoading, cart } = cartHook

  // Extraire les catégories uniques
  const categories = ['all', ...new Set(allProducts.map(p => p.category).filter(Boolean) as string[])]
  
  // Extraire les tags uniques
  const allTags = Array.from(new Set(allProducts.flatMap(p => p.tags || [])))

  // Fonction pour calculer le stock disponible réel
  const getAvailableStock = (product: PublicProduct): number => {  // ← CHANGÉ
    const items = cart?.items || []
    const cartItem = items.find((item: any) => item.product_id === product.id)
    const quantityInCart = cartItem?.quantity || 0
    return product.stock - quantityInCart
  }

  // Fonction pour vérifier si on peut acheter
  const isProductInStock = (product: PublicProduct): boolean => {  // ← CHANGÉ
    return getAvailableStock(product) > 0
  }

  // Charger la boutique et TOUS les produits
  useEffect(() => {
    loadShop()
    loadAllProducts()
  }, [slug])

  // Appliquer les filtres quand les filtres changent
  useEffect(() => {
    applyFilters()
  }, [allProducts, selectedCategory, searchQuery, minPrice, maxPrice, inStock, featured, selectedTag, sortBy, sortOrder])

  // Mettre à jour les produits affichés quand la pagination ou les produits filtrés changent
  useEffect(() => {
    updateDisplayedProducts()
  }, [filteredProducts, currentPage])

  const loadShop = async () => {
    try {
      const response = await api.getPublicShop(slug)
      if (response.data) {
        setShop(response.data)
      }
    } catch (err) {
      console.error('Erreur chargement boutique:', err)
    }
  }

  const loadAllProducts = async () => {
    setIsLoading(true)
    try {
      const searchOptions: any = {
        limit: 1000,
        sort_by: 'created_at',
        sort_order: 'desc'
      }

      const response = await api.getPublicShopProducts(slug, searchOptions)
      
      if (response.data) {
        setAllProducts(response.data)  // ← PLUS DE CAST
        setTotalProducts(response.data.length)
      }
    } catch (err) {
      console.error('Erreur chargement produits:', err)
    } finally {
      setIsLoading(false)
    }
  }
 
  const applyFilters = () => {
    let filtered = [...allProducts]
    
    // Filtre par recherche
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }
    
    // Filtre par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }
    
    // Filtre par prix
    if (minPrice !== '') {
      const minPriceCents = Math.round(Number(minPrice) * 100)
      filtered = filtered.filter(product => product.price >= minPriceCents)
    }
    
    if (maxPrice !== '') {
      const maxPriceCents = Math.round(Number(maxPrice) * 100)
      filtered = filtered.filter(product => product.price <= maxPriceCents)
    }
    
    // Filtre par stock
    if (inStock !== '') {
      filtered = filtered.filter(product => 
        inStock ? isProductInStock(product) : !isProductInStock(product)
      )
    }
    
    // Filtre par vedette
    if (featured !== '') {
      filtered = filtered.filter(product => product.is_featured === featured)
    }
    
    // Filtre par tag
    if (selectedTag) {
      filtered = filtered.filter(product => 
        product.tags?.includes(selectedTag)
      )
    }
    
    // Tri
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'price':
          aValue = a.price
          bValue = b.price
          break
        case 'view_count':
          aValue = a.view_count || 0
          bValue = b.view_count || 0
          break
        case 'created_at':
        default:
          aValue = new Date(a.created_at || 0).getTime()
          bValue = new Date(b.created_at || 0).getTime()
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
    
    setFilteredProducts(filtered)
    setTotalProducts(filtered.length)
    setTotalPages(Math.ceil(filtered.length / perPage))
    setCurrentPage(1)
  }

  const updateDisplayedProducts = () => {
    const startIndex = (currentPage - 1) * perPage
    const endIndex = startIndex + perPage
    setDisplayedProducts(filteredProducts.slice(startIndex, endIndex))
  }

  // Gérer l'ajout au panier
  const handleAddToCart = async (productId: string) => {
    try {
      await addToCart(slug, productId, 1)
    } catch (err) {
      console.error('Erreur lors de l\'ajout au panier:', err)
    }
  }

  // Formater le prix
  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toFixed(2) + ' €'
  }

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSelectedCategory('all')
    setSearchQuery('')
    setMinPrice('')
    setMaxPrice('')
    setInStock('')
    setFeatured('')
    setSelectedTag('')
    setSortBy('created_at')
    setSortOrder('desc')
    setCurrentPage(1)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des produits...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête de la boutique */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {shop?.name || 'Boutique'}
              </h1>
              <p className="text-gray-600 mt-1">
                {shop?.description || 'Découvrez nos produits'}
              </p>
            </div>
            <Link
              href={`/shop/${slug}`}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar des filtres */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900">Filtres</h2>
                <button
                  onClick={resetFilters}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Réinitialiser
                </button>
              </div>

              {/* Barre de recherche */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rechercher
                </label>
                <input
                  type="text"
                  placeholder="Nom, description, tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Catégories */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégories
                </label>
                <div className="space-y-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => category && setSelectedCategory(category)}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
                        selectedCategory === category
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {category === 'all' ? 'Toutes les catégories' : category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {allTags.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allTags.slice(0, 10).map(tag => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          selectedTag === tag
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Prix */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix (€)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    step="0.01"
                    min="0"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              {/* Options de filtrage */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="inStock"
                    checked={inStock === true}
                    onChange={(e) => setInStock(e.target.checked ? true : '')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="inStock" className="ml-2 text-sm text-gray-700">
                    En stock seulement
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={featured === true}
                    onChange={(e) => setFeatured(e.target.checked ? true : '')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="featured" className="ml-2 text-sm text-gray-700">
                    Produits en vedette
                  </label>
                </div>
              </div>

              {/* Tri */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trier par
                </label>
                <div className="space-y-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="created_at">Date d'ajout</option>
                    <option value="name">Nom</option>
                    <option value="price">Prix</option>
                    <option value="view_count">Popularité</option>
                  </select>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="desc">Décroissant</option>
                    <option value="asc">Croissant</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="lg:w-3/4">
            {/* En-tête avec compteur */}
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Produits</h1>
                <p className="text-gray-600 mt-1">
                  {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} trouvé{filteredProducts.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              {/* Indicateurs de filtres actifs */}
              {(selectedCategory !== 'all' || searchQuery || minPrice !== '' || maxPrice !== '' || inStock !== '' || featured !== '' || selectedTag) && (
                <div className="text-sm text-blue-600">
                  Filtres actifs
                </div>
              )}
            </div>

            {/* Liste des produits */}
            {displayedProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h2 className="text-xl font-medium text-gray-900 mb-2">Aucun produit trouvé</h2>
                <p className="text-gray-600 mb-6">Aucun produit ne correspond à vos critères de recherche.</p>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      slug={slug}
                      addToCart={addToCart}
                      cartLoading={cartLoading}
                      cartHook={cartHook}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
                      >
                        Précédent
                      </button>
                      <span className="px-4 py-2">
                        Page {currentPage} sur {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Panier flottant */}
      <CartSidebar key={`cart-${slug}`} slug={slug} cart={cartHook} />
    </div>
  )
}