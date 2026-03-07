'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { api, type Product, type Shop, type ProductCreateData } from '@/app/lib/api'
import Link from 'next/link'
import ImageUploader from '@/app/components/ImageUploader'
import { useProductCategories } from '@/app/hooks/useProductCategories'
import ConfirmationModal from '@/app/components/ConfirmationModal'
import { toast } from 'react-hot-toast'

// ... (gardez toutes les fonctions utilitaires inchangées)

const getImageUrl = (imageUrl: string | undefined): string => {
  if (!imageUrl) return '/placeholder.jpg';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  return imageUrl;
};

interface ExtendedProduct extends Product {
  is_available: boolean
  has_discount: boolean
  discount_percentage: number
  formatted_price: string
  formatted_compare_price: string | null
}

const formatError = (error: any): string => {
  if (typeof error === 'string') return error
  if (error && typeof error === 'object') {
    if (Array.isArray(error.detail)) {
      return error.detail.map((err: any) => {
        const field = err.loc?.join('.') || 'champ'
        return `${field}: ${err.msg}`
      }).join('\n')
    }
    if (error.message) return error.message
    try {
      return JSON.stringify(error, null, 2)
    } catch {
      return 'Erreur inconnue'
    }
  }
  return String(error)
}

export default function SellerProductsPage() {
  const { user } = useAuth()
  const [shops, setShops] = useState<Shop[]>([])
  const [selectedShop, setSelectedShop] = useState<string>('')
  const [products, setProducts] = useState<ExtendedProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([])
  const { categories, loading: loadingCategories, error: categoriesError } = useProductCategories() 
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [productToDelete, setProductToDelete] = useState<{id: string, name: string} | null>(null)

  // Form state
  const [productData, setProductData] = useState<ProductCreateData>({
    name: '',
    description: '',
    price: 0,
    compare_price: undefined,
    stock: 0,
    images: [],
    category: '',
    sku: '',
    is_active: true,
    is_featured: false,
    is_digital: false,
    digital_url: '',
    weight_grams: undefined,
    dimensions: undefined,
    tags: [],
    variations: [],
    meta_title: '',
    meta_description: ''
  })

  const [variations, setVariations] = useState<Array<{name: string, options: string}>>([{name: '', options: ''}])
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    if (categoriesError) {
      console.error('❌ Erreur catégories:', categoriesError)
    }
  }, [categoriesError])

  useEffect(() => {
    loadShops()
  }, [])

  useEffect(() => {
    if (selectedShop) {
      loadProducts(selectedShop)
    }
  }, [selectedShop])

  const loadShops = async () => {
    try {
      const response = await api.getMyShops()
      if (response.data && response.data.length > 0) {
        const shopsData = response.data as Shop[]
        setShops(shopsData)
        setSelectedShop(shopsData[0].slug)
      }
    } catch (err) {
      console.error('Erreur chargement boutiques:', err)
      setError('Impossible de charger vos boutiques')
    }
  }

  const loadProducts = async (shopSlug: string) => {
    setIsLoading(true)
    try {
      const response = await api.getShopProducts(shopSlug)
      if (response.data) {
        console.log('📦 Données produits reçues:', response.data);
        if (response.data.length > 0) {
          const firstProduct = response.data[0];
          console.log('🔍 Premier produit:', {
            name: firstProduct.name,
            stock: firstProduct.stock,
            is_available: firstProduct.is_available,
            price: firstProduct.price,
            compare_price: firstProduct.compare_price,
            has_discount: firstProduct.has_discount,
            formatted_price: firstProduct.formatted_price,
            formatted_compare_price: firstProduct.formatted_compare_price,
          });
        }
        setProducts(response.data as ExtendedProduct[])
      }
    } catch (err) {
      console.error('Erreur chargement produits:', err)
      setError('Impossible de charger les produits')
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ UNE SEULE VERSION de handleCreateProduct (avec toast)
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedShop) {
      toast.error('Veuillez sélectionner une boutique')
      return
    }

    if (uploadedImageUrls.length === 0) {
      toast.error('Veuillez ajouter au moins une image pour votre produit')
      document.getElementById('images-section')?.scrollIntoView({ behavior: 'smooth' })
      return
    }

    if (!productData.name.trim()) {
      toast.error('Le nom du produit est requis')
      return
    }

    if (!productData.price || productData.price <= 0) {
      toast.error('Le prix doit être supérieur à 0')
      return
    }

    // Toast interactif pour la catégorie
    if (!productData.category) {
      toast((t) => (
        <div className="flex flex-col gap-3">
          <p className="font-medium">⚠️ Aucune catégorie sélectionnée</p>
          <p className="text-sm text-gray-600">Voulez-vous continuer sans catégorie ?</p>
          <div className="flex gap-2 justify-end mt-2">
            <button
              onClick={() => {
                toast.dismiss(t.id)
                submitProduct()
              }}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Continuer
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
            >
              Annuler
            </button>
          </div>
        </div>
      ), {
        duration: 8000,
        position: 'top-center',
      })
      return
    }

    await submitProduct()
  }

  // ✅ Logique de soumission extraite
  const submitProduct = async () => {
    setIsCreating(true)
    setError('')
    setSuccess('')
    
    const loadingToast = toast.loading('Création du produit en cours...')

    try {
      const formattedVariations = variations
        .filter(v => v.name.trim() && v.options.trim())
        .map(v => ({
          name: v.name.trim(),
          options: v.options.split(',').map(opt => opt.trim()).filter(opt => opt)
        }))

      const productPayload: ProductCreateData = {
        name: productData.name.trim(),
        description: productData.description?.trim() || undefined,
        price: productData.price,
        compare_price: productData.compare_price ?? undefined,
        stock: productData.stock || 0,
        images: uploadedImageUrls,
        category: productData.category || undefined,
        sku: productData.sku?.trim().toUpperCase() || undefined,
        is_active: productData.is_active,
        is_featured: productData.is_featured,
        is_digital: productData.is_digital,
        digital_url: productData.digital_url || undefined,
        weight_grams: productData.weight_grams || undefined,
        dimensions: productData.dimensions || undefined,
        tags: tags,
        variations: formattedVariations.length > 0 ? formattedVariations : undefined,
        meta_title: productData.meta_title?.trim() || undefined,
        meta_description: productData.meta_description?.trim() || undefined
      }

      const response = await api.createProduct(selectedShop, productPayload)
      
      toast.dismiss(loadingToast)

      if (response.error) {
        toast.error(formatError(response.error), { duration: 5000 })
        setError(formatError(response.error))
      } else {
        toast.success('✅ Produit créé avec succès!', { 
          duration: 3000,
          icon: '📦' 
        })
        setSuccess('✅ Produit créé avec succès!')
        resetForm()
        setShowCreateModal(false)
        loadProducts(selectedShop)
      }
    } catch (err: any) {
      toast.dismiss(loadingToast)
      toast.error(err.message || 'Erreur création produit', { duration: 5000 })
      setError(err.message || 'Erreur création produit')
    } finally {
      setIsCreating(false)
    }
  }

  const resetForm = () => {
    setProductData({
      name: '',
      description: '',
      price: 0,
      compare_price: undefined,
      stock: 0,
      images: [],
      category: '',
      sku: '',
      is_active: true,
      is_featured: false,
      is_digital: false,
      digital_url: '',
      weight_grams: undefined,
      dimensions: undefined,
      tags: [],
      variations: [],
      meta_title: '',
      meta_description: ''
    })
    setUploadedImageUrls([])
    setVariations([{name: '', options: ''}])
    setTags([])
    setNewTag('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setProductData(prev => ({ ...prev, [name]: checked }))
    } else if (type === 'number') {
      setProductData(prev => ({ ...prev, [name]: value === '' ? undefined : parseFloat(value) }))
    } else {
      setProductData(prev => ({ ...prev, [name]: value }))
    }
  }

  const addVariation = () => {
    setVariations(prev => [...prev, {name: '', options: ''}])
  }

  const updateVariation = (index: number, field: 'name' | 'options', value: string) => {
    setVariations(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v))
  }

  const removeVariation = (index: number) => {
    setVariations(prev => prev.filter((_, i) => i !== index))
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    if (!selectedShop) return
    try {
      const response = await api.toggleProductActive(selectedShop, productId)
      if (response.data) {
        loadProducts(selectedShop)
        setSuccess(`Produit ${currentStatus ? 'désactivé' : 'activé'} avec succès`)
      }
    } catch (err) {
      setError('Erreur lors de la modification du statut')
    }
  }

  const confirmDelete = (productId: string, productName: string) => {
    setProductToDelete({ id: productId, name: productName })
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!productToDelete || !selectedShop) return
    
    setIsDeleting(true)
    setError('')
    setSuccess('')
    
    const loadingToast = toast.loading(`Suppression de "${productToDelete.name}"...`)
    
    try {
      const response = await api.deleteProduct(selectedShop, productToDelete.id)
      toast.dismiss(loadingToast)
      
      if (!response.error) {
        setProducts(prev => prev.filter(p => p.id !== productToDelete.id))
        toast.success(`✅ "${productToDelete.name}" a été supprimé avec succès`, {
          duration: 3000
        })
      } else {
        toast.error(response.error || 'Erreur lors de la suppression', {
          duration: 4000
        })
        setError(formatError(response.error))
      }
    } catch (err: any) {
      toast.dismiss(loadingToast)
      toast.error(err.message || 'Erreur lors de la suppression', {
        duration: 4000
      })
      setError(err.message || 'Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
      setProductToDelete(null)
      setShowDeleteModal(false)
    }
  }

  const currentShop = shops.find(shop => shop.slug === selectedShop)

  if (shops.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Gestion des produits
            </h1>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas encore de boutique pour gérer des produits.        
            </p>
            <Link
              href="/seller/dashboard/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Créer une boutique
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestion des produits
            </h1>
            <p className="mt-2 text-gray-600">
              Gérez les produits de vos boutiques
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau produit
          </button>
        </div>

        {/* Boutique sélection */}
        <div className="mb-6">
          <label htmlFor="shop-select" className="block text-sm font-medium text-gray-700 mb-2">
            Sélectionner une boutique
          </label>
          <select
            id="shop-select"
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {shops.map(shop => (
              <option key={shop.id} value={shop.slug}>
                {shop.name}
              </option>
            ))}
          </select>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {formatError(error)}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            {String(success)}
          </div>
        )}

        {/* Liste des produits */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des produits...</p>     
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun produit trouvé
            </h3>
            <p className="text-gray-500 mb-4">
              {currentShop?.name} ne contient pas encore de produits.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"    
            >
              Créer votre premier produit
            </button>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {product.images && product.images.length > 0 ? (
                            <div className="h-10 w-10 flex-shrink-0">
                              <img
                                src={getImageUrl(product.images[0])}
                                alt={product.name}
                                className="h-10 w-10 rounded object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.jpg';
                                  e.currentTarget.onerror = null;
                                }}
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                              {product.is_featured && (
                                <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  Vedette
                                </span>
                              )}
                              {product.is_digital && (
                                <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                  Numérique
                                </span>
                              )}
                            </div> 
                            <div className="text-sm text-gray-500">
                              {product.category || 'Non catégorisé'}
                              {product.category && (
                                <span className="ml-1 text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                  {categories.find(c => c.value === product.category)?.label || product.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.formatted_price}
                          {product.has_discount && (
                            <div className="text-xs text-gray-500 line-through">
                              {product.formatted_compare_price}
                              <span className="ml-1 text-red-600">
                                -{product.discount_percentage}%
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.is_available ? `${product.stock} en stock` : 'Rupture'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            href={`/product/${product.id}`}
                            target="_blank"
                            className="text-blue-600 hover:text-blue-900"
                            title="Voir en boutique"
                          >
                            👁️
                          </Link>
                          <button
                            onClick={() => toggleProductStatus(product.id, product.is_active)}
                            className={`${product.is_active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                            title={product.is_active ? 'Désactiver' : 'Activer'}
                          >
                            {product.is_active ? '⏸️' : '▶️'}
                          </button>
                          <Link
                            href={`/seller/products/edit?shop=${selectedShop}&product=${product.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Éditer"
                            onClick={() => console.log('🔍 Édition produit:', { shop: selectedShop, productId: product.id })}
                          >
                            ✏️
                          </Link>
                          <button
                            onClick={() => confirmDelete(product.id, product.name)}
                            disabled={isDeleting}
                            className={`${isDeleting ? 'opacity-50 cursor-not-allowed' : ''} text-red-600 hover:text-red-900`}
                            title="Supprimer"
                          >
                            {isDeleting ? '⏳' : '🗑️'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal création produit */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Nouveau produit
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Créez un nouveau produit pour {currentShop?.name}
                </p>
              </div>
              <form onSubmit={handleCreateProduct}>
                  <div className="px-6 py-4 space-y-4"> 
                    {/* NOUVEAU - Avec menu déroulant */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Nom du produit *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={productData.name}
                          onChange={handleInputChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                          Catégorie
                          <span className="text-gray-500 text-xs font-normal ml-1">(recommandé)</span>
                        </label>
                        
                        {loadingCategories ? (
                          <div className="mt-1">
                            <div className="h-10 bg-gray-200 animate-pulse rounded-md flex items-center justify-center">
                              <span className="text-gray-500 text-sm">Chargement des catégories...</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <select
                              id="category"
                              name="category"
                              value={productData.category || ''}
                              onChange={handleInputChange}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                              {categories.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                  {cat.label}
                                </option>
                              ))}
                            </select>
                            
                            <div className="mt-1 flex items-center justify-between text-xs">
                              <p className="text-gray-500">
                                Les catégories standardisées améliorent la découverte
                              </p>
                              {productData.category && (
                                <span className="text-green-600 font-medium">
                                  ✓ Sélectionné
                                </span>
                              )}
                            </div>
                            
                            {/* Bouton de rechargement si erreur */}
                            {categoriesError && (
                              <div className="mt-2">
                                <p className="text-red-500 text-xs mb-1">{categoriesError}</p>
                                <button
                                  type="button"
                                  onClick={() => window.location.reload()}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  ⟳ Recharger les catégories
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows={3}
                        value={productData.description || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    {/* Prix et stock */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                          Prix (€) *
                        </label>
                        <input
                          type="number"
                          id="price"
                          name="price"
                          required
                          step="0.01"
                          min="0"
                          value={productData.price || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="compare_price" className="block text-sm font-medium text-gray-700">
                          Prix barré (€)
                        </label>
                        <input
                          type="number"
                          id="compare_price"
                          name="compare_price"
                          step="0.01"
                          min="0"
                          value={productData.compare_price || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                          Stock
                        </label>
                        <input
                          type="number"
                          id="stock"
                          name="stock"
                          min="0"
                          value={productData.stock || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    {/* Images - NOUVELLE VERSION */}
    
  {/* Images - VERSION CORRIGÉE */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Images du produit *
    </label>
    
    {/* AJOUTEZ un indicateur visuel */}
    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
      <div className="flex items-center text-blue-700 text-sm">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          {uploadedImageUrls.length === 0 
            ? "Ajoutez au moins une image (l'upload est automatique)" 
            : `${uploadedImageUrls.length} image(s) sélectionnée(s)`}
        </span>
      </div>
    </div>
    
    <ImageUploader
      onImagesChange={setUploadedImageUrls}
      maxImages={10}
      maxSizeMB={5}
      shopId={currentShop?.id}
      autoUpload={true} // IMPORTANT: Upload automatique
    />
    
    {/* AJOUTEZ un feedback d'erreur spécifique */}
    {error && error.includes('image') && (
      <p className="mt-2 text-sm text-red-600">
        ❌ {error}
      </p>
    )}
    
    {uploadedImageUrls.length > 0 && (
      <p className="mt-2 text-sm text-green-600">
        ✅ {uploadedImageUrls.length} image(s) prête(s) pour le produit
      </p>
    )}
  </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Ajouter un tag"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        />
                        <button
                          type="button"
                          onClick={addTag}
                          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Ajouter
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Variations */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Variations (tailles, couleurs, etc.)
                        </label>
                        <button
                          type="button"
                          onClick={addVariation}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          + Ajouter une variation
                        </button>
                      </div>
                      {variations.map((variation, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            placeholder="Nom (ex: Taille)"
                            value={variation.name}
                            onChange={(e) => updateVariation(index, 'name', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Options séparées par des virgules (ex: S,M,L)"
                            value={variation.options}
                            onChange={(e) => updateVariation(index, 'options', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeVariation(index)}
                            className="px-3 py-2 text-red-600 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Options supplémentaires */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                          Référence (SKU)
                        </label>
                        <input
                          type="text"
                          id="sku"
                          name="sku"
                          value={productData.sku || ''}
                          onChange={handleInputChange}
                          placeholder="Laisser vide pour auto-générer"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="weight_grams" className="block text-sm font-medium text-gray-700">
                          Poids (grammes)
                        </label>
                        <input
                          type="number"
                          id="weight_grams"
                          name="weight_grams"
                          min="0"
                          value={productData.weight_grams || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    {/* Produit numérique */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_digital"
                        name="is_digital"
                        checked={productData.is_digital}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_digital" className="ml-2 block text-sm text-gray-900">
                        Produit numérique (pas de livraison physique)
                      </label>
                    </div>

                    {productData.is_digital && (
                      <div>
                        <label htmlFor="digital_url" className="block text-sm font-medium text-gray-700">
                          URL de téléchargement
                        </label>
                        <input
                          type="url"
                          id="digital_url"
                          name="digital_url"
                          value={productData.digital_url || ''}
                          onChange={handleInputChange}
                          placeholder="https://..."
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    )}

                    {/* Options de statut */}
                    <div className="flex space-x-6">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_active"
                          name="is_active"
                          checked={productData.is_active}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                          Produit actif
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_featured"
                          name="is_featured"
                          checked={productData.is_featured}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-900">
                          Mettre en vedette
                        </label>
                      </div>
                    </div>

                    {/* SEO */}
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Optimisation SEO</h4>
                      <div className="space-y-3">
                        <div>
                          <label htmlFor="meta_title" className="block text-sm font-medium text-gray-700">
                            Titre SEO
                          </label>
                          <input
                            type="text"
                            id="meta_title"
                            name="meta_title"
                            value={productData.meta_title || ''}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="meta_description" className="block text-sm font-medium text-gray-700">
                            Description SEO
                          </label>
                          <textarea
                            id="modal_description"
                            name="meta_description"
                            rows={2}
                            value={productData.meta_description || ''}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      resetForm()
                    }}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || uploadedImageUrls.length === 0}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"   
                  >
                    {isCreating ? 'Création...' : 'Créer le produit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmation - PLACÉ À L'EXTÉRIEUR du div principal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setProductToDelete(null)
        }}
        onConfirm={handleDelete}
        title="Supprimer le produit"
        message={`Êtes-vous sûr de vouloir supprimer "${productToDelete?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />      
    </div>
  )
}