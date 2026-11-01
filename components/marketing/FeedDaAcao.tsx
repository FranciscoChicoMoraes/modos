'use client'

import { Camera, Plus, X } from 'lucide-react'
import { useFontesGoogle } from '@/hooks/useFontesGoogle'
import { montarQuadrosDoFeed, QUADROS_DO_FEED } from '@/lib/marketing/moodboard'
import type { DirecaoCriativa, Moodboard as MoodboardDados } from '@/lib/marketing/moodboard'

const NOMES_DOS_DESTAQUES = ['Novidades', 'Coleção', 'Inspiração', 'Detalhes', 'Bastidores']

// Como a ação fica no perfil: a grade de publicações, na ordem do layout
// de feed que a direção escolheu.
export function FeedDaAcao({ nome, empresa, direcao, dados, aoFechar }: {
  nome: string
  // o perfil é da loja: nome e logo vêm do cadastro em Marketing
  empresa: { nome: string; logo?: string }
  direcao: DirecaoCriativa
  dados: MoodboardDados
  aoFechar: () => void
}) {
  useFontesGoogle([direcao.fonte])

  const quadros = montarQuadrosDoFeed(dados, QUADROS_DO_FEED)
  const fundo = direcao.paleta[0]?.hex ?? '#111111'
  const loja = empresa.nome?.trim() || nome
  const inicial = loja.slice(0, 1).toLocaleUpperCase('pt-BR')
  const legenda = direcao.release || direcao.descricao

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-0 sm:p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) aoFechar() }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Prévia do perfil de ${empresa.nome || nome}`}
        className="flex h-dvh w-full flex-col overflow-hidden bg-white text-left shadow-2xl sm:h-[88vh] sm:max-h-[900px] sm:max-w-[430px] sm:rounded-xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Camera size={21} strokeWidth={1.7} className="text-gray-900" aria-hidden="true" />
            <span className="font-serif text-[22px] italic leading-none text-gray-950">Instagram</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-medium text-gray-500">
              PRÉVIA
            </span>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar prévia"
            className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <X size={19} />
          </button>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto scrollbar-fina">
          {quadros.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center">
              <Camera size={32} className="mb-3 text-gray-300" />
              <p className="text-sm font-semibold text-gray-800">Ainda não há imagens para o feed</p>
              <p className="mt-1 text-xs text-gray-500">
                Adicione referências à ação para visualizar as publicações.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 px-4 pb-3 pt-4">
                <span
                  className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full text-lg font-semibold text-white"
                  style={{ backgroundColor: fundo }}
                >
                  {empresa.logo
                    ? <img src={empresa.logo} alt="" className="h-full w-full object-cover" />
                    : inicial}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-950">{loja}</p>
                  <p className="mt-1 text-xs text-gray-500">{quadros.length} publicações</p>
                </div>
              </div>

              <p className="px-4 pb-4 text-xs leading-[1.45] text-gray-900">{legenda}</p>

              {/* destaques do perfil, com as primeiras peças da grade */}
              <div className="overflow-x-auto border-b border-gray-100 scrollbar-fina">
                <div className="flex w-max gap-3 px-4 py-3">
                  <button type="button" className="flex w-[62px] flex-col items-center gap-1.5">
                    <span className="flex h-[58px] w-[58px] items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-400">
                      <Plus size={18} />
                    </span>
                    <span className="w-full truncate text-center text-[10px] text-gray-700">Novo</span>
                  </button>

                  {quadros.slice(0, NOMES_DOS_DESTAQUES.length).map((quadro, indice) => (
                    <button key={quadro.chave} type="button" className="flex w-[62px] flex-col items-center gap-1.5">
                      <span className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-gray-200 p-[2px]">
                        <span className="h-full w-full overflow-hidden rounded-full border-2 border-white bg-white">
                          <img src={quadro.url} alt="" className="h-full w-full object-cover" />
                        </span>
                      </span>
                      <span className="w-full truncate text-center text-[10px] text-gray-700">
                        {NOMES_DOS_DESTAQUES[indice]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-[2px] bg-gray-100">
                {quadros.map(quadro => (
                  <span key={quadro.chave} className="block aspect-[4/5] overflow-hidden bg-gray-100">
                    <img
                      src={quadro.url}
                      alt={`${direcao.nome}: ${direcao.descricao}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </span>
                ))}
              </div>
            </>
          )}
        </main>
      </section>
    </div>
  )
}
