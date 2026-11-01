import type { Secao } from '@/lib/dia/types'
import { CANAIS } from '@/lib/dia/canais'
import { PecaCard } from './PecaCard'

export function SecaoCanal({ secao }: { secao: Secao }) {
  const info = CANAIS[secao.canal]
  const Icone = info.Icone

  return (
    <section className="bg-white/60 rounded-3xl px-5 sm:px-8 py-6 shadow-sm">
      {/* Título do canal + contador */}
      <div className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-xl bg-white text-violet-500 shadow-sm flex items-center justify-center">
          <Icone size={17} />
        </span>
        <h2 className="text-xl font-bold text-gray-900">{secao.titulo}</h2>
        <span className="px-2.5 py-0.5 text-xs font-medium bg-white text-gray-500 rounded-full shadow-sm">
          {secao.pecas.length} {secao.pecas.length === 1 ? 'peça' : 'peças'}
        </span>
      </div>

      {/* Grid responsivo com a proporção do canal */}
      <div className={`mt-5 grid gap-4 ${info.grid}`}>
        {secao.pecas.map(peca => (
          <PecaCard key={peca.id} peca={peca} />
        ))}
      </div>
    </section>
  )
}
