'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/app/lib/api'
import Link from 'next/link'
import { useCart } from '@/app/hooks/useCart'
import CartSidebar from '@/app/components/CartSidebar'

// Fonction utilitaire pour les images
const getImageUrl = (imageUrl: string | undefined): string => {
  if (!imageUrl) return '/placeholder.jpg';
  
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  return imageUrl;
};

export default function ProductDetailClient({ productId }: { productId: string }) {
  const router = useRouter()
  
  const [product, setProduct] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({})
  const [showShareMenu, setShowShareMenu] = useState(false)
  
  // Initialiser useCart avec le shop_slug une fois le produit chargé
  const cart = useCart(product?.shop_slug)

  useEffect(() => {
    if (productId) {
      loadProduct()
    }
  }, [productId])

  // Recharger le panier quand le produit est chargé
  useEffect(() => {
    if (product?.shop_slug) {
      cart.refreshCart()
    }
  }, [product?.shop_slug])

  const loadProduct = async () => {
    console.log('🔄 LOAD PRODUCT CALLED', new Date().toISOString())
    try {
      setIsLoading(true)
      setError('')
      
      const response = await api.getPublicProductById(productId)

      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        setProduct(response.data)
      } else {
        setError('Produit non trouvé')
      }
    } catch (err) {
      setError('Erreur de chargement du produit')
      console.error('Erreur:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!product || !product.shop_slug) return
    
    setIsAddingToCart(true)
    
    try {
      const options: any = {}
      
      // Si des variations sont sélectionnées, les ajouter
      if (Object.keys(selectedVariations).length > 0) {
        options.variations = selectedVariations
      }
      
      // Appeler la fonction addToCart du hook
      await cart.addToCart(product.shop_slug, product.id, quantity, options)
      
      // Afficher une notification
      console.log(`✅ ${quantity} x "${product.name}" ajouté au panier!`)
      
      // Optionnel : Ouvrir automatiquement le panier
      window.dispatchEvent(new CustomEvent('openCartSidebar'))
      
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout au panier:', err)
      
      // Gérer les erreurs de stock
      if (err.message?.includes('Stock') || err.message?.includes('stock') || err.message?.includes('insuffisant')) {
        alert(`Erreur : ${err.message}`)
      } else {
        alert('Erreur lors de l\'ajout au panier. Veuillez réessayer.')
      }
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    if (!product || !product.shop_slug) return
    
    try {
      // D'abord ajouter au panier
      const options: any = {}
      if (Object.keys(selectedVariations).length > 0) {
        options.variations = selectedVariations
      }
      
      await cart.addToCart(product.shop_slug, product.id, quantity, options)
      
      // Puis rediriger vers la page de checkout
      router.push(`/checkout?shop=${product.shop_slug}`)
      
    } catch (err: any) {
      console.error('Erreur lors de l\'achat:', err)
      alert(err.message || 'Erreur lors de la redirection vers le paiement')
    }
  }

  const handleVariationChange = (variationName: string, option: string) => {
    setSelectedVariations(prev => ({
      ...prev,
      [variationName]: option
    }))
  }

  const handleShare = () => {
    // Pour mobile : Web Share API
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Découvrez ${product.name} sur ShopTonik ! ${product.description ? product.description.substring(0, 100) + '...' : ''}`,
        url: window.location.href,
      }).catch(() => {
        // Si le partage échoue, ouvrir le menu de partage personnalisé
        setShowShareMenu(true)
      })
    } else {
      // Pour desktop : ouvrir le menu de partage personnalisé
      setShowShareMenu(true)
    }
  }

  // Trouver la quantité de ce produit dans le panier
  const quantityInCart = cart.cart?.items?.find((item: any) => item.product_id === product?.id)?.quantity || 0
  // Calculer le stock disponible réel (stock original - déjà dans le panier)
  const availableStock = product ? product.stock - quantityInCart : 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du produit...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">😞</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Produit non trouvé'}
          </h2>
          <p className="text-gray-600 mb-6">
            Le produit que vous cherchez n'existe pas ou n'est plus disponible.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-3">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-3">
                <li>
                  <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                    Accueil
                  </Link>
                </li>
                <li>
                  <span className="text-gray-400">/</span>
                </li>
                <li>
                  <Link 
                    href={`/shop/${product.shop_slug}`} 
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    {product.shop_name}
                  </Link>
                </li>
                <li>
                  <span className="text-gray-400">/</span>
                </li>
                <li className="text-sm font-medium text-gray-900 truncate">
                  {product.name}
                </li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
            {/* Galerie d'images */}
            <div>
              {/* Image principale avec bouton de partage */}
              <div className="mb-4 relative group">
                {product.images && product.images.length > 0 ? (
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                    <img
                      src={getImageUrl(product.images[selectedImageIndex])}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.jpg';
                      }}
                    />
                    
                    {/* Bouton de partage */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        onClick={handleShare}
                        className="bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full p-3 shadow-lg transition-colors"
                        aria-label="Partager ce produit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square w-full bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">Aucune image disponible</span>
                  </div>
                )}
              </div>

              {/* Miniatures */}
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.map((image: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative aspect-square overflow-hidden rounded-md border-2 ${
                        selectedImageIndex === index 
                          ? 'border-blue-500' 
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`${product.name} - vue ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Détails du produit */}
            <div>
              <div className="mb-6">
                {/* En-tête */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {product.name}
                    </h1>
                    <div className="flex items-center space-x-3">
                      <Link
                        href={`/shop/${product.shop_slug}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {product.shop_name}
                      </Link>
                      {product.category && (
                        <span className="text-sm text-gray-500">
                          {product.category}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Badges */}
                  <div className="flex flex-col items-end space-y-2">
                    {product.is_featured && (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Vedette
                      </span>
                    )}
                    {product.is_digital && (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        Produit numérique
                      </span>
                    )}
                  </div>
                </div>

                {/* Prix */}
                <div className="mb-6">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl font-bold text-gray-900">
                      {product.formatted_price}
                    </span>
                    
                    {product.has_discount && product.formatted_compare_price && (
                      <>
                        <span className="text-xl text-gray-500 line-through">
                          {product.formatted_compare_price}
                        </span>
                        <span className="px-2 py-1 text-sm font-bold text-white bg-red-500 rounded">
                          -{product.discount_percentage}%
                        </span>
                      </>
                    )}
                  </div>
                  
                  {product.sku && (
                    <p className="text-sm text-gray-500 mt-2">
                      Référence: <span className="font-mono">{product.sku}</span>
                    </p>
                  )}
                </div>

                {/* Disponibilité */}
                <div className="mb-4">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                    product.is_available
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      product.is_available ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    {product.is_available 
                      ? (product.is_digital ? 'Téléchargeable' : `${product.stock} en stock`) 
                      : 'Rupture de stock'
                    }
                  </div>
                </div>

                {/* Indicateur panier */}
                {quantityInCart > 0 && (
                  <div className="mb-4">
                    <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      <span className="mr-2">🛒</span>
                      Déjà {quantityInCart} dans le panier
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Description
                  </h3>
                  <div className="prose max-w-none text-gray-700">
                    {product.description ? (
                      <p className="whitespace-pre-line">{product.description}</p>
                    ) : (
                      <p className="text-gray-500 italic">
                        Aucune description fournie pour ce produit.
                      </p>
                    )}
                  </div>
                </div>

                {/* Variations */}
                {product.variations && product.variations.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Options disponibles
                    </h3>
                    <div className="space-y-4">
                      {product.variations.map((variation: any, index: number) => (
                        <div key={index}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {variation.name}
                            {selectedVariations[variation.name] && (
                              <span className="ml-2 text-sm text-green-600">
                                ✓ {selectedVariations[variation.name]}
                              </span>
                            )}
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {variation.options.map((option: string, optIndex: number) => (
                              <button
                                key={optIndex}
                                onClick={() => handleVariationChange(variation.name, option)}
                                className={`px-4 py-2 border rounded-md text-sm transition-all ${
                                  selectedVariations[variation.name] === option
                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag: string, index: number) => (
                        <span
                          key={index}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            // Normaliser le tag avant de l'envoyer dans l'URL
                            const normalizedTag = tag.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                            router.push(`/search/tag/${encodeURIComponent(normalizedTag)}`)
                          }}
                          className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm hover:bg-blue-100 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contrôle de quantité (seulement pour produits physiques) */}
                {product.is_available && !product.is_digital && (
                  <div className="mb-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center border border-gray-300 rounded-md">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                          className="px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          −
                        </button>
                        <span className="px-4 py-2 text-center min-w-[60px] font-medium">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                          disabled={quantity >= availableStock}
                          className="px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        {availableStock} unités disponibles
                        {quantityInCart > 0 && (
                          <span className="ml-2 text-blue-600">
                            ({product.stock} au total, déjà {quantityInCart} dans le panier)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Boutons d'action */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  {product.is_available ? (
                    <>
                      <button
                        onClick={handleAddToCart}
                        disabled={isAddingToCart || cart.isLoading || quantity > availableStock}
                        className={`flex-1 px-6 py-4 border font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
                          isAddingToCart || cart.isLoading
                            ? 'border-blue-400 bg-blue-100 text-blue-700 cursor-wait'
                            : 'border-blue-600 text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        {isAddingToCart ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            Ajout...
                          </>
                        ) : quantityInCart > 0 ? (
                          <>
                            <span>🛒</span>
                            Mettre à jour le panier
                          </>
                        ) : (
                          <>
                            <span>🛒</span>
                            Ajouter au panier
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={handleBuyNow}
                        disabled={isAddingToCart || cart.isLoading || quantity > availableStock}
                        className={`flex-1 px-6 py-4 font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
                          isAddingToCart || cart.isLoading
                            ? 'bg-blue-400 text-white cursor-wait'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <span>⚡</span>
                        Acheter maintenant
                      </button>
                    </>
                  ) : (
                    <div className="w-full text-center py-4 bg-red-50 text-red-700 rounded-md">
                      Ce produit n'est plus disponible
                    </div>
                  )}
                  
                  {product.is_digital && product.digital_url && (
                    <a
                      href={product.digital_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-6 py-4 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors text-center flex items-center justify-center"
                    >
                      <span className="mr-2">⬇️</span>
                      Télécharger
                    </a>
                  )}
                </div>

                {/* Produit numérique */}
                {product.is_digital && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-800">
                      ⚡ Ceci est un produit numérique. Aucune livraison physique nécessaire.
                      {product.digital_url && ' Le lien de téléchargement sera disponible après paiement.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Statistiques & Informations complémentaires */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Statistiques & Informations
                </h3>
                
                {/* Stats principales avec emojis */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">👁️</div>
                    <div className="text-sm font-medium text-gray-900">{product.view_count}</div>
                    <div className="text-xs text-gray-500">vues</div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">📅</div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(product.created_at).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="text-xs text-gray-500">ajouté le</div>
                  </div>
                  
                  {product.weight_grams > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-2xl mb-1">⚖️</div>
                      <div className="text-sm font-medium text-gray-900">{product.weight_grams} g</div>
                      <div className="text-xs text-gray-500">poids</div>
                    </div>
                  )}
                  
                  {product.dimensions && Object.keys(product.dimensions).length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-2xl mb-1">📏</div>
                      <div className="text-sm font-medium text-gray-900">
                        {product.dimensions.length}×{product.dimensions.width}×{product.dimensions.height}
                      </div>
                      <div className="text-xs text-gray-500">cm</div>
                    </div>
                  )}
                </div>
                
                {/* Détails supplémentaires */}
                <dl className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                  {product.sku && (
                    <>
                      <dt className="text-gray-500">Référence</dt>
                      <dd className="text-gray-900 font-mono">{product.sku}</dd>
                    </>
                  )}
                  
                  {product.category && (
                    <>
                      <dt className="text-gray-500">Catégorie</dt>
                      <dd className="text-gray-900">{product.category}</dd>
                    </>
                  )}
                </dl>
              </div>
            </div>
          </div>

          {/* Section SEO (optionnelle) */}
          {(product.meta_title || product.meta_description) && (
            <div className="border-t bg-gray-50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Informations SEO
              </h3>
              <div className="space-y-2">
                {product.meta_title && (
                  <div>
                    <span className="text-sm text-gray-500">Titre : </span>
                    <span className="text-sm text-gray-900">{product.meta_title}</span>
                  </div>
                )}
                {product.meta_description && (
                  <div>
                    <span className="text-sm text-gray-500">Description : </span>
                    <span className="text-sm text-gray-900">{product.meta_description}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panier flottant */}
      {product?.shop_slug && (
        <CartSidebar slug={product.shop_slug} cart={cart} />
      )}

      {/* Menu de partage personnalisé */}
      {showShareMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowShareMenu(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Partager ce produit</h3>
            
            {/* Image miniature optimisée */}
            <div className="mb-4">
              <img
                src={getImageUrl(product.images[selectedImageIndex])}
                alt={product.name}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
            
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {product.description || product.name}
            </p>
            
            {/* URL de partage */}
            <div className="mb-4 p-2 bg-gray-50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-gray-500 truncate flex-1">
                {typeof window !== 'undefined' ? window.location.href : ''}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  alert('Lien copié dans le presse-papiers !')
                }}
                className="ml-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Copier
              </button>
            </div>
            
            {/* Boutons de partage par réseau social */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {/* Facebook */}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white mb-1 hover:bg-blue-700 transition-colors">
                  <span className="text-xl">f</span>
                </div>
                <span className="text-xs">Facebook</span>
              </a>
              
              {/* Twitter/X */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Découvrez ${product.name} sur ShopTonik !`)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center"
              >
                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white mb-1 hover:bg-gray-800 transition-colors">
                  <span className="text-xl">𝕏</span>
                </div>
                <span className="text-xs">Twitter</span>
              </a>
              
              {/* WhatsApp */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${product.name} - ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center"
              >
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white mb-1 hover:bg-green-600 transition-colors">
                  <span className="text-xl">📱</span>
                </div>
                <span className="text-xs">WhatsApp</span>
              </a>
              
              {/* Telegram */}
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent(`Découvrez ${product.name} sur ShopTonik !`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white mb-1 hover:bg-blue-600 transition-colors">
                  <span className="text-xl">✈️</span>
                </div>
                <span className="text-xs">Telegram</span>
              </a>
            </div>
            
            <button
              onClick={() => setShowShareMenu(false)}
              className="w-full py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
