'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Semana } from '@/lib/calendario/types'
import { DiaCard } from './DiaCard'

export function SemanaRow({ semana }: { semana: Semana }) {
  const trilhoRef = useRef<HTMLDivElement>(null)

  const rolar = (direcao: 1 | -1) => {
    const trilho = trilhoRef.current
    if (!trilho) return
    trilho.scrollBy({ left: direcao * trilho.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <div className="group/row relative">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{semana.titulo}</h3>

      {/* Trilho horizontal estilo Netflix */}
      <div
        ref={trilhoRef}
        className="flex gap-4 overflow-x-auto scrollbar-none pb-2 -mx-1 px-1"
      >
        {semana.dias.map(dia => (
          <DiaCard key={dia.id} dia={dia} />
        ))}
      </div>

      {/* Setas de navegação: aparecem no hover da fileira (desktop) */}
      <button
        onClick={() => rolar(-1)}
        aria-label="Rolar para a esquerda"
        className="hidden md:flex absolute -left-4 top-1/2 w-9 h-9 items-center justify-center bg-white text-gray-600 rounded-full shadow-md border border-gray-100 opacity-0 group-hover/row:opacity-100 hover:text-blue-600 hover:scale-105 transition-all"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={() => rolar(1)}
        aria-label="Rolar para a direita"
        className="hidden md:flex absolute -right-4 top-1/2 w-9 h-9 items-center justify-center bg-white text-gray-600 rounded-full shadow-md border border-gray-100 opacity-0 group-hover/row:opacity-100 hover:text-blue-600 hover:scale-105 transition-all"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
