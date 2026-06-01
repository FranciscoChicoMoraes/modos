'use client'

import { X } from 'lucide-react'

interface ArchiveModalProps {
  isOpen: boolean
  candidateName: string
  onClose: () => void
  onConfirm: (reason: string) => void
}

export function ArchiveModal({
  isOpen,
  candidateName,
  onClose,
  onConfirm,
}: ArchiveModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="bg-white rounded-lg max-w-sm w-full shadow-2xl relative animate-modalSlideIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-black">Arquivar Candidata</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black transition-colors hover:scale-110 duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700">
            Tem certeza que deseja arquivar <span className="font-semibold text-black">{candidateName}</span>?
          </p>

          <p className="text-sm text-gray-500">
            Selecione o motivo do arquivamento:
          </p>

          {/* Buttons */}
          <div className="space-y-3 pt-4">
            <button
              onClick={() => {
                onConfirm('gave_up')
                onClose()
              }}
              className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-black rounded-lg font-medium transition-all duration-200 hover:shadow-md"
            >
              Desistiu
            </button>

            <button
              onClick={() => {
                onConfirm('other')
                onClose()
              }}
              className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-black rounded-lg font-medium transition-all duration-200 hover:shadow-md"
            >
              Outro
            </button>

            <button
              onClick={onClose}
              className="w-full px-4 py-3 border border-gray-300 text-black rounded-lg font-medium transition-all duration-200 hover:bg-gray-50 hover:shadow-md"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
