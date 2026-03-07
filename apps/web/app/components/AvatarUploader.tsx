'use client'

import { useState, useRef, useEffect } from 'react'
import Cropper from 'react-cropper'
import { api } from '@/app/lib/api'

interface AvatarUploaderProps {
  currentAvatar: string | null
  username: string
  onUpload: (url: string) => void
  onClose: () => void
}

export default function AvatarUploader({ currentAvatar, username, onUpload, onClose }: AvatarUploaderProps) {
  const [image, setImage] = useState<string | null>(null)
  const [cropper, setCropper] = useState<any>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Ajouter le CSS dynamiquement si nécessaire
  useEffect(() => {
    if (!document.querySelector('#cropper-css')) {
      const link = document.createElement('link')
      link.id = 'cropper-css'
      link.rel = 'stylesheet'
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.css'
      document.head.appendChild(link)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 2 Mo')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCrop = async () => {
    if (!cropper) {
      alert("Veuillez d'abord sélectionner une image")
      return
    }

    setIsUploading(true)
    try {
      // Obtenir l'image recadrée en canvas
      const canvas = cropper.getCroppedCanvas({
        width: 200,
        height: 200,
        minWidth: 100,
        minHeight: 100,
        maxWidth: 500,
        maxHeight: 500,
        fillColor: '#fff',
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      })
      
      if (!canvas) {
        throw new Error('Impossible de recadrer l\'image')
      }

      // Convertir le canvas en blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!)
        }, 'image/jpeg', 0.9)
      })

      const file = new File([blob], `avatar-${Date.now()}.jpg`, { 
        type: 'image/jpeg' 
      })
      
      // Upload via l'API
      const response = await api.uploadAvatar(file)
      
      if (response.data?.url) {
        onUpload(response.data.url)
        onClose() // Fermer le modal après upload réussi
      } else {
        alert('Erreur lors de l\'upload')
      }
    } catch (error) {
      console.error('Erreur upload avatar:', error)
      alert('Erreur lors de l\'upload de l\'image')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Modifier la photo de profil</h3>
        </div>
        
        <div className="p-6">
          {!image ? (
            <div className="text-center">
              <div className="mb-4">
                {currentAvatar ? (
                  <img 
                    src={currentAvatar} 
                    alt="Avatar actuel"
                    className="w-32 h-32 rounded-full mx-auto object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mx-auto flex items-center justify-center text-white text-4xl font-bold">
                    {username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Choisir une image
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Formats acceptés : JPG, PNG, GIF, WebP (max 2 Mo)
              </p>
            </div>
          ) : (
            <div>
              <Cropper
                src={image}
                style={{ height: 400, width: '100%' }}
                initialAspectRatio={1}
                aspectRatio={1}
                guides={true}
                viewMode={1}
                dragMode="move"
                scalable={true}
                cropBoxMovable={true}
                cropBoxResizable={true}
                ref={(cropperRef) => {
                  if (cropperRef) {
                    setCropper(cropperRef.cropper);
                  }
                }}
              />
              
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={isUploading}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleCrop}
                  disabled={isUploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Upload...
                    </>
                  ) : (
                    'Enregistrer'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}