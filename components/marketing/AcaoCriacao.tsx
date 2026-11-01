'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, Grid3x3, RotateCcw, X } from 'lucide-react'
import { CriandoAcoes } from '@/components/marketing/CriandoAcoes'
import { FeedDaAcao } from '@/components/marketing/FeedDaAcao'
import { QuadroPaleta } from '@/components/marketing/QuadroPaleta'
import { Moodboard } from '@/components/marketing/Moodboard'
import { useFontesGoogle } from '@/hooks/useFontesGoogle'
import type { CadastroMarketing } from '@/components/marketing/OnboardingTrilha'
import type { Campanha } from '@/lib/marketing/campanhas'
import type {
  DirecaoCriativa, ImagemRef, MaterialDoGuia, MaterialSugerido,
  Moodboard as MoodboardDados
} from '@/lib/marketing/moodboard'
import type { LayoutFeed } from '@/lib/marketing/layoutsFeed'

const uid = () => Math.random().toString(36).slice(2, 10)

const BIBLIOTECA_REFERENCIAS_KEY = 'biblioteca-referencias-marketing'

type BibliotecaReferencia = {
  id: string
  nome: string
  imagens: string[]
  tags: Array<{ categoria: string; valor: string }>
}

const obterBibliotecaLocal = (): BibliotecaReferencia[] => {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(BIBLIOTECA_REFERENCIAS_KEY)
    if (!raw) return []
    const dados = JSON.parse(raw)
    return Array.isArray(dados) ? dados as BibliotecaReferencia[] : []
  } catch {
    return []
  }
}

const imagensDaBiblioteca = (consultas: string[], porConsulta: number): ImagemRef[] => {
  const biblioteca = obterBibliotecaLocal()
  if (biblioteca.length === 0) return []

  const termos = consultas.map(consulta => consulta.trim().toLowerCase()).filter(Boolean)
  const itens = biblioteca
    .filter(item => {
      if (termos.length === 0) return true
      const texto = [item.nome, ...item.tags.map(tag => `${tag.categoria} ${tag.valor}`)].join(' ').toLowerCase()
      return termos.some(termo => texto.includes(termo))
    })
    .flatMap(item => item.imagens.map((url, index) => ({
      id: `${item.id}-${index}`,
      url,
      thumb: url,
      autor: item.nome,
      fonte: 'Biblioteca local',
      link: '#',
      largura: 1080,
      altura: 1440
    })))

  return itens.slice(0, porConsulta)
}

// o layout que a direção escolheu, entre os cadastrados
const buscarLayout = async (codigo?: string): Promise<LayoutFeed | undefined> => {
  if (!codigo) return undefined
  try {
    const r = await fetch('/api/marketing/layouts')
    if (!r.ok) return undefined
    const dados = await r.json()
    const layouts: LayoutFeed[] = dados.layouts ?? []
    return layouts.find(l => l.codigo === codigo) ?? layouts[0]
  } catch {
    return undefined
  }
}

const semAcento = (t: string) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

// os materiais que a direção sugeriu, casados com o cadastro de materiais:
// quando o nome bate, o guia mostra a foto e as cores de lá
const buscarMateriais = async (sugeridos?: MaterialSugerido[]): Promise<MaterialDoGuia[]> => {
  const lista = (sugeridos ?? []).slice(0, 3)
  if (lista.length === 0) return []

  try {
    const r = await fetch('/api/materiais')
    if (!r.ok) return []
    const dados = await r.json()
    const cadastrados = (dados.itens ?? []) as Array<{
      id: string
      nome: string
      imagens: string[]
      tags: Array<{ hex?: string }>
    }>

    // o guia só mostra material cadastrado: o que não existir no acervo sai
    return lista
      .map((sugerido): MaterialDoGuia | null => {
        const alvo = semAcento(sugerido.nome)
        const achado =
          cadastrados.find(m => semAcento(m.nome) === alvo) ??
          cadastrados.find(m => semAcento(m.nome).includes(alvo) || alvo.includes(semAcento(m.nome)))
        if (!achado) return null

        const cores = [...new Set((achado.tags ?? [])
          .map(t => t.hex)
          .filter((hex): hex is string => Boolean(hex)))].slice(0, 5)

        return {
          ...sugerido,
          nome: achado.nome,
          id: achado.id,
          imagem: achado.imagens?.[0],
          imagens: (achado.imagens ?? []).slice(0, 6),
          cores
        }
      })
      .filter((m): m is MaterialDoGuia => m !== null)
  } catch {
    return []
  }
}

// acervo próprio primeiro: o que a agência cadastrou em /cadastrodereferencias
const buscarNaBiblioteca = async (
  termos: string[],
  bloco: 'cenario' | 'pessoas' | 'arte',
  limite: number
): Promise<ImagemRef[]> => {
  try {
    const r = await fetch('/api/referencias/buscar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ termos, bloco, limite })
    })
    if (!r.ok) return []
    const dados = await r.json()
    return dados.imagens ?? []
  } catch {
    return []
  }
}

// cartão de uma direção: mosaico do feed, paleta, textura e tipografia
function CartaoDirecao({ direcao, mosaico, aoEscolher }: {
  direcao: DirecaoCriativa
  mosaico: ImagemRef[]
  aoEscolher: () => void
}) {
  return (
    <button
      type="button"
      onClick={aoEscolher}
      className="text-left rounded-xl border border-gray-200 overflow-hidden bg-white transition-colors hover:bg-gray-100"
    >
      {/* mosaico em grade, como uma prévia de feed */}
      <div className="grid grid-cols-3 gap-px bg-gray-100">
        {Array.from({ length: 6 }).map((_, i) => {
          const img = mosaico[i]
          return (
            <span key={i} className="block aspect-square bg-gray-100 overflow-hidden">
              {img ? (
                <img src={img.thumb || img.url} alt="" loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <QuadroPaleta
                  paleta={direcao.paleta}
                  texto=""
                  indice={i}
                  fonte={direcao.fonte}
                />
              )}
            </span>
          )
        })}
      </div>

      <div className="flex h-2">
        {direcao.paleta.map(cor => (
          <span key={cor.hex} className="flex-1" style={{ backgroundColor: cor.hex }} />
        ))}
      </div>

      <div className="p-4">
        <p className="text-base text-black" style={{ fontFamily: `'${direcao.fonte}', serif` }}>
          {direcao.nome}
        </p>
        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{direcao.descricao}</p>

        {direcao.acervo && (
          <span
            className="mt-2 inline-flex items-center gap-1 rounded-full bg-black px-2 py-0.5 text-[10px] text-white"
            title={direcao.apoio || 'Partiu do acervo de referências'}
          >
            Do acervo
          </span>
        )}
        <p className="text-[10px] text-gray-400 mt-2 truncate">
          {direcao.fonte} · {direcao.textura}
          {direcao.layout ? ` · layout ${direcao.layout}` : ''}
        </p>
      </div>
    </button>
  )
}

export function AcaoCriacao({ campanha, cadastro, acao, aoFechar, aoSalvar }: {
  campanha: Campanha
  cadastro: CadastroMarketing
  // quando vem preenchida, a tela só exibe o guia já criado
  acao?: Campanha | null
  aoFechar: () => void
  aoSalvar?: (acao: Campanha) => void
}) {
  const somenteLeitura = Boolean(acao?.direcao && acao?.moodboard)

  const [direcoes, setDirecoes] = useState<DirecaoCriativa[]>([])
  const [mosaicos, setMosaicos] = useState<Record<string, ImagemRef[]>>({})
  const [carregando, setCarregando] = useState(!somenteLeitura)
  const [erro, setErro] = useState<string | null>(null)

  const [escolhida, setEscolhida] = useState<DirecaoCriativa | null>(acao?.direcao ?? null)
  const [moodboard, setMoodboard] = useState<MoodboardDados | null>(acao?.moodboard ?? null)
  const [montandoGuia, setMontandoGuia] = useState(false)
  // o guia visto como feed, só com as peças
  const [feedAberto, setFeedAberto] = useState(false)

  const conteudoRef = useRef<HTMLDivElement>(null)
  // o modo de desenvolvimento roda o efeito duas vezes: sem esta trava,
  // cada abertura pagaria duas gerações
  const jaPediu = useRef(false)
  useFontesGoogle(direcoes.map(d => d.fonte))

  // termos em português, do jeito que as referências foram etiquetadas
  const termosDaCampanha = (direcao: DirecaoCriativa) => [
    ...campanha.grupos,
    ...campanha.produtos,
    ...campanha.marcas,
    campanha.objetivo,
    direcao.textura,
    ...direcao.paleta.map(c => c.nome)
  ]

  const gerarDirecoes = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const r = await fetch('/api/marketing/direcoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: campanha.nome,
          objetivo: campanha.objetivo,
          desconto: campanha.desconto.tem
            ? [campanha.desconto.percentual, campanha.desconto.formato].filter(Boolean).join(' ')
            : '',
          periodo: `${campanha.inicio} a ${campanha.fim}`,
          grupos: campanha.grupos,
          produtos: campanha.produtos,
          marcas: campanha.marcas,
          secoes: cadastro.categoriaNomes
        })
      })
      const dados = await r.json()
      if (!r.ok) throw new Error(dados.error ?? 'Não foi possível gerar as direções.')

      const comId: DirecaoCriativa[] = (dados.direcoes ?? []).map((d: DirecaoCriativa) => ({
        ...d,
        id: uid()
      }))
      setDirecoes(comId)
      setCarregando(false)

      // as referências de cada direção chegam depois, sem travar a tela
      comId.forEach(async direcao => {
        const proprias = await buscarNaBiblioteca(termosDaCampanha(direcao), 'cenario', 6)
        setMosaicos(prev => ({ ...prev, [direcao.id]: proprias }))
      })
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.')
      setCarregando(false)
    }
  }, [campanha, cadastro.categoriaNomes])

  useEffect(() => {
    if (somenteLeitura || jaPediu.current) return
    jaPediu.current = true
    void gerarDirecoes()
  }, [somenteLeitura, gerarDirecoes])

  useEffect(() => {
    conteudoRef.current?.scrollTo({ top: 0 })
  }, [escolhida])

  // guias salvos antes guardaram uma foto por material. Ao abrir, o cadastro
  // devolve a galeria para a seção mostrar opções de cada material.
  useEffect(() => {
    if (!somenteLeitura) return
    const guardados = acao?.moodboard?.materiais
    if (!guardados?.length || guardados.some(m => (m.imagens?.length ?? 0) > 1)) return

    let ativo = true
    void buscarMateriais(guardados).then(completos => {
      if (ativo) setMoodboard(prev => (prev ? { ...prev, materiais: completos } : prev))
    })
    return () => { ativo = false }
  }, [somenteLeitura, acao?.moodboard?.materiais])

  const escolher = async (direcao: DirecaoCriativa) => {
    setEscolhida(direcao)
    setMontandoGuia(true)
    const termos = termosDaCampanha(direcao)
    // o simulador mostra quinze quadros, então cada bloco traz folga
    const META = 12

    // tudo sai da biblioteca de referências, sem banco de imagem externo
    const [cenario, pessoas, arte, layout, materiais] = await Promise.all([
      buscarNaBiblioteca(termos, 'cenario', META),
      buscarNaBiblioteca(termos, 'pessoas', META),
      buscarNaBiblioteca(termos, 'arte', META),
      buscarLayout(direcao.layout),
      buscarMateriais(direcao.materiais)
    ])
    setMoodboard({ layout, materiais, cenario, pessoas, arte, videos: [], videosIndisponiveis: true })
    setMontandoGuia(false)
  }

  const salvar = () => {
    if (!escolhida || !moodboard || !aoSalvar) return
    aoSalvar({
      ...campanha,
      id: uid(),
      tipo: 'acao',
      nome: `${campanha.nome} · ${escolhida.nome}`,
      campanhasIds: [campanha.id],
      direcao: escolhida,
      moodboard,
      criadaEm: new Date().toISOString()
    })
  }

  const titulo = somenteLeitura
    ? 'Guia da ação'
    : escolhida ? 'Guia da ação' : 'Direções criativas'

  const guiaPronto = Boolean(escolhida && moodboard && !montandoGuia)

  return (
    /* o guia ocupa a tela inteira: as fotos e o simulador precisam de espaço */
    <div className="fixed inset-0 z-50 flex flex-col bg-white text-left">

      <div className="border-b border-gray-100">
        <div className="mx-auto flex w-full max-w-[1200px] items-center gap-3 px-6 py-3">
          <button
            type="button"
            onClick={aoFechar}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-black"
          >
            <ChevronLeft size={14} />
            Voltar
          </button>

          <span className="min-w-0 flex-1 truncate text-[10px] text-gray-400">{campanha.nome}</span>

          {/* o guia pronto pode ser visto como feed */}
          {escolhida && moodboard && !montandoGuia && (
            <button
              type="button"
              onClick={() => setFeedAberto(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Grid3x3 size={13} />
              Ver no feed
            </button>
          )}
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div
        ref={conteudoRef}
        className={`flex-1 ${guiaPronto ? 'overflow-hidden' : 'overflow-y-auto scrollbar-thin'}`}
      >
        {/* o guia pronto vira apresentação e ocupa a área inteira */}
        {guiaPronto && escolhida && moodboard ? (
          <Moodboard campanha={campanha} direcao={escolhida} dados={moodboard} />
        ) : (
        <div className="mx-auto w-full max-w-[1200px] px-6 pt-5 pb-8">
          <h2 className="text-[26px] leading-tight font-semibold text-black mb-4">{titulo}</h2>

          {erro && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
              <p className="text-xs text-red-700 flex-1">{erro}</p>
              <button
                type="button"
                onClick={gerarDirecoes}
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-red-200 text-red-700 rounded-full hover:bg-red-100 transition-colors"
              >
                <RotateCcw size={12} />
                Tentar de novo
              </button>
            </div>
          )}

          {carregando && !erro && (
            <CriandoAcoes
              titulo="Criando ações"
              passos={[
                'Lendo a campanha, os grupos e as marcas',
                'Montando as paletas e as texturas',
                'Escolhendo a tipografia de cada caminho',
                'Buscando as referências visuais'
              ]}
            />
          )}

          {!carregando && !erro && !escolhida && (
            <>
              <p className="text-xs text-gray-500 mb-5">
                Seis caminhos visuais para esta campanha. Escolha um para abrir o guia completo.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {direcoes.map(direcao => (
                  <CartaoDirecao
                    key={direcao.id}
                    direcao={direcao}
                    mosaico={mosaicos[direcao.id] ?? []}
                    aoEscolher={() => void escolher(direcao)}
                  />
                ))}
              </div>
            </>
          )}

          {escolhida && montandoGuia && (
            <CriandoAcoes
              titulo="Montando o guia"
              passos={[
                'Separando produtos em cenário',
                'Separando produtos em pessoas',
                'Reunindo peças de arte',
                'Buscando referências de vídeo'
              ]}
            />
          )}

        </div>
        )}
      </div>

      {/* o guia já salvo é só leitura: sai pelo Voltar, sem barra de ações */}
      {!somenteLeitura && (
        <div className="border-t border-gray-100">
          <div className="mx-auto flex w-full max-w-[1200px] items-center gap-3 px-6 py-4">
            {escolhida && !montandoGuia && (
              <button
                type="button"
                onClick={() => { setEscolhida(null); setMoodboard(null) }}
                className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft size={14} />
                Outras direções
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={salvar}
              disabled={!escolhida || !moodboard || montandoGuia}
              className="px-5 py-2 text-xs font-medium bg-black hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Salvar ação
            </button>
          </div>
        </div>
      )}

      {feedAberto && escolhida && moodboard && (
        <FeedDaAcao
          nome={acao?.nome ?? `${campanha.nome} · ${escolhida.nome}`}
          empresa={{ nome: cadastro.nome, logo: cadastro.logo }}
          direcao={escolhida}
          dados={moodboard}
          aoFechar={() => setFeedAberto(false)}
        />
      )}
    </div>
  )
}
