'use client'

import { RotateCcw, Trash2, X } from 'lucide-react'
import { periodoLegivel, type Campanha } from '@/lib/marketing/campanhas'

const quando = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

// pergunta antes de mandar para a lixeira e antes de apagar de vez
export function ConfirmarExclusao({ item, definitiva, aoCancelar, aoConfirmar }: {
  item: Campanha
  definitiva?: boolean
  aoCancelar: () => void
  aoConfirmar: () => void
}) {
  const rotulo = item.tipo === 'acao' ? 'ação' : 'campanha'

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onMouseDown={(e) => {
        e.stopPropagation()
        if (e.target === e.currentTarget) aoCancelar()
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-white rounded-xl w-full max-w-[360px] shadow-2xl border border-gray-100 text-left">
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-black truncate">{item.nome}</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {definitiva
                ? `Apagar esta ${rotulo} de vez? Não dá para voltar atrás.`
                : `Tem certeza que deseja excluir esta ${rotulo}?`}
            </p>
          </div>
          <button
            type="button"
            onClick={aoCancelar}
            aria-label="Cancelar"
            className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded transition-colors shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-5 pb-5">
          <p className="text-[11px] text-gray-500">
            {definitiva
              ? 'A ação sai da lixeira e do banco de dados.'
              : 'Ela vai para a lixeira e pode ser recuperada a qualquer momento.'}
          </p>
        </div>

        <div className="px-5 h-14 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={aoCancelar}
            className="px-4 py-2 text-xs text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={aoConfirmar}
            className="px-5 py-2 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            {definitiva ? 'Apagar de vez' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  )
}

// lista do que foi excluído, com volta e descarte definitivo
export function Lixeira({ itens, aoFechar, aoRecuperar, aoApagar }: {
  itens: Campanha[]
  aoFechar: () => void
  aoRecuperar: (item: Campanha) => void
  aoApagar: (item: Campanha) => void
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) aoFechar()
      }}
    >
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-xl border border-gray-100 text-left">
        <div className="px-6 pt-4 pb-3 border-b border-gray-100 flex items-center justify-end gap-3">
          <span className="text-[10px] text-gray-400">
            {itens.length === 0
              ? 'Lixeira vazia'
              : `${itens.length} ${itens.length === 1 ? 'item' : 'itens'}`}
          </span>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 pt-4 pb-5 overflow-y-auto scrollbar-thin flex-1">
          <h2 className="text-[26px] leading-tight font-semibold text-black mb-4">Lixeira</h2>

          {itens.length === 0 ? (
            <p className="text-xs text-gray-400">
              Nada excluído por aqui. O que você apagar fica guardado nesta tela.
            </p>
          ) : (
            <div className="space-y-2">
              {itens.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200"
                >
                  {/* miniatura da direção, quando é uma ação com guia */}
                  {item.direcao && (
                    <span className="flex h-8 w-8 shrink-0 rounded overflow-hidden">
                      {item.direcao.paleta.slice(0, 4).map(cor => (
                        <span key={cor.hex} className="flex-1" style={{ backgroundColor: cor.hex }} />
                      ))}
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-black truncate">{item.nome}</p>
                    <p className="text-[10px] text-gray-400">
                      {item.tipo === 'acao' ? 'Ação' : 'Campanha'}
                      {' · '}
                      {periodoLegivel(item.inicio, item.fim)}
                      {item.excluidaEm ? ` · excluída em ${quando(item.excluidaEm)}` : ''}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => aoRecuperar(item)}
                    className="flex items-center gap-1 px-3 py-1.5 text-[11px] border border-gray-200 text-gray-600 rounded-full hover:bg-gray-100 transition-colors shrink-0"
                  >
                    <RotateCcw size={12} />
                    Recuperar
                  </button>
                  <button
                    type="button"
                    onClick={() => aoApagar(item)}
                    aria-label="Apagar de vez"
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
