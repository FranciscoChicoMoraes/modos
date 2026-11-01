'use client'

import { CheckCheck } from 'lucide-react'
import { Pilula } from '@/components/marketing/Pilula'
import type { BlocoSugestao } from '@/lib/marketing/segmentos'

// atalho do bloco: mesma pílula, mas com peso próprio para não
// se perder no meio das opções. Fundo cinza, texto em negrito e ícone.
function PilulaTodos({ marcado, aoClicar }: {
  marcado: boolean
  aoClicar: () => void
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      title={marcado ? 'Limpar este bloco' : 'Marcar tudo deste bloco'}
      className={`flex items-center gap-1.5 mr-1 px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
        marcado
          ? 'bg-black text-white border-black'
          : 'bg-gray-100 border-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <CheckCheck size={13} />
      Todos
    </button>
  )
}

// lista de sugestões agrupada por categoria, na ordem em que foi escolhida
export function BlocosDeSugestao({ blocos, selecionados, aoAlternar, aoMarcarBloco }: {
  blocos: BlocoSugestao[]
  selecionados: string[]
  aoAlternar: (item: string) => void
  // com este atalho, cada bloco ganha o "Selecionar todos"
  aoMarcarBloco?: (itens: string[], marcar: boolean) => void
}) {
  return (
    <div className="space-y-5">
      {blocos.map(bloco => {
        const todosMarcados = bloco.itens.every(i => selecionados.includes(i))
        return (
        <div key={bloco.id}>
          <p className="text-sm font-semibold text-gray-900 mb-2.5">
            {bloco.titulo}
          </p>
          <div className="flex flex-wrap gap-2">
            {/* abre a linha com a mesma forma das outras opções:
                marca o bloco inteiro e, já marcado, limpa */}
            {aoMarcarBloco && (
              <PilulaTodos
                marcado={todosMarcados}
                aoClicar={() => aoMarcarBloco(bloco.itens, !todosMarcados)}
              />
            )}
            {bloco.itens.map(item => (
              <Pilula
                key={item}
                texto={item}
                ativo={selecionados.includes(item)}
                aoClicar={() => aoAlternar(item)}
              />
            ))}
          </div>
        </div>
        )
      })}
    </div>
  )
}

// marca ou desmarca um bloco inteiro, sem repetir item
export const marcarVarios = (
  itens: string[],
  marcar: boolean,
  lista: string[]
): string[] => (marcar
  ? [...new Set([...lista, ...itens])]
  : lista.filter(i => !itens.includes(i)))

// mantém só o que o cliente marcou, descartando blocos que ficaram vazios
export const filtrarBlocos = (blocos: BlocoSugestao[], escolhidos: string[]): BlocoSugestao[] =>
  blocos
    .map(bloco => ({ ...bloco, itens: bloco.itens.filter(i => escolhidos.includes(i)) }))
    .filter(bloco => bloco.itens.length > 0)
