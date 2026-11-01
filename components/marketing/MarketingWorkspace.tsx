'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays, Check, LayoutGrid, List, ListChecks, Megaphone, Plus, Search, Trash2, X
} from 'lucide-react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { carregarDaNuvem, excluirDaNuvem, salvarNaNuvem } from '@/lib/marketing/armazenamento'
import { CampanhaTrilha } from '@/components/marketing/CampanhaTrilha'
import { AcaoCriacao } from '@/components/marketing/AcaoCriacao'
import { QuadroPaleta } from '@/components/marketing/QuadroPaleta'
import { ConfirmarExclusao, Lixeira } from '@/components/marketing/Lixeira'
import { useFontesGoogle } from '@/hooks/useFontesGoogle'
import type { CadastroMarketing } from '@/components/marketing/OnboardingTrilha'
import { nomeCanal, periodoLegivel, type Campanha } from '@/lib/marketing/campanhas'
import { montarQuadrosDoFeed, QUADROS_DA_CAPA } from '@/lib/marketing/moodboard'

type Guia = 'campanha' | 'acao' | 'calendario'

const GUIAS: { id: Guia; nome: string; icone: typeof Megaphone }[] = [
  { id: 'campanha', nome: 'Campanha', icone: Megaphone },
  { id: 'acao', nome: 'Ações', icone: ListChecks },
  { id: 'calendario', nome: 'Calendário', icone: CalendarDays }
]

// 'auto' segue o tema da página; 'claro' vive dentro de um pop-up branco;
// 'escuro' é o cartão preto da seleção, com as cores do modo escuro
type Tema = 'auto' | 'claro' | 'escuro'

const CORES: Record<Tema, {
  titulo: string
  periodo: string
  canais: string
  tag: string
  tagEscura: string
}> = {
  auto: {
    titulo: 'text-gray-900 dark:text-gray-50',
    periodo: 'text-gray-500 dark:text-zinc-400',
    canais: 'text-gray-400 dark:text-zinc-600',
    tag: 'border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400',
    tagEscura: 'bg-black text-white dark:bg-white dark:text-black'
  },
  claro: {
    titulo: 'text-gray-900',
    periodo: 'text-gray-500',
    canais: 'text-gray-400',
    tag: 'border border-gray-200 text-gray-500',
    tagEscura: 'bg-black text-white'
  },
  escuro: {
    titulo: 'text-gray-50',
    periodo: 'text-zinc-400',
    canais: 'text-zinc-500',
    tag: 'border border-zinc-700 text-zinc-400',
    tagEscura: 'bg-white text-black'
  }
}

// etiqueta de leitura do cartão. Com aoClicar, vira botão.
function Tag({ children, escura, tema = 'auto', aoClicar }: {
  children: React.ReactNode
  escura?: boolean
  tema?: Tema
  aoClicar?: () => void
}) {
  const cores = CORES[tema]
  const classe = `flex items-center gap-1 max-w-[170px] px-2 py-0.5 text-[10px] rounded-full ${
    escura ? cores.tagEscura : cores.tag
  }`

  if (!aoClicar) return <span className={classe}>{children}</span>

  return (
    <button
      type="button"
      // o clique é da etiqueta, não do cartão que está atrás
      onClick={(e) => {
        e.stopPropagation()
        aoClicar()
      }}
      className={`${classe} hover:border-gray-400 dark:hover:border-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors`}
    >
      {children}
    </button>
  )
}

// pop-up de leitura: o que a campanha alcança
function DetalhesCampanha({ campanha, aoFechar }: {
  campanha: Campanha
  aoFechar: () => void
}) {
  // marcas antes dos produtos, como na trilha de cadastro
  const blocos = [
    { titulo: 'Grupos', itens: campanha.grupos },
    { titulo: 'Marcas', itens: campanha.marcas },
    { titulo: 'Produtos', itens: campanha.produtos }
  ].filter(b => b.itens.length > 0)

  return (
    // fundo desfocado, como nos outros pop-ups da plataforma
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      // o pop-up mora dentro do cartão: sem isto, o clique aqui abriria a trilha
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => {
        e.stopPropagation()
        if (e.target === e.currentTarget) aoFechar()
      }}
    >
      <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl border border-gray-100 text-left">
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-black truncate">{campanha.nome}</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {campanha.escopoGrupos === 'loja' ? 'Alcança toda a loja' : 'Alcança o que está marcado'}
            </p>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded transition-colors shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4 max-h-[50vh] overflow-y-auto scrollbar-thin">
          {blocos.map(bloco => (
            <div key={bloco.titulo}>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
                {bloco.titulo}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {bloco.itens.map(item => (
                  <span
                    key={item}
                    className="px-2 py-0.5 text-[10px] border border-gray-200 text-gray-600 rounded-full"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {blocos.length === 0 && (
            <p className="text-xs text-gray-400">Nada marcado nesta campanha.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// antes de criar uma ação, escolhe a que campanhas ela pertence.
// usa a mesma moldura da trilha, para o tamanho não mudar na sequência.
function SelecionarCampanhas({ campanhas, escolhidas, aoAlternar, aoFechar, aoContinuar }: {
  campanhas: Campanha[]
  escolhidas: string[]
  aoAlternar: (id: string) => void
  aoFechar: () => void
  aoContinuar: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-xl border border-gray-100 text-left">
        <div className="px-6 pt-4 pb-3 border-b border-gray-100 flex items-center justify-end gap-3">
          <span className="text-[10px] text-gray-400">
            {escolhidas.length > 0 ? '1 campanha escolhida' : 'Escolha uma campanha'}
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
          <h2 className="text-[26px] leading-tight font-semibold text-black mb-4">
            Selecione uma campanha
          </h2>

          {campanhas.length === 0 ? (
            <p className="text-xs text-gray-400">
              Nenhuma campanha criada ainda. Crie uma campanha para vincular a ação.
            </p>
          ) : (
            /* os mesmos cartões da guia Campanha, aqui como opções */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {campanhas.map(campanha => {
                const ativa = escolhidas.includes(campanha.id)
                return (
                  <div
                    key={campanha.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => aoAlternar(campanha.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        aoAlternar(campanha.id)
                      }
                    }}
                    // branco por padrão, preto quando escolhido
                    className={`relative rounded-xl border p-4 text-left cursor-pointer transition-colors ${
                      ativa
                        ? 'bg-black border-black hover:bg-zinc-800 hover:border-zinc-800'
                        : 'bg-white border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {ativa && (
                      <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-white text-black flex items-center justify-center">
                        <Check size={11} />
                      </span>
                    )}
                    <ConteudoCartao campanha={campanha} tema={ativa ? 'escuro' : 'claro'} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end">
          <button
            type="button"
            onClick={aoContinuar}
            disabled={escolhidas.length === 0}
            className="px-5 py-2 text-xs font-medium bg-black hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}

// miolo do cartão, usado no mosaico e na escolha de campanhas da ação
function ConteudoCartao({ campanha, aoAbrirDetalhes, tema = 'auto' }: {
  campanha: Campanha
  aoAbrirDetalhes?: () => void
  tema?: Tema
}) {
  const canais = campanha.canais.map(nomeCanal).join(' · ')
  const cores = CORES[tema]
  const direcao = campanha.direcao

  return (
    <>
      <p
        className={`text-sm font-semibold pr-6 truncate ${cores.titulo}`}
        style={direcao ? { fontFamily: `'${direcao.fonte}', serif` } : undefined}
      >
        {campanha.nome}
      </p>
      <p className={`text-[11px] mt-1 ${cores.periodo}`}>
        {periodoLegivel(campanha.inicio, campanha.fim)}
      </p>

      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        {direcao && (
          <Tag tema={tema}>
            <span className="truncate">{direcao.textura}</span>
          </Tag>
        )}

        {/* o objetivo vem primeiro e é a etiqueta em destaque,
            preenchida ao contrário do fundo do cartão */}
        <Tag escura tema={tema}>
          <span className="truncate">{campanha.objetivo}</span>
        </Tag>

        {campanha.desconto.tem && (
          <Tag tema={tema}>
            <span className="truncate">
              {campanha.desconto.percentual || campanha.desconto.formato}
            </span>
          </Tag>
        )}

        {/* clicar abre o que a campanha alcança */}
        <Tag tema={tema} aoClicar={aoAbrirDetalhes}>Produtos</Tag>
      </div>

      <p className={`text-[10px] mt-2.5 truncate ${cores.canais}`}>{canais}</p>
    </>
  )
}

// capa do cartão de ação: as primeiras peças do guia e a paleta da direção
function CapaDaAcao({ campanha }: { campanha: Campanha }) {
  const direcao = campanha.direcao
  const board = campanha.moodboard
  if (!direcao || !board) return null

  // o começo do mesmo feed do guia: as nove primeiras posições do layout
  // que a direção escolheu
  const pecas = montarQuadrosDoFeed(board, QUADROS_DA_CAPA)

  return (
    <div className="-m-4 mb-3 rounded-t-xl overflow-hidden">
      <div className="grid grid-cols-3 gap-px bg-gray-100 dark:bg-zinc-800">
        {Array.from({ length: QUADROS_DA_CAPA }).map((_, i) => {
          const quadro = pecas[i]
          return (
            <span key={i} className="block aspect-[4/5] overflow-hidden bg-gray-100 dark:bg-zinc-800">
              {quadro ? (
                <img src={quadro.url} alt="" loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <QuadroPaleta paleta={direcao.paleta} texto="" indice={i} />
              )}
            </span>
          )
        })}
      </div>
      <div className="flex h-1.5">
        {direcao.paleta.map(cor => (
          <span key={cor.hex} className="flex-1" style={{ backgroundColor: cor.hex }} />
        ))}
      </div>
    </div>
  )
}

// a mesma campanha em uma linha, para a visualização em lista
function LinhaCampanha({ campanha, aoAbrir, aoExcluir }: {
  campanha: Campanha
  aoAbrir: () => void
  aoExcluir: () => void
}) {
  const [detalhes, setDetalhes] = useState(false)
  const board = campanha.moodboard
  const fotos = board ? [...board.cenario, ...board.pessoas].slice(0, 4) : []

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={aoAbrir}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          aoAbrir()
        }
      }}
      className="group relative flex items-center gap-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 pr-14 cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); aoExcluir() }}
        aria-label="Excluir"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white rounded shadow-sm opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 size={13} />
      </button>

      {fotos.length > 0 && (
        <div className="flex shrink-0 gap-px overflow-hidden rounded-lg bg-gray-100 dark:bg-zinc-800">
          {fotos.map(img => (
            <span key={img.id} className="block h-14 w-11 overflow-hidden">
              <img src={img.thumb || img.url} alt="" loading="lazy" className="h-full w-full object-cover" />
            </span>
          ))}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50"
          style={campanha.direcao ? { fontFamily: `'${campanha.direcao.fonte}', serif` } : undefined}
        >
          {campanha.nome}
        </p>
        {/* objetivo longo não pode esticar a linha */}
        <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-zinc-400">
          {[
            periodoLegivel(campanha.inicio, campanha.fim),
            campanha.objetivo,
            campanha.desconto.tem ? (campanha.desconto.percentual || campanha.desconto.formato) : '',
            campanha.canais.map(nomeCanal).join(' · ')
          ].filter(Boolean).join(' · ')}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Tag aoClicar={() => setDetalhes(true)}>Produtos</Tag>
          {campanha.direcao && <Tag>{campanha.direcao.textura}</Tag>}
        </div>
      </div>

      {/* a paleta da direção fecha a linha */}
      {campanha.direcao && (
        <div className="hidden w-28 shrink-0 sm:flex h-2 overflow-hidden rounded-full">
          {campanha.direcao.paleta.map(cor => (
            <span key={cor.hex} className="flex-1" style={{ backgroundColor: cor.hex }} />
          ))}
        </div>
      )}

      {detalhes && (
        <DetalhesCampanha campanha={campanha} aoFechar={() => setDetalhes(false)} />
      )}
    </div>
  )
}

// cartão do mosaico
function CartaoCampanha({ campanha, aoAbrir, aoExcluir }: {
  campanha: Campanha
  aoAbrir: () => void
  aoExcluir: () => void
}) {
  const [detalhes, setDetalhes] = useState(false)

  return (
    // clicar no cartão reabre a trilha com tudo preenchido
    <div
      role="button"
      tabIndex={0}
      onClick={aoAbrir}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          aoAbrir()
        }
      }}
      // o hover troca a cor do quadro inteiro
      className="group relative bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 text-left cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          aoExcluir()
        }}
        aria-label="Excluir"
        className="absolute top-3 right-3 z-10 p-1.5 bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white rounded shadow-sm opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 size={13} />
      </button>

      <CapaDaAcao campanha={campanha} />

      <ConteudoCartao campanha={campanha} aoAbrirDetalhes={() => setDetalhes(true)} />

      {detalhes && (
        <DetalhesCampanha campanha={campanha} aoFechar={() => setDetalhes(false)} />
      )}
    </div>
  )
}

export function MarketingWorkspace({ cadastro }: { cadastro: CadastroMarketing }) {
  const [guia, setGuia] = useState<Guia>('campanha')
  // as campanhas ficam na tabela "campanhas" e as ações na "acoes".
  // O navegador guarda uma cópia, usada enquanto a nuvem não responde.
  const [campanhas, setCampanhas] = useLocalStorage<Campanha[]>('marketingCampanhas', [])
  const [naNuvem, setNaNuvem] = useState(true)

  useEffect(() => {
    let ativo = true
    void carregarDaNuvem().then(({ itens, naNuvem: ok }) => {
      if (!ativo) return
      setNaNuvem(ok)
      if (ok) setCampanhas(itens)
    })
    return () => { ativo = false }
    // roda uma vez, na abertura da área de Marketing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [trilhaAberta, setTrilhaAberta] = useState(false)
  const [busca, setBusca] = useState('')
  const [visualizacao, setVisualizacao] = useState<'grade' | 'lista'>('grade')
  const [buscaAberta, setBuscaAberta] = useState(false)
  const buscaRef = useRef<HTMLInputElement>(null)

  useFontesGoogle(campanhas.flatMap(c => (c.direcao ? [c.direcao.fonte] : [])))

  const tipo: 'campanha' | 'acao' = guia === 'acao' ? 'acao' : 'campanha'
  const rotulo = tipo === 'acao' ? 'ação' : 'campanha'

  // a ação guarda uma cópia da campanha de quando foi criada. Se a campanha
  // for renomeada depois, o nome da ação acompanha.
  const comNomeAtual = useCallback((item: Campanha): Campanha => {
    if (item.tipo !== 'acao') return item
    const origem = campanhas.find(c => c.id === item.campanhasIds?.[0])
    if (!origem || origem.nome === item.nome.split(' · ')[0]) return item
    const nome = item.direcao?.nome ? `${origem.nome} · ${item.direcao.nome}` : origem.nome
    return { ...item, nome }
  }, [campanhas])

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return campanhas
      .filter(c => !c.excluidaEm)
      .filter(c => c.tipo === tipo)
      .map(comNomeAtual)
      .filter(c =>
        termo === '' ||
        c.nome.toLowerCase().includes(termo) ||
        c.objetivo.toLowerCase().includes(termo)
      )
  }, [campanhas, tipo, busca, comNomeAtual])

  const abrirBusca = () => {
    setBuscaAberta(true)
    setTimeout(() => buscaRef.current?.focus(), 0)
  }

  const fecharBusca = () => {
    setBusca('')
    setBuscaAberta(false)
  }

  // guarda o que a campanha aberta pelo cartão, se for o caso
  const [emEdicao, setEmEdicao] = useState<Campanha | null>(null)
  // a ação começa escolhendo as campanhas a que ela pertence
  const [escolhendoCampanhas, setEscolhendoCampanhas] = useState(false)
  const [campanhasDaAcao, setCampanhasDaAcao] = useState<string[]>([])

  const listaDeCampanhas = useMemo(
    () => campanhas.filter(c => c.tipo === 'campanha'),
    [campanhas]
  )

  const nomesDasCampanhas = (ids: string[]) =>
    listaDeCampanhas.filter(c => ids.includes(c.id)).map(c => c.nome)

  // ação em criação (depois de escolher a campanha) e ação já criada em leitura
  const [acaoDaCampanha, setAcaoDaCampanha] = useState<Campanha | null>(null)
  const [acaoAberta, setAcaoAberta] = useState<Campanha | null>(null)

  const abrirNova = () => {
    setEmEdicao(null)
    setCampanhasDaAcao([])
    if (tipo === 'acao') {
      setEscolhendoCampanhas(true)
      return
    }
    setTrilhaAberta(true)
  }

  const abrirCampanha = (campanha: Campanha) => {
    if (campanha.tipo === 'acao' && campanha.direcao && campanha.moodboard) {
      setAcaoAberta(campanha)
      return
    }
    setEmEdicao(campanha)
    setCampanhasDaAcao([])
    setTrilhaAberta(true)
  }

  const fecharTrilha = () => {
    setTrilhaAberta(false)
    setEmEdicao(null)
    setCampanhasDaAcao([])
  }

  const naLixeira = useMemo(
    () => campanhas.filter(c => Boolean(c.excluidaEm)),
    [campanhas]
  )
  const [lixeiraAberta, setLixeiraAberta] = useState(false)
  // item aguardando confirmação: para a lixeira ou para o descarte final
  const [confirmando, setConfirmando] = useState<{ item: Campanha; definitiva: boolean } | null>(null)

  const guardar = (item: Campanha) => {
    setCampanhas(prev => prev.some(c => c.id === item.id)
      ? prev.map(c => (c.id === item.id ? item : c))
      : [item, ...prev])
    void salvarNaNuvem(item).then(ok => setNaNuvem(atual => atual && ok))
  }

  // excluir manda para a lixeira; só o descarte final apaga de verdade
  const mandarParaLixeira = (item: Campanha) =>
    guardar({ ...item, excluidaEm: new Date().toISOString() })

  const recuperar = (item: Campanha) => {
    const { excluidaEm: _, ...volta } = item
    guardar(volta as Campanha)
  }

  const apagarDeVez = (item: Campanha) => {
    setCampanhas(prev => prev.filter(c => c.id !== item.id))
    void excluirDaNuvem(item).then(ok => setNaNuvem(atual => atual && ok))
  }

  const confirmar = () => {
    if (!confirmando) return
    if (confirmando.definitiva) apagarDeVez(confirmando.item)
    else mandarParaLixeira(confirmando.item)
    setConfirmando(null)
  }

  const salvar = (campanha: Campanha) => {
    guardar(campanha)
    fecharTrilha()
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-8 py-10 text-left">
      {/* identificação da loja */}
      <div className="flex items-center gap-2 mb-6">
        {cadastro.logo && (
          <img src={cadastro.logo} alt="" className="w-6 h-6 rounded-full object-cover" />
        )}
        <span className="text-xs font-medium text-gray-900 dark:text-gray-50">{cadastro.nome}</span>
        <span className="text-[10px] text-gray-400 truncate">
          {cadastro.categoriaNomes.join(', ')}
        </span>
      </div>

      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
        Marketing
      </h1>
      <p className="text-sm text-gray-500 dark:text-zinc-400 mt-2">
        Monte campanhas, ações e o calendário de publicações da loja.
      </p>

      {/* guias à esquerda, ações à direita */}
      <div className="flex items-center gap-2 mt-10 mb-8">
        <div className="flex items-center gap-1">
          {GUIAS.map(({ id, nome, icone: Icone }) => {
            const ativa = guia === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setGuia(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                  ativa
                    ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-gray-50 border border-gray-200 dark:border-zinc-700'
                    : 'text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 border border-transparent'
                }`}
              >
                <Icone size={14} />
                {nome}
              </button>
            )
          })}
        </div>

        <div className="flex-1" />

        {/* avisa quando as tabelas ainda não existem e tudo está só no navegador */}
        {!naNuvem && (
          <span
            title="Rode migrations_campanhas_acoes.sql no Supabase para guardar na nuvem."
            className="px-3 py-1.5 text-[10px] rounded-full border border-amber-300 text-amber-700 bg-amber-50"
          >
            Salvo só neste navegador
          </span>
        )}

        {guia !== 'calendario' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={abrirNova}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black rounded-full transition-colors"
            >
              <Plus size={14} />
              {tipo === 'acao' ? 'Criar Ações' : 'Criar campanha'}
            </button>

            {/* como a lista aparece: grade ou linhas */}
            <div className="flex items-center rounded-full border border-gray-200 dark:border-zinc-700 p-0.5">
              <button
                type="button"
                onClick={() => setVisualizacao('grade')}
                aria-label="Exibir em grade"
                title="Exibir em grade"
                className={`p-2 rounded-full transition-colors ${
                  visualizacao === 'grade'
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                }`}
              >
                <LayoutGrid size={13} />
              </button>
              <button
                type="button"
                onClick={() => setVisualizacao('lista')}
                aria-label="Exibir em lista"
                title="Exibir em lista"
                className={`p-2 rounded-full transition-colors ${
                  visualizacao === 'lista'
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                }`}
              >
                <List size={13} />
              </button>
            </div>

            {buscaAberta ? (
              <div className="flex items-center gap-1 px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-full">
                <Search size={14} className="text-gray-400 shrink-0" />
                <input
                  ref={buscaRef}
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') fecharBusca()
                  }}
                  placeholder={`Buscar ${rotulo}...`}
                  className="w-40 text-xs bg-transparent focus:outline-none placeholder-gray-400 text-black dark:text-gray-50"
                />
                <button
                  type="button"
                  onClick={fecharBusca}
                  aria-label="Fechar busca"
                  className="text-gray-400 hover:text-black dark:hover:text-gray-50 shrink-0"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={abrirBusca}
                aria-label="Buscar"
                className="p-2.5 border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 rounded-full hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <Search size={14} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setLixeiraAberta(true)}
              aria-label="Lixeira"
              title={naLixeira.length > 0 ? 'Lixeira com itens' : 'Lixeira vazia'}
              className="p-2.5 border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 rounded-full hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* mosaico: sem campanhas, nada é exibido */}
      {guia === 'calendario' ? (
        <p className="text-sm text-gray-400 dark:text-zinc-600">Em construção</p>
      ) : (
        visualizacao === 'grade' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {visiveis.map(campanha => (
              <CartaoCampanha
                key={campanha.id}
                campanha={campanha}
                aoAbrir={() => abrirCampanha(campanha)}
                aoExcluir={() => setConfirmando({ item: campanha, definitiva: false })}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {visiveis.map(campanha => (
              <LinhaCampanha
                key={campanha.id}
                campanha={campanha}
                aoAbrir={() => abrirCampanha(campanha)}
                aoExcluir={() => setConfirmando({ item: campanha, definitiva: false })}
              />
            ))}
          </div>
        )
      )}

      {/* a chave reinicia a trilha a cada criação, ao trocar de guia
          e ao abrir uma campanha pelo cartão */}
      <CampanhaTrilha
        key={emEdicao ? emEdicao.id : `${tipo}-${campanhas.length}`}
        aberta={trilhaAberta}
        tipo={emEdicao?.tipo ?? tipo}
        cadastro={cadastro}
        campanha={emEdicao}
        campanhasIds={campanhasDaAcao.length > 0 ? campanhasDaAcao : undefined}
        campanhasNomes={nomesDasCampanhas(
          campanhasDaAcao.length > 0 ? campanhasDaAcao : emEdicao?.campanhasIds ?? []
        )}
        aoFechar={fecharTrilha}
        aoConcluir={salvar}
      />

      {/* criação da ação: direções criativas e guia */}
      {acaoDaCampanha && (
        <AcaoCriacao
          campanha={acaoDaCampanha}
          cadastro={cadastro}
          aoFechar={() => setAcaoDaCampanha(null)}
          aoSalvar={(acao) => {
            guardar(acao)
            setAcaoDaCampanha(null)
          }}
        />
      )}

      {/* guia de uma ação já criada */}
      {acaoAberta && (
        <AcaoCriacao
          campanha={comNomeAtual(acaoAberta)}
          cadastro={cadastro}
          acao={comNomeAtual(acaoAberta)}
          aoFechar={() => setAcaoAberta(null)}
        />
      )}

      {lixeiraAberta && (
        <Lixeira
          itens={naLixeira}
          aoFechar={() => setLixeiraAberta(false)}
          aoRecuperar={recuperar}
          aoApagar={(item) => setConfirmando({ item, definitiva: true })}
        />
      )}

      {confirmando && (
        <ConfirmarExclusao
          item={confirmando.item}
          definitiva={confirmando.definitiva}
          aoCancelar={() => setConfirmando(null)}
          aoConfirmar={confirmar}
        />
      )}

      {escolhendoCampanhas && (
        <SelecionarCampanhas
          campanhas={listaDeCampanhas}
          escolhidas={campanhasDaAcao}
          // uma ação pertence a uma campanha por vez
          aoAlternar={(id) => setCampanhasDaAcao(prev => (prev.includes(id) ? [] : [id]))}
          aoFechar={() => setEscolhendoCampanhas(false)}
          aoContinuar={() => {
            const escolhida = listaDeCampanhas.find(c => c.id === campanhasDaAcao[0])
            if (!escolhida) return
            setEscolhendoCampanhas(false)
            setAcaoDaCampanha(escolhida)
          }}
        />
      )}
    </div>
  )
}
