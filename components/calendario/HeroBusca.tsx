'use client'

import { useState } from 'react'
import { ArrowRight, Search } from 'lucide-react'

export function HeroBusca() {
  const [busca, setBusca] = useState('')

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-10 text-center">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Calendário</h1>
      <p className="text-sm text-gray-500 mb-8">
        Seus conteúdos organizados por mês, semana e dia.
      </p>

      {/* Barra de busca grande (visual nesta etapa, sem chamada de API) */}
      <form
        onSubmit={(e) => e.preventDefault()}
        className="relative flex items-center"
      >
        <Search size={18} className="absolute left-5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Bom dia, o que você quer aprender hoje?"
          className="w-full pl-12 pr-16 py-4 text-sm bg-white rounded-full shadow-lg shadow-violet-200/50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          type="submit"
          aria-label="Buscar conteúdo"
          className="absolute right-2 w-11 h-11 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-md transition-colors"
        >
          <ArrowRight size={18} />
        </button>
      </form>
    </div>
  )
}
