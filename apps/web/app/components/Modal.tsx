'use client'

import { useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  title: string
  children: React.ReactNode
  confirmText?: string
  cancelText?: string
  showConfirm?: boolean
  type?: 'info' | 'success' | 'warning' | 'danger'
}

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  showConfirm = true,
  type = 'info'
}: ModalProps) {
  // Empêcher le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const colors = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      button: 'bg-blue-600 hover:bg-blue-700',
      icon: 'ℹ️'
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      button: 'bg-green-600 hover:bg-green-700',
      icon: '✅'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      button: 'bg-yellow-600 hover:bg-yellow-700',
      icon: '⚠️'
    },
    danger: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      button: 'bg-red-600 hover:bg-red-700',
      icon: '🔴'
    }
  }

  const style = colors[type]

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className={`relative bg-white rounded-xl shadow-xl max-w-md w-full border ${style.border} transform transition-all`}>
            {/* Header */}
            <div className={`${style.bg} px-6 py-4 border-b ${style.border} rounded-t-xl`}>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span>{style.icon}</span>
                {title}
              </h3>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              {children}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {cancelText}
              </button>
              {showConfirm && (
                <button
                  onClick={() => {
                    onConfirm?.()
                    onClose()
                  }}
                  className={`px-4 py-2 text-white rounded-lg transition-colors ${style.button}`}
                >
                  {confirmText}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
