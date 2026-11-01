import { ArrowLeft } from 'lucide-react'
import type { DiaDetalhe } from '@/lib/dia/types'

export function CabecalhoDia({ dia }: { dia: DiaDetalhe }) {
  const totalPecas = dia.secoes.reduce((acc, s) => acc + s.pecas.length, 0)

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-8 sm:pt-10 pb-8">
      <a
        href="/calendario"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-5 transition-colors"
      >
        <ArrowLeft size={15} />
        Voltar ao Calendário
      </a>
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">{dia.rotulo}</h1>
      <p className="text-sm text-gray-500">
        Briefing de conteúdos do dia · {totalPecas} peças para produzir
      </p>
    </div>
  )
}
