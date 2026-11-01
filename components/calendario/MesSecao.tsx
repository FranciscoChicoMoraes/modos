'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Mes } from '@/lib/calendario/types'
import { SemanaRow } from './SemanaRow'

export function MesSecao({ mes, abertoInicialmente = true }: {
  mes: Mes
  abertoInicialmente?: boolean
}) {
  const [aberto, setAberto] = useState(abertoInicialmente)

  return (
    <section className="bg-white/60 rounded-3xl px-5 sm:px-8 py-6 shadow-sm">
      {/* Cabeçalho do mês (accordion) */}
      <button
        onClick={() => setAberto(a => !a)}
        aria-expanded={aberto}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{mes.titulo}</h2>
        <span className="flex items-center gap-2 text-violet-400">
          <span className="hidden sm:inline text-xs text-gray-400">
            {mes.semanas.length} {mes.semanas.length === 1 ? 'semana' : 'semanas'}
          </span>
          <ChevronDown
            size={22}
            className={`transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {aberto && (
        <div className="mt-6 flex flex-col gap-8">
          {mes.semanas.map(semana => (
            <SemanaRow key={semana.id} semana={semana} />
          ))}
        </div>
      )}
    </section>
  )
}
