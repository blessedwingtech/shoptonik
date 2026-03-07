'use client'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'danger'
}: ConfirmationModalProps) {
  if (!isOpen) return null

  const colors = {
    danger: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      button: 'bg-red-600 hover:bg-red-700',
      icon: '🔴',
      text: 'text-red-700'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      button: 'bg-yellow-600 hover:bg-yellow-700',
      icon: '⚠️',
      text: 'text-yellow-700'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      button: 'bg-blue-600 hover:bg-blue-700',
      icon: 'ℹ️',
      text: 'text-blue-700'
    }
  }

  const style = colors[type]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-xl shadow-xl max-w-md w-full border ${style.border} overflow-hidden`}>
        <div className={`${style.bg} px-6 py-4 border-b ${style.border}`}>
          <h3 className={`text-lg font-semibold flex items-center gap-2 ${style.text}`}>
            <span>{style.icon}</span>
            {title}
          </h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-gray-700">{message}</p>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={`px-4 py-2 text-white rounded-lg transition-colors ${style.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}