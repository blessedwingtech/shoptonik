'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'
import { api, type Product, type ProductUpdateData } from '@/app/lib/api'
import Link from 'next/link'
import ImageUploader from '@/app/components/ImageUploader'
import { useProductCategories } from '@/app/hooks/useProductCategories'
import { toast } from 'react-hot-toast'  // ← AJOUTER CET IMPORT

const getImageUrl = (imageUrl: string | undefined): string => {
  if (!imageUrl) return '/placeholder.jpg'
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl
  return imageUrl
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

export default function EditProductPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  const shopSlug = searchParams.get('shop')
  const productId = searchParams.get('product')
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [product, setProduct] = useState<Product | null>(null)
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([])
  const { categories } = useProductCategories()
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState<ProductUpdateData>({
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

  const [variations, setVariations] = useState<Array<{name: string, options: string}>>([])
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    if (!shopSlug || !productId) {
      toast.error('Paramètres manquants')
      router.push('/seller/products')
      return
    }
    loadProduct()
  }, [shopSlug, productId])

  const loadProduct = async () => {
    if (!shopSlug || !productId) return
    
    setIsLoading(true)
    const loadingToast = toast.loading('Chargement du produit...')
    
    try {
      console.log(`Chargement du produit: ${shopSlug}/${productId}`)
      const response = await api.getProductById(shopSlug, productId)
      toast.dismiss(loadingToast)
      
      if (response.data) {
        const productData = response.data
        setProduct(productData)
        console.log('🔍 DEBUG - Produit reçu:', {
  id: productData.id,
  name: productData.name,
  price_brut: productData.price,
  price_type: typeof productData.price,
  price_divise: productData.price / 100,
  compare_price_brut: productData.compare_price,
  compare_price_type: typeof productData.compare_price,
})
        setFormData({
          name: productData.name,
          description: productData.description || '',
          price: productData.price / 100,
          compare_price: productData.compare_price ? productData.compare_price / 100 : undefined,
          stock: productData.stock,
          images: productData.images || [],
          category: productData.category || '',
          sku: productData.sku || '',
          is_active: productData.is_active,
          is_featured: productData.is_featured,
          is_digital: productData.is_digital,
          digital_url: productData.digital_url || '',
          weight_grams: productData.weight_grams || undefined,
          dimensions: productData.dimensions || undefined,
          tags: productData.tags || [],
          variations: productData.variations || [],
          meta_title: productData.meta_title || '',
          meta_description: productData.meta_description || ''
        })
        
        setUploadedImageUrls(productData.images || [])
        setTags(productData.tags || [])
        
        const formattedVariations = (productData.variations || []).map((v: any) => ({
          name: v.name || '',
          options: Array.isArray(v.options) ? v.options.join(', ') : v.options || ''
        }))
        setVariations(formattedVariations.length > 0 ? formattedVariations : [{name: '', options: ''}])
      } else {
        toast.error('Produit non trouvé')
        setError('Produit non trouvé')
        setTimeout(() => router.push('/seller/products'), 2000)
      }
    } catch (err) {
      toast.dismiss(loadingToast)
      toast.error('Erreur chargement produit')
      console.error(err)
      setError('Erreur chargement produit')
    } finally {
      setIsLoading(false)
    }
  }

  const confirmUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name?.trim()) {
      toast.error('Le nom du produit est requis')
      return
    }
    if (!formData.price || formData.price <= 0) {
      toast.error('Le prix doit être supérieur à 0')
      return
    }
    
    setShowConfirmModal(true)
  }

  const handleUpdate = async () => {
    if (!shopSlug || !productId) return

    setIsSaving(true)
    setError('')
    setSuccess('')
    
    const savingToast = toast.loading('Mise à jour du produit...')

    try {
      const formattedVariations = variations
        .filter(v => v.name.trim() && v.options.trim())
        .map(v => ({
          name: v.name.trim(),
          options: v.options.split(',').map(opt => opt.trim()).filter(opt => opt)
        }))

      const updateData: ProductUpdateData = {
        name: formData.name?.trim(),
        description: formData.description?.trim() || undefined,
        //price: Math.round(formData.price * 100),
        price: Math.round((formData.price ?? 0) * 100),
        compare_price: formData.compare_price ? Math.round(formData.compare_price * 100) : undefined,
        stock: formData.stock || 0,
        images: uploadedImageUrls,
        category: formData.category || undefined,
        sku: formData.sku?.trim().toUpperCase() || undefined,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        is_digital: formData.is_digital,
        digital_url: formData.digital_url || undefined,
        weight_grams: formData.weight_grams || undefined,
        dimensions: formData.dimensions || undefined,
        tags: tags,
        variations: formattedVariations.length > 0 ? formattedVariations : undefined,
        meta_title: formData.meta_title?.trim() || undefined,
        meta_description: formData.meta_description?.trim() || undefined
      }

      console.log('📤 Données envoyées à l\'API (en centimes):', {
        price: updateData.price,
        compare_price: updateData.compare_price
      })

      const response = await api.updateProduct(shopSlug, productId, updateData)
      
      toast.dismiss(savingToast)

      if (response.error) {
        toast.error(formatError(response.error))
        setError(formatError(response.error))
      } else {
        toast.success('✅ Produit mis à jour avec succès!')
        setSuccess('✅ Produit mis à jour avec succès!')
        setTimeout(() => {
          router.push('/seller/products')
        }, 1500)
      }
    } catch (err: any) {
      toast.dismiss(savingToast)
      toast.error(err.message || 'Erreur lors de la mise à jour')
      setError(err.message || 'Erreur lors de la mise à jour')
    } finally {
      setIsSaving(false)
      setShowConfirmModal(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : parseFloat(value) }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
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

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Produit non trouvé</h1>
          <p className="text-gray-600 mb-8">Le produit que vous cherchez n'existe pas.</p>
          <Link
            href="/seller/products"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retour aux produits
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Modifier le produit
              </h1>
              <p className="mt-2 text-gray-600">
                {product.name}
              </p>
            </div>
            <Link
              href="/seller/products"
              className="text-gray-600 hover:text-gray-900"
            >
              ← Retour
            </Link>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 whitespace-pre-line">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={confirmUpdate} className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          {/* Nom et catégorie */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nom du produit *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie
              </label>
              <select
                id="category"
                name="category"
                value={formData.category || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Prix et stock */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Prix (€) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                step="0.01"
                min="0"
                value={formData.price || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="compare_price" className="block text-sm font-medium text-gray-700 mb-1">
                Prix barré (€)
              </label>
              <input
                type="number"
                id="compare_price"
                name="compare_price"
                step="0.01"
                min="0"
                value={formData.compare_price || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                Stock
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                min="0"
                value={formData.stock || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Images du produit
            </label>
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 text-sm">
                {uploadedImageUrls.length === 0 
                  ? "Ajoutez des images pour votre produit" 
                  : `${uploadedImageUrls.length} image(s) actuelle(s)`}
              </p>
            </div>
            <ImageUploader
              onImagesChange={setUploadedImageUrls}
              maxImages={10}
              maxSizeMB={5}
              shopId={product.shop_id}
              autoUpload={true}
              existingImages={product.images || []}
            />
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ajouter
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
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
                Variations
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Options (ex: S,M,L)"
                  value={variation.options}
                  onChange={(e) => updateVariation(index, 'options', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                Référence (SKU)
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="weight_grams" className="block text-sm font-medium text-gray-700 mb-1">
                Poids (grammes)
              </label>
              <input
                type="number"
                id="weight_grams"
                name="weight_grams"
                min="0"
                value={formData.weight_grams || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Produit numérique */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_digital"
              name="is_digital"
              checked={formData.is_digital}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_digital" className="ml-2 block text-sm text-gray-900">
              Produit numérique (pas de livraison physique)
            </label>
          </div>

          {formData.is_digital && (
            <div>
              <label htmlFor="digital_url" className="block text-sm font-medium text-gray-700 mb-1">
                URL de téléchargement
              </label>
              <input
                type="url"
                id="digital_url"
                name="digital_url"
                value={formData.digital_url || ''}
                onChange={handleInputChange}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                checked={formData.is_active}
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
                checked={formData.is_featured}
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
            <h4 className="text-sm font-medium text-gray-700 mb-3">Optimisation SEO</h4>
            <div className="space-y-3">
              <div>
                <label htmlFor="meta_title" className="block text-sm font-medium text-gray-700 mb-1">
                  Titre SEO
                </label>
                <input
                  type="text"
                  id="meta_title"
                  name="meta_title"
                  value={formData.meta_title || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="meta_description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description SEO
                </label>
                <textarea
                  id="meta_description"
                  name="meta_description"
                  rows={2}
                  value={formData.meta_description || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Actions */} 
            <div className="flex justify-end space-x-3 pt-4 border-t">
                <Link
                href="/seller/products"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                Annuler
                </Link>
                <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                {isSaving ? (
                    <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enregistrement...
                    </>
                ) : (
                    'Enregistrer les modifications'
                )}
                </button>
            </div>
        </form>
      </div>

      {/* Modal de confirmation */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-200">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-blue-700">
                <span>💾</span>
                Confirmer les modifications
              </h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-700 mb-4">
                Êtes-vous sûr de vouloir enregistrer les modifications pour <strong>"{product?.name}"</strong> ?
              </p>
              
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-2">
                <p className="font-medium text-gray-700">Récapitulatif :</p>
                <div className="grid grid-cols-2 gap-2 text-gray-600">
                  <span>Nouveau prix :</span>
                  <span className="font-semibold text-blue-600">{formData.price?.toFixed(2)} €</span>
                  
                  {formData.compare_price && (
                    <>
                      <span>Prix barré :</span>
                      <span className="font-semibold text-gray-500 line-through">
                        {formData.compare_price.toFixed(2)} €
                      </span>
                    </>
                  )}
                  
                  <span>Stock :</span>
                  <span className="font-semibold">{formData.stock}</span>
                  
                  <span>Statut :</span>
                  <span className="font-semibold">{formData.is_active ? 'Actif' : 'Inactif'}</span>
                </div>
                {(product?.price !== Math.round((formData.price ?? 0) * 100) || 
                  product?.stock !== formData.stock ||
                  product?.is_active !== formData.is_active ||
                  (product?.compare_price || 0) !== (formData.compare_price ? Math.round(formData.compare_price * 100) : 0)) && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-700 flex items-center gap-1">
                      <span>⚠️</span>
                      Des modifications ont été détectées
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdate}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enregistrement...
                  </>
                ) : (
                  'Confirmer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}      
    </div>
  )
}