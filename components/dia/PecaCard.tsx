'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { PecaCard as Peca } from '@/lib/dia/types'
import { CANAIS } from '@/lib/dia/canais'

const numero = (ordem: number) => String(ordem).padStart(2, '0')

export function PecaCard({ peca }: { peca: Peca }) {
  const [aberta, setAberta] = useState(false)
  const info = CANAIS[peca.canal]

  return (
    <>
      {/* Card briefing: capa que simula a peça + orientação de como fazer */}
      <button
        onClick={() => setAberta(true)}
        className="group flex flex-col text-left bg-white rounded-2xl overflow-hidden shadow-sm border border-transparent hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
      >
        <div className={`relative w-full ${info.aspecto} bg-gradient-to-br from-[#D8D0EE] to-[#C4CFEA] overflow-hidden`}>
          <img
            src={peca.capaImagem}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
          />
          <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold bg-white/90 text-gray-800 rounded-full shadow-sm">
            {numero(peca.ordem)}
          </span>
          {peca.tituloCurto && (
            <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-medium bg-blue-500/90 text-white rounded-full shadow-sm">
              {peca.tituloCurto}
            </span>
          )}
        </div>
        {/* padding no wrapper e altura fixa de 2 linhas: todos os cards
            alinham, e o que não couber termina em reticências */}
        <div className="p-3 w-full">
          <p className="text-[11px] leading-[16px] text-gray-600 line-clamp-2 h-[32px] overflow-hidden">
            {peca.orientacao}
          </p>
        </div>
      </button>

      {/* Modal simples: capa ampliada + orientação completa */}
      {aberta && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setAberta(false)
          }}
        >
          <div className="bg-white rounded-2xl p-4 w-full max-w-sm flex flex-col gap-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">
                {info.titulo} · Peça {numero(peca.ordem)}
              </span>
              <button
                onClick={() => setAberta(false)}
                aria-label="Fechar"
                className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className={`relative w-full ${info.aspecto} max-h-[60vh] rounded-xl overflow-hidden bg-gradient-to-br from-[#D8D0EE] to-[#C4CFEA]`}>
              <img src={peca.capaImagem} alt="" className="absolute inset-0 w-full h-full object-cover" />
            </div>
            {peca.tituloCurto && (
              <p className="text-sm font-bold text-gray-900">{peca.tituloCurto}</p>
            )}
            <p className="text-xs text-gray-600 leading-relaxed">{peca.orientacao}</p>
          </div>
        </div>
      )}
    </>
  )
}
