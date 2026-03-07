// apps/web/app/components/ImageUploader.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { api } from '@/app/lib/api'

interface ImageUploaderProps {
  onImagesChange: (urls: string[]) => void
  maxImages?: number
  maxSizeMB?: number
  accept?: string
  shopId?: string
  autoUpload?: boolean
  existingImages?: string[]
}

export default function ImageUploader({
  onImagesChange,
  maxImages = 10,
  maxSizeMB = 5,
  accept = 'image/*',
  shopId,
  autoUpload = true,
  existingImages = []
}: ImageUploaderProps) {
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(existingImages)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mettre à jour le parent quand les URLs changent
  useEffect(() => {
    console.log('📤 [ImageUploader] URLs envoyées au parent:', uploadedUrls)
    onImagesChange([...uploadedUrls])
  }, [uploadedUrls, onImagesChange])

  // FONCTIONS EXISTANTES À AJOUTER :
  const validateFile = (file: File): boolean => {
    // Vérifier la taille
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`L'image ${file.name} dépasse ${maxSizeMB}MB`)
      return false
    }

    // Vérifier le type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      setError(`Type non supporté: ${file.name}. Utilisez JPG, PNG, WebP ou GIF`)
      return false
    }

    return true
  }

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            reject(new Error('Canvas non supporté'))
            return
          }

          // Calculer les nouvelles dimensions (max 2000px)
          let width = img.width
          let height = img.height
          const MAX_DIMENSION = 2000
          
          if (width > height && width > MAX_DIMENSION) {
            height = Math.round((height * MAX_DIMENSION) / width)
            width = MAX_DIMENSION
          } else if (height > MAX_DIMENSION) {
            width = Math.round((width * MAX_DIMENSION) / height)
            height = MAX_DIMENSION
          }
          
          canvas.width = width
          canvas.height = height
          
          // Dessiner l'image avec qualité réduite
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convertir en blob avec compression
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Échec de compression'))
                return
              }
              
              const compressedFile = new File(
                [blob], 
                file.name, 
                { 
                  type: 'image/webp',
                  lastModified: Date.now()
                }
              )
              
              resolve(compressedFile)
            },
            'image/webp',
            0.85
          )
        }
        
        img.onerror = () => reject(new Error('Erreur chargement image'))
      }
      
      reader.onerror = () => reject(new Error('Erreur lecture fichier'))
    })
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return
    
    console.log('📁 Fichiers sélectionnés:', files.length)
    setError('')
    
    // Vérifier le nombre total d'images
    const totalImages = uploadedUrls.length + images.length + files.length
    if (totalImages > maxImages) {
      setError(`Maximum ${maxImages} images autorisées`)
      return
    }
    
    const newImages: File[] = []
    const newPreviews: string[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      if (!validateFile(file)) continue
      
      try {
        // Compresser l'image avant de l'ajouter
        const compressedFile = await compressImage(file)
        newImages.push(compressedFile)
        
        // Créer un aperçu
        const previewUrl = URL.createObjectURL(compressedFile)
        newPreviews.push(previewUrl)
        console.log('🖼️ Preview créé pour:', file.name)
      } catch (err) {
        console.error('Erreur compression:', err)
        // Si la compression échoue, utiliser l'image originale
        newImages.push(file)
        const previewUrl = URL.createObjectURL(file)
        newPreviews.push(previewUrl)
      }
    }
    
    setImages(prev => [...prev, ...newImages])
    setPreviews(prev => [...prev, ...newPreviews])
    
    console.log('📊 État après sélection:', {
      images: images.length + newImages.length,
      previews: previews.length + newPreviews.length,
      uploadedUrls: uploadedUrls.length
    })
    
    // AUTO-UPLOAD si activé
    if (autoUpload && newImages.length > 0) {
      console.log('🚀 Auto-upload déclenché pour', newImages.length, 'images')
      await handleUploadNewImages(newImages, newPreviews)
    } else if (!autoUpload) {
      console.log('⏸️ Auto-upload désactivé, bouton manuel requis')
    }
    
    // Réinitialiser l'input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUploadNewImages = async (newImages: File[], newPreviews: string[]) => {
    console.log('📤 Début upload de', newImages.length, 'images')
    setIsUploading(true)
    setError('')
    
    try {
      let newUrls: string[] = []
      
      if (shopId) {
        console.log('🏬 Upload avec shopId:', shopId)
        const response = await api.uploadProductImages(shopId, newImages)
        console.log('📥 Réponse API (shop):', response)
        
        if (response.status === 'success' && response.data) {
          newUrls = response.data.urls
          console.log('✅ URLs reçues:', newUrls)
        } else if (response.error) {
          console.error('❌ Erreur API:', response.error)
          throw new Error(response.error)
        }
      } else {
        console.log('🌐 Upload simple')
        // Upload simple vers FastAPI
        for (const image of newImages) {
          console.log('📤 Upload image:', image.name, image.size)
          const response = await api.uploadImage(image)
          console.log('📥 Réponse API (simple):', response)
          
          if (response.status === 'success' && response.data) {
            newUrls.push(response.data.url)
            console.log('✅ URL ajoutée:', response.data.url)
          } else if (response.error) {
            console.error('❌ Erreur API pour', image.name, ':', response.error)
            throw new Error(response.error)
          }
        }
      }
      
      if (newUrls.length > 0) {
        // Ajouter les nouvelles URLs
        setUploadedUrls(prev => {
          const updated = [...prev, ...newUrls]
          console.log('🔄 URLs mises à jour:', updated)
          return updated
        })
        
        // Nettoyer les previews temporaires
        newPreviews.forEach(url => {
          URL.revokeObjectURL(url)
          console.log('🗑️ Preview nettoyé')
        })
        
        // Retirer les images traitées
        setImages(prev => prev.filter(img => !newImages.includes(img)))
        setPreviews(prev => prev.filter((_, index) => !newPreviews.includes(prev[index])))
        
        console.log('🎯 Upload terminé avec succès')
      } else {
        console.warn('⚠️ Aucune URL reçue après upload')
        setError('Aucune URL reçue après upload')
      }
      
    } catch (err: any) {
      console.error('🔥 Erreur upload complète:', err)
      const errorMessage = typeof err === 'object' 
        ? (err.message || JSON.stringify(err)) 
        : String(err)
      
      setError(`Erreur upload: ${errorMessage}`)
    } finally {
      setIsUploading(false)
      console.log('🏁 Upload terminé, isUploading:', false)
    }
  }

  const removeImage = (index: number, isUploaded: boolean) => {
    console.log('🗑️ Suppression image:', { index, isUploaded })
    
    if (isUploaded) {
      // Supprimer une image déjà uploadée
      setUploadedUrls(prev => {
        const updated = prev.filter((_, i) => i !== index)
        console.log('✅ URL supprimée, nouvelles URLs:', updated)
        return updated
      })
    } else {
      // Supprimer un preview temporaire
      if (previews[index]) {
        URL.revokeObjectURL(previews[index])
        console.log('🗑️ Preview supprimé')
      }
      setImages(prev => prev.filter((_, i) => i !== index))
      setPreviews(prev => prev.filter((_, i) => i !== index))
    }
  }

  const triggerFileInput = () => {
    console.log('🎯 Déclenchement input file')
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading || (uploadedUrls.length + images.length) >= maxImages}
        />
        
        <div 
          onClick={triggerFileInput}
          className={`flex flex-col items-center justify-center py-8 
            ${isUploading || (uploadedUrls.length + images.length) >= maxImages 
              ? 'cursor-not-allowed opacity-50' 
              : 'cursor-pointer hover:bg-gray-50 transition-colors'}`}
        >
          <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-gray-600">
            {isUploading ? 'Upload en cours...' : 'Cliquez pour ajouter des images'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            JPG, PNG, WebP ou GIF • Max {maxSizeMB}MB par image
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {uploadedUrls.length + images.length} / {maxImages} images
          </p>
          {isUploading && (
            <div className="mt-2 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2"></div>
              <span className="text-xs text-blue-600">Upload en cours...</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {String(error)}
          </div>
        </div>
      )}

      {/* GALERIE COMBINÉE */}
      {(uploadedUrls.length > 0 || previews.length > 0) && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Images du produit
              </p>
              <p className="text-xs text-gray-500">
                {uploadedUrls.length} uploadée(s) • {previews.length} en attente
                {isUploading && ' • Upload en cours...'}
              </p>
            </div>
            
            {!autoUpload && previews.length > 0 && (
              <button
                type="button"
                onClick={() => handleUploadNewImages(images, previews)}
                disabled={isUploading}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Upload...
                  </>
                ) : (
                  `Uploader ${previews.length} image(s)`
                )}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {/* Images déjà uploadées */}
            {uploadedUrls.map((url, index) => (
              <div key={`uploaded-${index}`} className="relative group">
                <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 border-2 border-green-300">
                  <img
                    src={url}
                    alt={`Produit ${index + 1}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.jpg'
                      e.currentTarget.onerror = null
                    }}
                  />
                </div>
                <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center justify-center">
                  ✓
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(index, true)}
                  disabled={isUploading}
                  className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition-opacity hover:bg-red-600"
                  title="Supprimer cette image"
                >
                  ×
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-white text-xs truncate">
                    Image {index + 1}
                  </p>
                </div>
              </div>
            ))}

            {/* Previews en attente */}
            {previews.map((preview, index) => (
              <div key={`preview-${index}`} className="relative group">
                <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 border-2 border-dashed border-yellow-300">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="h-full w-full object-cover opacity-90"
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mx-auto mb-2"></div>
                        <p className="text-xs">Upload...</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="absolute top-1 right-1 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center justify-center">
                  ⏳
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(index, false)}
                  disabled={isUploading}
                  className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition-opacity hover:bg-red-600"
                  title="Annuler cette image"
                >
                  ×
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-yellow-900/70 to-transparent p-2">
                  <p className="text-white text-xs truncate">
                    En attente...
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Légende */}
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-300 rounded-full mr-2"></div>
              <span>Uploadé ({uploadedUrls.length})</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-300 rounded-full mr-2"></div>
              <span>En attente ({previews.length})</span>
            </div>
          </div>
        </div>
      )}

      {/* Instructions d'optimisation */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">
          🔧 Optimisation automatique
        </h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Redimensionnement automatique (max 2000px)</li>
          <li>• Compression WebP avec qualité 85%</li>
          <li>• Réduction de taille moyenne: 70-80%</li>
          <li>• Aucune perte visible de qualité</li>
        </ul>
      </div>
    </div>
  )
}