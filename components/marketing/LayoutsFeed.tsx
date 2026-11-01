'use client'

import { useRef, useState } from 'react'
import { Palette, Undo2, User, X } from 'lucide-react'
import {
  COLUNAS, NOMES_CATEGORIA, PERFIS, contar, montarLayout, numeroDePublicacao,
  percentual, type Categoria, type LayoutFeed, type Perfil
} from '@/lib/marketing/layoutsFeed'

const uid = () => Math.random().toString(36).slice(2, 10)

// a calça não existe no lucide, então vai desenhada aqui
function IconeCalca({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 2.5h12l.6 19h-4.3L12 11l-2.3 10.5H5.4L6 2.5Z" />
      <path d="M6 6.5h12" />
    </svg>
  )
}

const CORES: Record<Categoria, { fundo: string; traco: string }> = {
  M: { fundo: '#EEF2FF', traco: '#4F46E5' },
  P: { fundo: '#F0FDF4', traco: '#15803D' },
  A: { fundo: '#FEF3C7', traco: '#B45309' }
}

function Quadro({ categoria, numero, compacto }: {
  categoria: Categoria | null
  numero: number
  compacto?: boolean
}) {
  if (!categoria) {
    return (
      <span className="flex aspect-[3/4] items-center justify-center border border-dashed border-gray-200 bg-white" />
    )
  }

  const cor = CORES[categoria]
  return (
    <span
      className="relative flex aspect-[3/4] items-center justify-center"
      style={{ backgroundColor: cor.fundo, color: cor.traco }}
      title={`${NOMES_CATEGORIA[categoria]} · publica em ${numero}º`}
    >
      {categoria === 'M' && <User size={compacto ? 12 : 20} />}
      {categoria === 'P' && <IconeCalca size={compacto ? 12 : 20} />}
      {categoria === 'A' && <Palette size={compacto ? 12 : 20} />}

      {!compacto && (
        <span className="absolute bottom-1 right-1 rounded-full bg-white/90 px-1.5 text-[9px] font-semibold text-gray-600">
          {numero}
        </span>
      )}
    </span>
  )
}

export function GradeDoLayout({ ordem, compacto }: {
  ordem: (Categoria | null)[]
  compacto?: boolean
}) {
  return (
    <div
      className="grid gap-[2px] overflow-hidden rounded-lg bg-gray-200"
      style={{ gridTemplateColumns: `repeat(${COLUNAS}, minmax(0, 1fr))` }}
    >
      {ordem.map((categoria, i) => (
        <Quadro
          key={i}
          categoria={categoria}
          numero={numeroDePublicacao(i, ordem.length)}
          compacto={compacto}
        />
      ))}
    </div>
  )
}

function Contagem({ ordem }: { ordem: Categoria[] }) {
  const total = ordem.length
  const numeros = contar(ordem)
  return (
    <p className="text-[11px] text-gray-500">
      {(['M', 'P', 'A'] as Categoria[])
        .map(c => `${c} ${numeros[c]} (${percentual(numeros[c], total)}%)`)
        .join(' · ')}
    </p>
  )
}

export function CadastroLayout({ layout: emEdicao, naNuvem, aoFechar, aoSalvar }: {
  layout?: LayoutFeed | null
  naNuvem: boolean
  aoFechar: () => void
  aoSalvar: (layout: LayoutFeed) => void
}) {

  const [codigo, setCodigo] = useState(emEdicao?.codigo ?? '')
  const [nome, setNome] = useState(emEdicao?.nome ?? '')
  const [perfil, setPerfil] = useState<Perfil>(emEdicao?.perfil ?? 'Equilibrado')
  // o clique é a ordem de publicação: o primeiro post é o canto inferior direito
  const [publicacao, setPublicacao] = useState<Categoria[]>(
    emEdicao ? [...emEdicao.ordem_visual].reverse() : []
  )
  const [erro, setErro] = useState('')
  const editando = emEdicao ?? null

  const conteudoRef = useRef<HTMLDivElement>(null)

  const adicionar = (categoria: Categoria) => {
    setPublicacao(prev => [...prev, categoria])
    setErro('')
  }

  const apagarUltimo = () => setPublicacao(prev => prev.slice(0, -1))

  // a grade cresce de baixo para cima: o que falta fica vazio no topo
  const vazios = (COLUNAS - (publicacao.length % COLUNAS)) % COLUNAS
  const visual: (Categoria | null)[] = [
    ...Array<null>(vazios).fill(null),
    ...[...publicacao].reverse()
  ]

  const limpar = () => {
    setCodigo('')
    setNome('')
    setPerfil('Equilibrado')
    setPublicacao([])
    setErro('')
  }

  // a grade só fecha em linhas completas de três
  const linhaIncompleta = publicacao.length % COLUNAS !== 0
  const podeSalvar = publicacao.length >= COLUNAS && !linhaIncompleta

  const salvar = async () => {
    if (publicacao.length === 0) return setErro('Monte a sequência clicando nas pílulas.')
    if (linhaIncompleta) {
      return setErro(`Falta${vazios === 1 ? '' : 'm'} ${vazios} para fechar a primeira linha.`)
    }
    if (!codigo.trim() || !nome.trim()) return setErro('Preencha o código e o nome do layout.')

    // o que vai para o banco é a leitura visual, de cima para baixo
    const ordemVisual = [...publicacao].reverse()
    const linhas: Categoria[][] = []
    for (let i = 0; i < ordemVisual.length; i += COLUNAS) linhas.push(ordemVisual.slice(i, i + COLUNAS))

    aoSalvar({
      id: editando?.id ?? uid(),
      ...montarLayout({ codigo, nome, perfil }, linhas),
      criadoEm: editando?.criadoEm ?? new Date().toISOString()
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) aoFechar() }}
    >
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col rounded-xl border border-gray-100 bg-white text-left shadow-xl">
        <div className="flex items-center justify-end gap-3 border-b border-gray-100 px-6 pt-4 pb-3">
          {!naNuvem && (
            <span
              title="Rode migrations_layouts_feed.sql no Supabase para guardar na nuvem."
              className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[10px] text-amber-700"
            >
              Salvo só nesta tela
            </span>
          )}
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
          >
            <X size={16} />
          </button>
        </div>

        <div ref={conteudoRef} className="flex-1 space-y-6 overflow-y-auto scrollbar-thin px-6 pt-4 pb-6">
          <h2 className="text-[26px] font-semibold leading-tight text-black">
            {editando ? `Editar layout ${editando.codigo}` : 'Layout de feed'}
          </h2>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* formulário */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="w-24 shrink-0">
                  <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-gray-500">Código</label>
                  <input
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="01"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-black outline-none focus:border-black placeholder-gray-400"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-gray-500">Nome</label>
                  <input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Mescla equilibrada"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-black outline-none focus:border-black placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-gray-500">Perfil</label>
                <div className="flex flex-wrap gap-2">
                  {PERFIS.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPerfil(p)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        perfil === p
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500">
                  Sequência
                  <span className="normal-case tracking-normal text-gray-400">
                    {publicacao.length} {publicacao.length === 1 ? 'post' : 'posts'}
                    {publicacao.length > 0 && ` · ${Math.ceil(publicacao.length / COLUNAS)} ${Math.ceil(publicacao.length / COLUNAS) === 1 ? 'linha' : 'linhas'}`}
                  </span>
                </label>

                {/* clicar vai montando a grade ao lado */}
                <div className="flex flex-wrap gap-2">
                  {(['M', 'P', 'A'] as Categoria[]).map(categoria => (
                    <button
                      key={categoria}
                      type="button"
                      onClick={() => adicionar(categoria)}
                      className="flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-colors hover:brightness-95"
                      style={{
                        backgroundColor: CORES[categoria].fundo,
                        borderColor: CORES[categoria].fundo,
                        color: CORES[categoria].traco
                      }}
                    >
                      {categoria === 'M' && <User size={14} />}
                      {categoria === 'P' && <IconeCalca size={14} />}
                      {categoria === 'A' && <Palette size={14} />}
                      {NOMES_CATEGORIA[categoria]}
                    </button>
                  ))}
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={apagarUltimo}
                    disabled={publicacao.length === 0}
                    className="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-[11px] text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-40"
                  >
                    <Undo2 size={12} />
                    Apagar último
                  </button>
                  <button
                    type="button"
                    onClick={() => setPublicacao([])}
                    disabled={publicacao.length === 0}
                    className="rounded-full border border-gray-200 px-3 py-1.5 text-[11px] text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-40"
                  >
                    Limpar grade
                  </button>

                  {linhaIncompleta && (
                    <span className="text-[11px] text-amber-700">
                      Falta{vazios === 1 ? '' : 'm'} {vazios} para fechar a primeira linha
                    </span>
                  )}
                </div>

                {/* a sequência escrita, para conferir de relance */}
                {publicacao.length > 0 && (
                  <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.25em] text-gray-500">
                    {Array.from({ length: Math.ceil(visual.length / COLUNAS) }).map((_, i) =>
                      visual.slice(i * COLUNAS, i * COLUNAS + COLUNAS)
                        .map(c => c ?? '·').join(' ')
                    ).join('  /  ')}
                  </p>
                )}
              </div>

              {erro && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                  {erro}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={salvar}
                  disabled={!podeSalvar}
                  className="rounded-lg bg-black px-5 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {editando ? 'Salvar alterações' : 'Salvar'}
                </button>
                {editando && (
                  <button
                    type="button"
                    onClick={aoFechar}
                    className="rounded-lg px-3 py-2 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-black"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>

            {/* prévia, no formato do feed */}
            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-gray-500">Prévia</label>

              {publicacao.length > 0 ? (
                <div className="rounded-xl border border-gray-200 p-3">
                  <GradeDoLayout ordem={visual} />

                  <div className="mt-3 space-y-1">
                    <Contagem ordem={publicacao} />
                    <p className="text-[10px] text-gray-400">
                      M = Modelo · P = Produto · A = Arte
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Você clica na ordem de publicação: o primeiro post ocupa o canto inferior
                      direito e a grade sobe a partir dele.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-200">
                  <p className="text-[11px] text-gray-400">Clique nas pílulas para montar a grade.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
