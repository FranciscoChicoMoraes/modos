'use client'

import { Check } from 'lucide-react'

// botão em formato de pílula, usado nas trilhas de Marketing
export function Pilula({ texto, ativo, aoClicar }: {
  texto: string
  ativo: boolean
  aoClicar: () => void
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-colors ${
        ativo
          ? 'bg-black text-white border-black'
          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
      }`}
    >
      {ativo && <Check size={12} />}
      {texto}
    </button>
  )
}
