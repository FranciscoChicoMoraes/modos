'use client'

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronLeft, Images, Layers, LayoutGrid, List, Pencil, Plus, RotateCcw, Search, Trash2, X } from 'lucide-react'
import { OBJETIVOS } from '@/lib/marketing/campanhas'
import { CadastroLayout, GradeDoLayout } from '@/components/marketing/LayoutsFeed'
import { CadastroMaterial, type Material } from '@/components/marketing/Materiais'
import { type Categoria, type LayoutFeed } from '@/lib/marketing/layoutsFeed'

type GrupoTag = 'Pessoas' | 'Produtos' | 'Cenários'

type Tag = {
  id: string
  grupo: GrupoTag
  campo: string
  valor: string
  hex?: string
  imagemIndex?: number
}

type Referencia = {
  id: string
  nome: string
  objetivo?: string
  resumo?: string
  imagens: string[]
  tags: Tag[]
  criadoEm: string
  excluidaEm?: string
}

type ResultadoAnalise = {
  id: string
  imagem: string
  tags: Tag[]
}

const grupos: GrupoTag[] = ['Pessoas', 'Produtos', 'Cenários']

// na tela, a ordem é outra e Pessoas aparece como Modelos
const GRUPOS_EXIBIDOS: { chave: GrupoTag; rotulo: string }[] = [
  { chave: 'Produtos', rotulo: 'Produtos' },
  { chave: 'Cenários', rotulo: 'Cenários' },
  { chave: 'Pessoas', rotulo: 'Modelos' }
]

const STORAGE_KEY = 'biblioteca-referencias-marketing'
const LIMITE_IMAGENS = 15
const MINIMO_IMAGENS = 6
const LOGIN = { usuario: 'chico', senha: 'chico123' }

const gerarId = () => Math.random().toString(36).slice(2, 10)

// Imagem grande estoura o limite de tamanho da requisição (413), então
// tudo passa por aqui: o arquivo guardado fica em 1600px e a cópia que
// vai para a análise, menor ainda.
const comprimir = (dataUrl: string, maximo: number, qualidade: number): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      let { width: l, height: a } = img
      if (l > maximo || a > maximo) {
        if (l > a) { a = Math.round((a * maximo) / l); l = maximo }
        else { l = Math.round((l * maximo) / a); a = maximo }
      }
      const canvas = document.createElement('canvas')
      canvas.width = l
      canvas.height = a
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(dataUrl)
      ctx.drawImage(img, 0, 0, l, a)
      resolve(canvas.toDataURL('image/jpeg', qualidade))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })

// a análise vai em lotes: 15 imagens de uma vez não cabem na requisição
const TAMANHO_DO_LOTE = 4
const normalizarTexto = (valor: string) => valor.trim().toLowerCase()

const formatarDataHora = (iso: string) => {
  if (!iso) return ''
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return ''
  return data.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const HEX = /^#[0-9a-fA-F]{6}$/

// matiz e luminosidade, para as cores saírem ordenadas em vez de embaralhadas
const matizELuz = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const luz = (max + min) / 2
  if (max === min) return { matiz: 0, luz, cinza: true }

  const d = max - min
  let matiz = 0
  if (max === r) matiz = ((g - b) / d) % 6
  else if (max === g) matiz = (b - r) / d + 2
  else matiz = (r - g) / d + 4
  return { matiz: (matiz * 60 + 360) % 360, luz, cinza: d < 0.08 }
}

// uma cor por hexadecimal, dos cinzas para as cores, em ordem de matiz
const paletaDasTags = (tags: Tag[]) => {
  const porHex = new Map<string, string>()
  tags.forEach(tag => {
    if (tag.hex && HEX.test(tag.hex) && !porHex.has(tag.hex)) {
      porHex.set(tag.hex, tag.valor)
    }
  })

  return [...porHex.entries()]
    .map(([hex, nome]) => ({ hex, nome, ...matizELuz(hex) }))
    .sort((a, b) => {
      if (a.cinza !== b.cinza) return a.cinza ? -1 : 1
      if (a.cinza && b.cinza) return a.luz - b.luz
      return a.matiz - b.matiz || a.luz - b.luz
    })
}

// Nota de curadoria escrita pela IA; enquanto ela não chega, vale a
// descrição montada com as tags.
const releaseDaReferencia = (item: Referencia) => item.resumo?.trim() || resumoDaReferencia(item)

// Release curto da referência, montado com o que a análise viu:
// produto, quem aparece, cenário, material e as cores dominantes.
const resumoDaReferencia = (item: Referencia): string => {
  // descarta repetição e variação do mesmo termo: "Perfume" já cobre
  // "Perfume em formato de granada"
  const parecidos = (a: string, b: string) => {
    const x = a.toLowerCase()
    const y = b.toLowerCase()
    return x === y || x.startsWith(y) || y.startsWith(x)
  }

  const valores = (grupo: GrupoTag, campos: string[], limite: number) => {
    const vistos: string[] = []
    item.tags.forEach(tag => {
      if (tag.grupo !== grupo || !campos.includes(tag.campo)) return
      const valor = tag.valor.trim()
      if (valor && !vistos.some(v => parecidos(v, valor))) vistos.push(valor)
    })
    return vistos.slice(0, limite)
  }

  const juntar = (lista: string[]) =>
    lista.length <= 1
      ? lista.join('')
      : `${lista.slice(0, -1).join(', ')} e ${lista[lista.length - 1]}`

  const produtos = valores('Produtos', ['Produto'], 3)
  const modelos = valores('Pessoas', ['Descrição', 'Pose'], 1)
  const cenarios = valores('Cenários', ['Descrição', 'Composição'], 2)
  const materiais = [...valores('Cenários', ['Material'], 1), ...valores('Produtos', ['Texturas'], 1)]
  // cores diferentes podem ter o mesmo nome: no texto, vale o nome
  const cores: string[] = []
  paletaDasTags(item.tags).forEach(cor => {
    const nome = cor.nome.toLowerCase()
    if (cores.length < 3 && !cores.some(c => parecidos(c, nome))) cores.push(nome)
  })

  const primeira = produtos.length > 0
    ? `${juntar(produtos)}${cenarios.length > 0 ? ` em ${juntar(cenarios).toLowerCase()}` : ''}${modelos.length > 0 ? `, com ${modelos[0].toLowerCase()}` : ''}.`
    : cenarios.length > 0
      ? `Ensaio em ${juntar(cenarios).toLowerCase()}.`
      : ''

  const segunda = [
    cores.length > 0 ? `Paleta em ${juntar(cores)}` : '',
    materiais.length > 0 ? `${cores.length > 0 ? ', com ' : 'Acabamento em '}${juntar(materiais).toLowerCase()}` : ''
  ].join('')

  const texto = [primeira, segunda ? `${segunda}.` : ''].filter(Boolean).join(' ')
  return texto || 'Referência sem descrição, rode a análise para gerar as tags.'
}

// referências antigas vieram no formato plano { categoria, valor }:
// traduz para os grupos novos, para filtro e busca continuarem valendo
const DE_PARA_ANTIGO: Record<string, { grupo: GrupoTag; campo: string }> = {
  'Produtos na imagem': { grupo: 'Produtos', campo: 'Produto' },
  'Cores': { grupo: 'Produtos', campo: 'Cores' },
  'Textura': { grupo: 'Produtos', campo: 'Texturas' },
  'Cenário/Fundo': { grupo: 'Cenários', campo: 'Descrição' },
  'Pessoas': { grupo: 'Pessoas', campo: 'Descrição' },
  'Angulo de camera': { grupo: 'Pessoas', campo: 'Ângulo da foto' }
}

const normalizarReferencia = (item: Referencia & { criado_em?: string; excluida_em?: string }): Referencia => ({
  ...item,
  criadoEm: item.criadoEm ?? item.criado_em ?? '',
  excluidaEm: item.excluidaEm ?? item.excluida_em ?? undefined,
  tags: (item.tags ?? []).map(tag => {
    if (tag.grupo) return tag
    const antigo = (tag as unknown as { categoria?: string }).categoria ?? ''
    const convertido = DE_PARA_ANTIGO[antigo] ?? { grupo: 'Produtos' as GrupoTag, campo: antigo || 'Produto' }
    return { ...tag, grupo: convertido.grupo, campo: convertido.campo }
  })
})

const carregarBibliotecaLocal = (): Referencia[] => {
  if (typeof window === 'undefined') return []
  try {
    const salva = window.localStorage.getItem(STORAGE_KEY)
    if (!salva) return []
    const dados = JSON.parse(salva) as Referencia[]
    return Array.isArray(dados) ? dados.map(normalizarReferencia) : []
  } catch {
    return []
  }
}

const extrairTagsDaResposta = (resultado: unknown): Map<number, Tag[]> => {
  if (!resultado || typeof resultado !== 'object') return new Map()

  const payload = resultado as {
    imagens?: Array<{
      imagemIndex?: number
      tags?: Array<{ grupo?: string; campo?: string; valor?: string; hex?: string }>
    }>
  }

  if (!Array.isArray(payload.imagens)) return new Map()

  const mapa = new Map<number, Tag[]>()

  payload.imagens.forEach((item, index) => {
    if (typeof item?.imagemIndex !== 'number' || !Array.isArray(item.tags)) return

    const tags = item.tags
      .filter((tag): tag is { grupo: string; campo: string; valor: string } =>
        Boolean(tag) && typeof tag.grupo === 'string' &&
        typeof tag.campo === 'string' && typeof tag.valor === 'string')
      .map((tag, tagIndex) => ({
        id: `${tag.grupo}-${tag.campo}-${tagIndex}-${gerarId()}`,
        grupo: tag.grupo as GrupoTag,
        campo: tag.campo,
        valor: tag.valor,
        hex: HEX.test((tag as { hex?: string }).hex ?? '')
          ? ((tag as { hex?: string }).hex as string).toUpperCase()
          : undefined,
        imagemIndex: item.imagemIndex
      }))

    mapa.set(item.imagemIndex, tags)
    mapa.set(index, tags)
  })

  return mapa
}

// tags de uma foto: três colunas, sem rolagem
function TagsDaFoto({ imagem, tags, indice, total, aoFechar }: {
  imagem: string
  tags: Tag[]
  indice: number
  total: number
  aoFechar: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) aoFechar() }}
    >
      <div className="w-full max-w-4xl rounded-xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex items-start justify-between px-6 pt-5 pb-4">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-black">Tags da foto</h3>
            <p className="mt-0.5 text-[10px] text-gray-400">Foto {indice + 1} de {total}</p>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="shrink-0 rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex gap-6 px-6 pb-6">
          <img src={imagem} alt="" className="aspect-[3/4] w-40 shrink-0 rounded-lg object-cover" />

          <div className="grid min-w-0 flex-1 grid-cols-1 gap-6 sm:grid-cols-3">
            {GRUPOS_EXIBIDOS.map(({ chave, rotulo }) => {
              const doGrupo = tags.filter(t => t.grupo === chave)
              return (
                <div key={chave} className="min-w-0">
                  <p className="mb-2 text-sm font-bold text-black">{rotulo}</p>

                  {doGrupo.length === 0 ? (
                    <p className="text-[11px] text-gray-300">Nada identificado</p>
                  ) : (
                    <div className="space-y-2">
                      {doGrupo.map(tag => (
                        <div key={tag.id} className="min-w-0">
                          <p className="text-[10px] uppercase tracking-wider text-gray-400">{tag.campo}</p>
                          <p className="flex items-center gap-1.5 text-xs text-gray-800">
                            {tag.hex && (
                              <span
                                className="h-3 w-3 shrink-0 rounded-full border border-gray-200"
                                style={{ backgroundColor: tag.hex }}
                              />
                            )}
                            <span className="min-w-0 break-words">{tag.valor}</span>
                            {tag.hex && (
                              <span className="font-mono text-[10px] uppercase text-gray-400">{tag.hex}</span>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// editar e excluir, no canto do cartão
function AcoesDoCartao({ item, aoEditar, aoExcluir }: {
  item: Referencia
  aoEditar: (item: Referencia) => void
  aoExcluir: (alvo: { item: Referencia; definitiva: boolean }) => void
}) {
  return (
    <div className="absolute right-3 top-3 z-10 flex gap-1 opacity-0 transition-all group-hover:opacity-100">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); aoEditar(item) }}
        aria-label="Editar"
        title="Editar referência"
        className="rounded bg-white/90 p-1.5 text-gray-400 shadow-sm transition-colors hover:bg-white hover:text-black"
      >
        <Pencil size={13} />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); aoExcluir({ item, definitiva: false }) }}
        aria-label="Excluir"
        className="rounded bg-white/90 p-1.5 text-gray-400 shadow-sm transition-colors hover:bg-white hover:text-red-500"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

// mesmos atalhos do cartão de referência, agora no material
function AcoesDoMaterial({ material, naLista, aoEditar, aoExcluir }: {
  material: Material
  naLista?: boolean
  aoEditar: (material: Material) => void
  aoExcluir: (material: Material) => void
}) {
  const posicao = naLista
    ? 'right-3 top-1/2 -translate-y-1/2'
    : 'right-3 top-3'
  return (
    <div className={`absolute ${posicao} z-10 flex gap-1 opacity-0 transition-all group-hover:opacity-100`}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); aoEditar(material) }}
        aria-label="Editar"
        title="Editar material"
        className="rounded bg-white/90 p-1.5 text-gray-400 shadow-sm transition-colors hover:bg-white hover:text-black"
      >
        <Pencil size={13} />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); aoExcluir(material) }}
        aria-label="Excluir"
        className="rounded bg-white/90 p-1.5 text-gray-400 shadow-sm transition-colors hover:bg-white hover:text-red-500"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

// faixa a partir de hexadecimais soltos, usada nos materiais
function FaixaDeCoresSoltas({ hexes, semMargem }: { hexes: string[]; semMargem?: boolean }) {
  if (hexes.length === 0) return null
  return (
    <div className={`flex h-2 ${semMargem ? 'overflow-hidden rounded-full' : '-mx-4 -mt-3 mb-3'}`}>
      {hexes.map(hex => (
        <span key={hex} className="flex-1" style={{ backgroundColor: hex }} title={hex} />
      ))}
    </div>
  )
}

// faixa com as cores da referência, em ordem de matiz
function FaixaDeCores({ item, semMargem }: { item: Referencia; semMargem?: boolean }) {
  const paleta = paletaDasTags(item.tags)
  if (paleta.length === 0) return null
  return (
    <div className={`flex h-2 ${semMargem ? 'overflow-hidden rounded-full' : '-mx-4 -mt-3 mb-3'}`}>
      {paleta.map(cor => (
        <span
          key={cor.hex}
          className="flex-1"
          style={{ backgroundColor: cor.hex }}
          title={`${cor.nome} ${cor.hex}`}
        />
      ))}
    </div>
  )
}

// etiqueta do cartão, no mesmo desenho das campanhas
function Etiqueta({ children, aoClicar }: { children: React.ReactNode; aoClicar?: () => void }) {
  const classe = 'flex items-center gap-1 max-w-[170px] px-2 py-0.5 text-[10px] rounded-full border border-gray-200 text-gray-500'
  if (!aoClicar) return <span className={classe}>{children}</span>
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); aoClicar() }}
      className={`${classe} hover:border-gray-400 hover:text-gray-700 transition-colors`}
    >
      {children}
    </button>
  )
}

export default function CadastrodereferenciasPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [autenticado, setAutenticado] = useState(false)
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erroLogin, setErroLogin] = useState('')

  const [biblioteca, setBiblioteca] = useState<Referencia[]>(() => carregarBibliotecaLocal())
  const [busca, setBusca] = useState('')
  const [visualizacao, setVisualizacao] = useState<'grade' | 'lista'>('grade')
  // abas da página, no mesmo desenho do workspace de campanhas
  const [aba, setAba] = useState<'referencias' | 'materiais' | 'layouts'>('referencias')

  const [materiais, setMateriais] = useState<Material[]>([])
  const [layouts, setLayouts] = useState<LayoutFeed[]>([])
  const [materiaisNaNuvem, setMateriaisNaNuvem] = useState(true)
  const [layoutsNaNuvem, setLayoutsNaNuvem] = useState(true)

  const [cadastroAbertoDe, setCadastroAbertoDe] = useState<'material' | 'layout' | null>(null)
  const [layoutEmEdicao, setLayoutEmEdicao] = useState<LayoutFeed | null>(null)
  // material aberto só para ver, e a foto cujas tags estão abertas
  const [materialVendo, setMaterialVendo] = useState<Material | null>(null)
  const [materialEmEdicao, setMaterialEmEdicao] = useState<Material | null>(null)
  const [fotoDoMaterial, setFotoDoMaterial] = useState<number | null>(null)

  const [aExcluir, setAExcluir] = useState<
    { tipo: 'material'; item: Material } | { tipo: 'layout'; item: LayoutFeed } | null
  >(null)
  const [buscaAberta, setBuscaAberta] = useState(false)
  const buscaRef = useRef<HTMLInputElement>(null)

  // cadastro
  const [cadastroAberto, setCadastroAberto] = useState(false)
  const [nomeReferencia, setNomeReferencia] = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [imagens, setImagens] = useState<string[]>([])
  const [resultadoAnalise, setResultadoAnalise] = useState<ResultadoAnalise[]>([])
  const [analiseEmAndamento, setAnaliseEmAndamento] = useState(false)
  const [progressoAnalise, setProgressoAnalise] = useState(0)
  const [cadastrando, setCadastrando] = useState(false)
  const [erroCadastro, setErroCadastro] = useState('')
  const [imagemComTags, setImagemComTags] = useState<number | null>(null)
  const [resumo, setResumo] = useState('')
  const [etapaCadastro, setEtapaCadastro] = useState<1 | 2>(1)
  // quando preenchido, a trilha está editando uma referência já cadastrada
  const [editando, setEditando] = useState<Referencia | null>(null)

  // leitura e lixeira
  const [tagsDe, setTagsDe] = useState<Referencia | null>(null)
  // referência aberta só para ver, sem edição
  const [vendo, setVendo] = useState<Referencia | null>(null)
  const [fotoDaVisualizacao, setFotoDaVisualizacao] = useState<number | null>(null)
  const [lixeiraAberta, setLixeiraAberta] = useState(false)
  const [confirmando, setConfirmando] = useState<{ item: Referencia; definitiva: boolean } | null>(null)

  useEffect(() => {
    const carregar = async () => {
      try {
        const resposta = await fetch('/api/referencias')
        if (!resposta.ok) throw new Error('nuvem indisponível')
        const dados = await resposta.json()
        const itens = Array.isArray(dados.itens)
          ? (dados.itens as Referencia[]).map(normalizarReferencia)
          : []
        if (itens.length > 0) setBiblioteca(itens)
      } catch {
        // segue com a cópia local
      }
    }
    void carregar()

    const carregarMateriais = async () => {
      try {
        const r = await fetch('/api/materiais')
        const dados = await r.json()
        if (dados.indisponivel) return setMateriaisNaNuvem(false)
        setMateriais((dados.itens ?? []).map((i: Material & { criado_em?: string }) => ({
          ...i, criadoEm: i.criadoEm ?? i.criado_em ?? ''
        })))
      } catch {
        setMateriaisNaNuvem(false)
      }
    }

    const carregarLayouts = async () => {
      try {
        const r = await fetch('/api/marketing/layouts')
        const dados = await r.json()
        if (dados.indisponivel) return setLayoutsNaNuvem(false)
        setLayouts(dados.layouts ?? [])
      } catch {
        setLayoutsNaNuvem(false)
      }
    }

    void carregarMateriais()
    void carregarLayouts()
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(biblioteca))
    }
  }, [biblioteca])

  const tagsPorImagem = useMemo(() => {
    const mapa = new Map<number, Tag[]>()
    resultadoAnalise.forEach((item, indice) => mapa.set(indice, item.tags))
    return mapa
  }, [resultadoAnalise])

  // cores encontradas na análise, sem repetir hexadecimal
  const paletaDaAnalise = useMemo(
    () => paletaDasTags(resultadoAnalise.flatMap(item => item.tags)),
    [resultadoAnalise]
  )

  const naLixeira = useMemo(
    () => biblioteca.filter(item => Boolean(item.excluidaEm)),
    [biblioteca]
  )

  const visiveis = useMemo(() => {
    const termo = normalizarTexto(busca)
    return biblioteca
      .filter(item => !item.excluidaEm)
      .filter(item => {
        if (!termo) return true
        const campos = [
          item.nome,
          item.objetivo ?? '',
          ...item.tags.map(t => `${t.grupo} ${t.campo} ${t.valor}`)
        ].join(' ')
        return normalizarTexto(campos).includes(termo)
      })
  }, [biblioteca, busca])

  // as cores que a análise achou no material, sem repetir
  const coresDoMaterial = (material: Material) => {
    const vistos: string[] = []
    material.tags.forEach(tag => {
      if (tag.hex && !vistos.includes(tag.hex)) vistos.push(tag.hex)
    })
    return vistos.slice(0, 8)
  }

  const materiaisVisiveis = useMemo(() => {
    const termo = normalizarTexto(busca)
    if (!termo) return materiais
    return materiais.filter(m => normalizarTexto([
      m.nome, m.descricao ?? '', ...m.tags.map(t => `${t.campo} ${t.valor}`)
    ].join(' ')).includes(termo))
  }, [materiais, busca])

  const layoutsVisiveis = useMemo(() => {
    const termo = normalizarTexto(busca)
    if (!termo) return layouts
    return layouts.filter(l =>
      normalizarTexto(`${l.codigo} ${l.nome} ${l.perfil}`).includes(termo))
  }, [layouts, busca])

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const arquivos = Array.from(event.target.files ?? [])
    if (arquivos.length === 0) return

    const restantes = LIMITE_IMAGENS - imagens.length
    const selecionados = arquivos.slice(0, Math.max(0, restantes))

    const leituras = selecionados.map(file => new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(new Error('Erro ao processar imagem'))
      reader.readAsDataURL(file)
    }))

    Promise.all(leituras)
      .then(novas => Promise.all(novas.map(src => comprimir(src, 1600, 0.85))))
      .then(novas => {
        setImagens(prev => [...prev, ...novas].slice(0, LIMITE_IMAGENS))
        setResultadoAnalise([])
      })
      .catch(() => setErroCadastro('Não foi possível carregar todas as imagens.'))

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const analisarReferencias = async () => {
    if (!nomeReferencia.trim()) return setErroCadastro('Dê um nome à referência antes de analisar.')
    if (imagens.length < MINIMO_IMAGENS) {
      return setErroCadastro(`Anexe pelo menos ${MINIMO_IMAGENS} fotos de referência.`)
    }

    setAnaliseEmAndamento(true)
    setProgressoAnalise(0)
    setErroCadastro('')

    try {
      // cópias menores só para a análise; o que fica salvo é o original comprimido
      const previas = await Promise.all(imagens.map(src => comprimir(src, 1000, 0.7)))

      const mapa = new Map<number, Tag[]>()
      for (let inicio = 0; inicio < previas.length; inicio += TAMANHO_DO_LOTE) {
        const lote = previas.slice(inicio, inicio + TAMANHO_DO_LOTE)

        const resposta = await fetch('/api/referencias/analise', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fotos: lote.map(src => ({ src })) })
        })
        const dados = await resposta.json()
        if (!resposta.ok) throw new Error(dados?.error || 'Erro ao analisar as referências com Claude.')

        // o índice volta relativo ao lote: soma o deslocamento
        extrairTagsDaResposta(dados).forEach((tags, indiceNoLote) => {
          mapa.set(inicio + indiceNoLote, tags.map(t => ({ ...t, imagemIndex: inicio + indiceNoLote })))
        })

        setProgressoAnalise(Math.min(inicio + lote.length, previas.length))
      }

      const analise = imagens.map((imagem, indice) => ({
        id: `resultado-${indice}-${gerarId()}`,
        imagem,
        tags: mapa.get(indice) ?? []
      }))

      if (analise.every(item => item.tags.length === 0)) {
        throw new Error('Claude não retornou tags válidas para estas imagens.')
      }

      setResultadoAnalise(analise)
      setImagemComTags(null)
      setEtapaCadastro(2)

      // a nota de curadoria vem de um pedido curto, só com as tags
      void escreverResumo(nomeReferencia.trim(), objetivo, analise.flatMap(i => i.tags))
        .then(texto => { if (texto) setResumo(texto) })
    } catch (error) {
      setErroCadastro(error instanceof Error ? error.message : 'Erro ao analisar as imagens.')
    } finally {
      setAnaliseEmAndamento(false)
    }
  }

  const escreverResumo = async (nome: string, objetivo: string, tags: Tag[]) => {
    try {
      const r = await fetch('/api/referencias/resumo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, objetivo, tags })
      })
      if (!r.ok) return ''
      const dados = await r.json()
      return String(dados.resumo ?? '')
    } catch {
      return ''
    }
  }

  const limparCadastro = () => {
    setImagens([])
    setResultadoAnalise([])
    setNomeReferencia('')
    setObjetivo('')
    setImagemComTags(null)
    setErroCadastro('')
    setResumo('')
    setEtapaCadastro(1)
    setEditando(null)
  }

  const abrirCadastro = () => {
    limparCadastro()
    setCadastroAberto(true)
  }

  // clicar no cartão abre a trilha já preenchida, na etapa do resultado
  // o material reabre no mesmo cadastro, agora preenchido
  const abrirEdicaoDoMaterial = (material: Material) => {
    setMaterialVendo(null)
    setFotoDoMaterial(null)
    setMaterialEmEdicao(material)
    setCadastroAbertoDe('material')
  }

  const abrirEdicao = (item: Referencia) => {
    setEditando(item)
    setNomeReferencia(item.nome)
    setObjetivo(item.objetivo ?? '')
    setResumo(item.resumo ?? '')
    setImagens(item.imagens)
    setResultadoAnalise(item.imagens.map((imagem, indice) => ({
      id: `edicao-${indice}-${gerarId()}`,
      imagem,
      tags: item.tags.filter(t => (t.imagemIndex ?? 0) === indice)
    })))
    setErroCadastro('')
    setImagemComTags(null)
    setEtapaCadastro(2)
    setCadastroAberto(true)
  }

  const salvarEdicao = async () => {
    if (!editando) return
    setCadastrando(true)
    setErroCadastro('')

    const atualizada: Referencia = {
      ...editando,
      nome: nomeReferencia.trim(),
      objetivo: objetivo || undefined,
      resumo: resumo || editando.resumo,
      imagens,
      tags: resultadoAnalise.flatMap(item => item.tags)
    }

    try {
      const envio = await fetch('/api/referencias', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editando.id,
          nome: atualizada.nome,
          objetivo: atualizada.objetivo ?? null,
          resumo: atualizada.resumo ?? null,
          imagens: atualizada.imagens,
          tags: atualizada.tags
        })
      })
      const salvo = await envio.json()
      if (!envio.ok) throw new Error(salvo?.error || 'Falha ao salvar no Supabase.')

      setBiblioteca(prev => prev.map(r => (r.id === editando.id ? atualizada : r)))
      limparCadastro()
      setCadastroAberto(false)
    } catch (erro) {
      setBiblioteca(prev => prev.map(r => (r.id === editando.id ? atualizada : r)))
      setErroCadastro(
        erro instanceof Error
          ? `Alterada só neste navegador: ${erro.message}`
          : 'Alterada só neste navegador.'
      )
    } finally {
      setCadastrando(false)
    }
  }

  const cadastrarReferencias = async () => {
    if (resultadoAnalise.length === 0) return

    setCadastrando(true)
    setErroCadastro('')

    const nova: Referencia = {
      id: gerarId(),
      nome: nomeReferencia.trim(),
      objetivo: objetivo || undefined,
      resumo: resumo || undefined,
      imagens,
      tags: resultadoAnalise.flatMap(item => item.tags),
      criadoEm: new Date().toISOString()
    }

    try {
      const envio = await fetch('/api/referencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nova.nome,
          objetivo: nova.objetivo ?? null,
          resumo: nova.resumo ?? null,
          imagens: nova.imagens,
          tags: nova.tags
        })
      })
      const salvo = await envio.json()
      if (!envio.ok) throw new Error(salvo?.error || 'Falha ao salvar no Supabase.')

      setBiblioteca(prev => [normalizarReferencia({ ...nova, ...salvo.item }), ...prev])
      limparCadastro()
      setCadastroAberto(false)
    } catch (erroEnvio) {
      setBiblioteca(prev => [nova, ...prev])
      setErroCadastro(
        erroEnvio instanceof Error
          ? `Cadastrada só neste navegador: ${erroEnvio.message}`
          : 'Cadastrada só neste navegador.'
      )
    } finally {
      setCadastrando(false)
    }
  }

  const mandarParaLixeira = async (item: Referencia) => {
    const quando = new Date().toISOString()
    setBiblioteca(prev => prev.map(r => (r.id === item.id ? { ...r, excluidaEm: quando } : r)))
    await fetch('/api/referencias', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, excluidaEm: quando })
    }).catch(() => undefined)
  }

  const recuperar = async (item: Referencia) => {
    setBiblioteca(prev => prev.map(r => (r.id === item.id ? { ...r, excluidaEm: undefined } : r)))
    await fetch('/api/referencias', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, excluidaEm: null })
    }).catch(() => undefined)
  }

  const apagarDeVez = async (item: Referencia) => {
    setBiblioteca(prev => prev.filter(r => r.id !== item.id))
    await fetch(`/api/referencias?id=${encodeURIComponent(item.id)}`, { method: 'DELETE' })
      .catch(() => undefined)
  }

  const confirmar = () => {
    if (!confirmando) return
    if (confirmando.definitiva) void apagarDeVez(confirmando.item)
    else void mandarParaLixeira(confirmando.item)
    setConfirmando(null)
  }

  const handleLogin = () => {
    if (usuario === LOGIN.usuario && senha === LOGIN.senha) {
      setAutenticado(true)
      setErroLogin('')
      return
    }
    setErroLogin('Login inválido. Use o usuário e senha do administrador.')
  }

  if (!autenticado) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm rounded-xl border border-gray-200 p-8">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Interno</p>
          <h1 className="mt-2 text-[26px] font-semibold leading-tight text-black">Referências</h1>

          <div className="mt-6 space-y-3">
            <input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLogin() }}
              placeholder="Login"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-black outline-none focus:border-black"
            />
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLogin() }}
              placeholder="Senha"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-black outline-none focus:border-black"
            />

            {erroLogin && <p className="text-[11px] text-red-600">{erroLogin}</p>}

            <button
              type="button"
              onClick={handleLogin}
              className="w-full rounded-lg bg-black px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-gray-800"
            >
              Entrar
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white text-left">
      <div className="mx-auto w-full max-w-6xl px-8 py-10">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Acervo</h1>
        <p className="mt-2 text-sm text-gray-500">
          Referências, materiais e layouts que alimentam os guias das ações.
        </p>

        <div className="mt-10 mb-8 flex items-center gap-2">
          {/* abas, no mesmo desenho do workspace de campanhas */}
          <div className="flex items-center gap-1">
            {([
              { id: 'referencias', nome: 'Referências', icone: Images },
              { id: 'materiais', nome: 'Materiais', icone: Layers },
              { id: 'layouts', nome: 'Layout de feed', icone: LayoutGrid }
            ] as const).map(({ id, nome, icone: Icone }) => (
              <button
                key={id}
                type="button"
                onClick={() => setAba(id)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                  aba === id
                    ? 'border border-gray-200 bg-gray-100 text-gray-900'
                    : 'border border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                <Icone size={14} />
                {nome}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {((aba === 'materiais' && !materiaisNaNuvem) || (aba === 'layouts' && !layoutsNaNuvem)) && (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[10px] text-amber-700">
              Salvo só nesta tela
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              if (aba === 'referencias') return abrirCadastro()
              setLayoutEmEdicao(null)
              setCadastroAbertoDe(aba === 'materiais' ? 'material' : 'layout')
            }}
            className="flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-800"
          >
            <Plus size={14} />
            {aba === 'referencias'
              ? 'Cadastrar referência'
              : aba === 'materiais' ? 'Cadastrar material' : 'Cadastrar layout de feed'}
          </button>

          {/* como a lista aparece: grade ou linhas */}
          <div className="flex items-center rounded-full border border-gray-200 p-0.5">
            <button
              type="button"
              onClick={() => setVisualizacao('grade')}
              aria-label="Exibir em grade"
              title="Exibir em grade"
              className={`rounded-full p-2 transition-colors ${
                visualizacao === 'grade' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <LayoutGrid size={13} />
            </button>
            <button
              type="button"
              onClick={() => setVisualizacao('lista')}
              aria-label="Exibir em lista"
              title="Exibir em lista"
              className={`rounded-full p-2 transition-colors ${
                visualizacao === 'lista' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <List size={13} />
            </button>
          </div>

          {buscaAberta ? (
            <div className="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-2">
              <Search size={14} className="shrink-0 text-gray-400" />
              <input
                ref={buscaRef}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') { setBusca(''); setBuscaAberta(false) } }}
                placeholder={
                  aba === 'referencias' ? 'Buscar por nome ou tag...'
                    : aba === 'materiais' ? 'Buscar material...' : 'Buscar layout...'
                }
                className="w-44 bg-transparent text-xs text-black outline-none placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => { setBusca(''); setBuscaAberta(false) }}
                aria-label="Fechar busca"
                className="shrink-0 text-gray-400 hover:text-black"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => { setBuscaAberta(true); setTimeout(() => buscaRef.current?.focus(), 0) }}
              aria-label="Buscar"
              className="rounded-full border border-gray-200 p-2.5 text-gray-500 transition-colors hover:bg-gray-50"
            >
              <Search size={14} />
            </button>
          )}

          <button
            type="button"
            onClick={() => { setAba('referencias'); setLixeiraAberta(true) }}
            aria-label="Lixeira"
            title={naLixeira.length > 0 ? 'Lixeira com itens' : 'Lixeira vazia'}
            className="rounded-full border border-gray-200 p-2.5 text-gray-500 transition-colors hover:bg-gray-50"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* as referências, em grade ou em lista */}
        {aba === 'referencias' && (visualizacao === 'grade' ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {visiveis.map(item => (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => setVendo(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setVendo(item)
                  }
                }}
                className="group relative cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-100"
              >
                <AcoesDoCartao item={item} aoEditar={abrirEdicao} aoExcluir={setConfirmando} />

                {/* título primeiro, depois as fotos */}
                <p className="mb-3 truncate pr-12 text-sm font-semibold text-gray-900">{item.nome}</p>

                <div className="-mx-4 mb-3 grid grid-cols-3 gap-px bg-gray-100">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <span key={i} className="block aspect-[4/5] overflow-hidden bg-gray-100">
                      {item.imagens[i] && (
                        <img src={item.imagens[i]} alt="" loading="lazy" className="h-full w-full object-cover" />
                      )}
                    </span>
                  ))}
                </div>

                <FaixaDeCores item={item} semMargem />

                {/* curadoria em duas linhas, sem esticar o cartão */}
                <p className="mt-3 text-[11px] leading-relaxed text-gray-600">
                  {releaseDaReferencia(item)}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {item.objetivo && <Etiqueta>{item.objetivo}</Etiqueta>}
                  <Etiqueta aoClicar={() => setTagsDe(item)}>Tags · {item.tags.length}</Etiqueta>
                  <Etiqueta>
                    {item.imagens.length} {item.imagens.length === 1 ? 'foto' : 'fotos'}
                  </Etiqueta>
                </div>

                <p className="mt-2.5 text-[10px] text-gray-400">{formatarDataHora(item.criadoEm)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {visiveis.map(item => (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => setVendo(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setVendo(item)
                  }
                }}
                className="group relative flex cursor-pointer items-center gap-4 rounded-xl border border-gray-200 bg-white p-3 pr-20 transition-colors hover:bg-gray-100"
              >
                <AcoesDoCartao item={item} aoEditar={abrirEdicao} aoExcluir={setConfirmando} />

                <div className="flex shrink-0 gap-px overflow-hidden rounded-lg bg-gray-100">
                  {item.imagens.slice(0, 4).map((img, i) => (
                    <span key={i} className="block h-14 w-11 overflow-hidden bg-gray-100">
                      <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </span>
                  ))}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{item.nome}</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    {[
                      formatarDataHora(item.criadoEm),
                      item.objetivo,
                      `${item.imagens.length} fotos`
                    ].filter(Boolean).join(' · ')}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Etiqueta aoClicar={() => setTagsDe(item)}>Tags · {item.tags.length}</Etiqueta>
                  </div>
                </div>

                {/* a paleta fecha a linha, como um resumo da referência */}
                <div className="hidden w-32 shrink-0 sm:block">
                  <FaixaDeCores item={item} semMargem />
                </div>
              </div>
            ))}
          </div>
        ))}
        {aba === 'referencias' && visiveis.length === 0 && (
          <p className="text-xs text-gray-400">
            {busca ? 'Nenhuma referência encontrada para esta busca.' : 'Nenhuma referência cadastrada ainda.'}
          </p>
        )}

        {/* materiais cadastrados */}
        {aba === 'materiais' && (
          materiaisVisiveis.length === 0 ? (
            <p className="text-xs text-gray-400">
              {busca ? 'Nenhum material encontrado para esta busca.' : 'Nenhum material cadastrado ainda.'}
            </p>
          ) : visualizacao === 'grade' ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {materiaisVisiveis.map(material => (
                <div
                  key={material.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setMaterialVendo(material)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setMaterialVendo(material)
                    }
                  }}
                  className="group relative cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-100"
                >
                  <AcoesDoMaterial
                    material={material}
                    aoEditar={abrirEdicaoDoMaterial}
                    aoExcluir={(alvo) => setAExcluir({ tipo: 'material', item: alvo })}
                  />

                  <p className="mb-3 truncate pr-8 text-sm font-semibold text-gray-900">{material.nome}</p>

                  <div className="-mx-4 mb-3 grid grid-cols-3 gap-px bg-gray-100">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <span key={i} className="block aspect-square overflow-hidden bg-gray-100">
                        {material.imagens[i] && (
                          <img src={material.imagens[i]} alt="" loading="lazy" className="h-full w-full object-cover" />
                        )}
                      </span>
                    ))}
                  </div>

                  <FaixaDeCoresSoltas hexes={coresDoMaterial(material)} />

                  <p className="mt-3 text-[11px] leading-relaxed text-gray-600">{material.descricao}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Etiqueta>{material.tags.length} tags</Etiqueta>
                    <Etiqueta>
                      {material.imagens.length} {material.imagens.length === 1 ? 'foto' : 'fotos'}
                    </Etiqueta>
                  </div>

                  <p className="mt-2.5 text-[10px] text-gray-400">{formatarDataHora(material.criadoEm)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {materiaisVisiveis.map(material => (
                <div
                  key={material.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setMaterialVendo(material)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setMaterialVendo(material)
                    }
                  }}
                  className="group relative flex cursor-pointer items-center gap-4 rounded-xl border border-gray-200 bg-white p-3 pr-14 transition-colors hover:bg-gray-100"
                >
                  <AcoesDoMaterial
                    material={material}
                    naLista
                    aoEditar={abrirEdicaoDoMaterial}
                    aoExcluir={(alvo) => setAExcluir({ tipo: 'material', item: alvo })}
                  />

                  <div className="flex shrink-0 gap-px overflow-hidden rounded-lg bg-gray-100">
                    {material.imagens.slice(0, 4).map((img, i) => (
                      <span key={i} className="block h-14 w-14 overflow-hidden">
                        <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
                      </span>
                    ))}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{material.nome}</p>
                    <p className="mt-0.5 truncate text-[11px] text-gray-500">{material.descricao}</p>
                    <p className="mt-1 text-[10px] text-gray-400">
                      {material.imagens.length} fotos · {material.tags.length} tags ·{' '}
                      {formatarDataHora(material.criadoEm)}
                    </p>
                  </div>

                  <div className="hidden w-28 shrink-0 sm:block">
                    <FaixaDeCoresSoltas hexes={coresDoMaterial(material)} semMargem />
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* layouts de feed cadastrados */}
        {aba === 'layouts' && (
          layoutsVisiveis.length === 0 ? (
            <p className="text-xs text-gray-400">
              {busca ? 'Nenhum layout encontrado para esta busca.' : 'Nenhum layout cadastrado ainda.'}
            </p>
          ) : (
            <div className={visualizacao === 'grade'
              ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
              : 'space-y-2'}>
              {layoutsVisiveis.map(layout => (
                <div
                  key={layout.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => { setLayoutEmEdicao(layout); setCadastroAbertoDe('layout') }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setLayoutEmEdicao(layout)
                      setCadastroAbertoDe('layout')
                    }
                  }}
                  className={`group relative cursor-pointer rounded-xl border border-gray-200 bg-white transition-colors hover:bg-gray-100 ${
                    visualizacao === 'grade' ? 'p-2' : 'flex items-center gap-4 p-3 pr-14'
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setAExcluir({ tipo: 'layout', item: layout }) }}
                    aria-label="Excluir"
                    className={`absolute z-10 rounded bg-white/90 p-1 text-gray-400 opacity-0 shadow-sm transition-all hover:text-red-500 group-hover:opacity-100 ${
                      visualizacao === 'grade' ? 'right-2 top-2' : 'right-3 top-1/2 -translate-y-1/2'
                    }`}
                  >
                    <Trash2 size={11} />
                  </button>

                  <div className={visualizacao === 'grade' ? '' : 'w-20 shrink-0'}>
                    <GradeDoLayout ordem={layout.ordem_visual as Categoria[]} compacto />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="mt-2 truncate text-[11px] font-medium text-black">
                      {layout.codigo} · {layout.nome}
                    </p>
                    <p className="text-[10px] text-gray-400">{layout.perfil}</p>
                    <p className="mt-0.5 text-[10px] text-gray-400">
                      {(['M', 'P', 'A'] as Categoria[])
                        .filter(c => (layout.requisitos[c] ?? 0) > 0)
                        .map(c => `${c} ${layout.requisitos[c]}`)
                        .join(' · ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* pop-up do cadastro, em trilha */}
      {cadastroAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-xl border border-gray-100 bg-white text-left shadow-xl">
            <div className="border-b border-gray-100 px-6 pt-4 pb-3">
              <div className="mb-2 flex items-center justify-end gap-3">
                <span className="text-[10px] text-gray-400">Etapa {etapaCadastro} de 2</span>
                <button
                  type="button"
                  onClick={() => setCadastroAberto(false)}
                  aria-label="Fechar"
                  title="Fechar. O que você preencheu fica salvo."
                  className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex gap-1.5">
                {[1, 2].map(i => (
                  <span
                    key={i}
                    className={`h-[3px] flex-1 rounded-full transition-colors ${
                      i <= etapaCadastro ? 'bg-black' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              {/* caminho da trilha, como no cadastro de campanha */}
              {etapaCadastro === 2 && nomeReferencia.trim() && (
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="shrink-0 text-xs font-medium text-black">{nomeReferencia}</span>
                  {objetivo && <span className="truncate text-[10px] text-gray-400">{objetivo}</span>}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto scrollbar-thin px-6 pt-4 pb-5">
              <h2 className="text-[26px] font-semibold leading-tight text-black">
                {etapaCadastro === 1
                  ? 'Nova referência'
                  : editando ? 'Editar referência' : 'Resultado da análise'}
              </h2>

              {etapaCadastro === 1 && (
              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-gray-500">
                  Nome da campanha <span className="text-red-600">*</span>
                </label>
                <input
                  value={nomeReferencia}
                  onChange={(e) => setNomeReferencia(e.target.value)}
                  placeholder="Ex.: Dia das Mães 2027"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-black outline-none focus:border-black placeholder-gray-400"
                />
              </div>
              )}

              {etapaCadastro === 1 && (
              <div>
                <label className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500">
                  Imagens
                  <span className="normal-case tracking-normal text-gray-400">
                    {imagens.length}/{LIMITE_IMAGENS}
                  </span>
                </label>

                <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 px-4 py-5 text-center transition-colors hover:bg-gray-50">
                  <span className="text-xs font-medium text-gray-700">
                    Clique para anexar de {MINIMO_IMAGENS} a {LIMITE_IMAGENS} imagens
                  </span>
                  <span className="text-[10px] text-gray-400">JPG, PNG, WEBP</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleUpload}
                  />
                </label>

                {imagens.length > 0 && imagens.length < MINIMO_IMAGENS && (
                  <p className="mt-2 text-[11px] text-amber-700">
                    {MINIMO_IMAGENS - imagens.length === 1
                      ? 'Falta 1 foto para o mínimo de 6.'
                      : `Faltam ${MINIMO_IMAGENS - imagens.length} fotos para o mínimo de ${MINIMO_IMAGENS}.`}
                  </p>
                )}

                {imagens.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {imagens.map((imagem, index) => {
                      const tagsDaImagem = tagsPorImagem.get(index) ?? []
                      return (
                        <div key={`${index}-${imagem.slice(-12)}`} className="relative overflow-hidden rounded-lg border border-gray-200">
                          <img src={imagem} alt="" className="aspect-[3/4] w-full object-cover" />

                          <button
                            type="button"
                            onClick={() => setImagens(prev => prev.filter((_, i) => i !== index))}
                            aria-label="Remover imagem"
                            className="absolute right-1.5 top-1.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white transition-colors hover:bg-black"
                          >
                            ×
                          </button>

                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              )}

              {etapaCadastro === 1 && (
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-wider text-gray-500">
                  Objetivo da campanha
                </label>
                <div className="space-y-4">
                  {OBJETIVOS.map(bloco => (
                    <div key={bloco.id}>
                      <p className="mb-2.5 text-sm font-semibold text-gray-900">{bloco.titulo}</p>
                      <div className="flex flex-wrap gap-2">
                        {bloco.itens.map(item => {
                          const ativo = objetivo === item
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => setObjetivo(ativo ? '' : item)}
                              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                                ativo
                                  ? 'border-black bg-black text-white'
                                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {ativo && <Check size={12} />}
                              {item}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {erroCadastro && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                  {erroCadastro}
                </div>
              )}

              {etapaCadastro === 2 && (
                <>
                  <div>
                    <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-gray-500">
                      Nome da referência
                    </label>
                    <input
                      value={nomeReferencia}
                      onChange={(e) => setNomeReferencia(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-black outline-none focus:border-black placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500">
                      Fotos analisadas
                      <span className="normal-case tracking-normal text-gray-400">
                        clique na lupa para ver as tags
                      </span>
                    </label>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {imagens.map((imagem, index) => {
                        const tagsDaImagem = tagsPorImagem.get(index) ?? []
                        return (
                          <div key={`analisada-${index}`} className="relative overflow-hidden rounded-lg border border-gray-200">
                            <img src={imagem} alt="" className="aspect-[3/4] w-full object-cover" />
                            {tagsDaImagem.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setImagemComTags(index)}
                                aria-label="Ver tags da imagem"
                                title="Ver tags desta imagem"
                                className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-black"
                              >
                                <Search size={11} />
                                {tagsDaImagem.length}
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}

              {etapaCadastro === 2 && paletaDaAnalise.length > 0 && (
                <div>
                  <label className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500">
                    Paleta de cores
                    <span className="normal-case tracking-normal text-gray-400">
                      {paletaDaAnalise.length}
                    </span>
                  </label>

                  {/* a faixa mostra a paleta inteira, em ordem de matiz */}
                  <div className="flex h-8 overflow-hidden rounded-lg border border-gray-200">
                    {paletaDaAnalise.map(cor => (
                      <span key={cor.hex} className="flex-1" style={{ backgroundColor: cor.hex }} title={`${cor.nome} ${cor.hex}`} />
                    ))}
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
                    {paletaDaAnalise.map(cor => (
                      <div key={cor.hex} className="flex items-center gap-2 text-xs">
                        <span
                          className="h-4 w-4 shrink-0 rounded border border-gray-200"
                          style={{ backgroundColor: cor.hex }}
                        />
                        <span className="min-w-0 flex-1 truncate text-gray-800">{cor.nome}</span>
                        <span className="shrink-0 font-mono text-[10px] uppercase text-gray-400">{cor.hex}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}


            </div>

            <div className="flex items-center gap-2 border-t border-gray-100 px-6 py-4">
              {etapaCadastro === 2 && !editando && (
                <button
                  type="button"
                  onClick={() => setEtapaCadastro(1)}
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-black"
                >
                  <ChevronLeft size={14} />
                  Voltar
                </button>
              )}

              <div className="flex-1" />

              {etapaCadastro === 1 ? (
                <button
                  type="button"
                  onClick={analisarReferencias}
                  disabled={analiseEmAndamento || imagens.length < MINIMO_IMAGENS || !nomeReferencia.trim()}
                  className="rounded-lg bg-black px-5 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {analiseEmAndamento
                    ? `Analisando ${progressoAnalise}/${imagens.length}...`
                    : 'Analisar referências'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={editando ? salvarEdicao : cadastrarReferencias}
                  disabled={resultadoAnalise.length === 0 || cadastrando || !nomeReferencia.trim()}
                  className="rounded-lg bg-black px-5 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {cadastrando
                    ? 'Salvando...'
                    : editando ? 'Salvar alterações' : 'Cadastrar referências'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* tags de uma imagem, durante o cadastro */}
      {imagemComTags !== null && (
        <TagsDaFoto
          imagem={imagens[imagemComTags]}
          tags={tagsPorImagem.get(imagemComTags) ?? []}
          indice={imagemComTags}
          total={imagens.length}
          aoFechar={() => setImagemComTags(null)}
        />
      )}

      {/* tags de uma referência já cadastrada */}
      {tagsDe && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setTagsDe(null) }}
        >
          <div className="w-full max-w-sm rounded-xl border border-gray-100 bg-white shadow-2xl">
            <div className="flex items-start justify-between px-5 pt-5 pb-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-black">{tagsDe.nome}</h3>
                <p className="mt-0.5 text-[10px] text-gray-400">
                  {tagsDe.tags.length} tags em {tagsDe.imagens.length} fotos
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTagsDe(null)}
                aria-label="Fechar"
                className="shrink-0 rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
              >
                <X size={15} />
              </button>
            </div>

            <div className="max-h-[60vh] space-y-4 overflow-y-auto scrollbar-thin px-5 pb-5">
              {grupos.map(grupo => {
                const doGrupo = tagsDe.tags.filter(t => t.grupo === grupo)
                if (doGrupo.length === 0) return null

                // um campo pode repetir entre as fotos: junta os valores sem duplicar
                const porCampo = new Map<string, string[]>()
                doGrupo.forEach(tag => {
                  const lista = porCampo.get(tag.campo) ?? []
                  if (!lista.includes(tag.valor)) lista.push(tag.valor)
                  porCampo.set(tag.campo, lista)
                })

                return (
                  <div key={grupo}>
                    <p className="mb-2 text-[10px] uppercase tracking-wider text-gray-500">{grupo}</p>
                    <div className="space-y-2">
                      {[...porCampo.entries()].map(([campo, valores]) => (
                        <div key={campo} className="flex gap-2 text-xs">
                          <span className="w-24 shrink-0 text-gray-400">{campo}</span>
                          <span className="text-gray-800">{valores.join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {tagsDe.tags.length === 0 && (
                <p className="text-xs text-gray-400">Esta referência não tem tags.</p>
              )}
            </div>
          </div>
        </div>
      )}


      {cadastroAbertoDe === 'material' && (
        <CadastroMaterial
          material={materialEmEdicao}
          naNuvem={materiaisNaNuvem}
          aoFechar={() => { setCadastroAbertoDe(null); setMaterialEmEdicao(null) }}
          aoSalvar={(material) => setMateriais(prev => prev.some(m => m.id === material.id)
            ? prev.map(m => (m.id === material.id ? material : m))
            : [material, ...prev])}
        />
      )}

      {cadastroAbertoDe === 'layout' && (
        <CadastroLayout
          layout={layoutEmEdicao}
          naNuvem={layoutsNaNuvem}
          aoFechar={() => { setCadastroAbertoDe(null); setLayoutEmEdicao(null) }}
          aoSalvar={async (layout) => {
            setLayouts(prev => prev.some(l => l.id === layout.id)
              ? prev.map(l => (l.id === layout.id ? layout : l))
              : [...prev, layout].sort((a, b) => a.codigo.localeCompare(b.codigo)))
            setCadastroAbertoDe(null)
            setLayoutEmEdicao(null)
            try {
              const r = await fetch('/api/marketing/layouts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ layout })
              })
              setLayoutsNaNuvem(Boolean((await r.json()).ok))
            } catch {
              setLayoutsNaNuvem(false)
            }
          }}
        />
      )}

      {/* referência aberta para ver, sem edição */}
      {vendo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) { setVendo(null); setFotoDaVisualizacao(null) } }}
        >
          <div className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-xl border border-gray-100 bg-white text-left shadow-xl">
            <div className="flex items-center justify-end gap-3 border-b border-gray-100 px-6 pt-4 pb-3">
              <span className="text-[10px] text-gray-400">{formatarDataHora(vendo.criadoEm)}</span>
              <button
                type="button"
                onClick={() => { setVendo(null); setFotoDaVisualizacao(null) }}
                aria-label="Fechar"
                className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto scrollbar-thin px-6 pt-4 pb-6">
              <div>
                <h2 className="text-[26px] font-semibold leading-tight text-black">{vendo.nome}</h2>
                <p className="mt-1 text-[11px] text-gray-500">
                  {[
                    vendo.objetivo,
                    `${vendo.imagens.length} ${vendo.imagens.length === 1 ? 'foto' : 'fotos'}`,
                    `${vendo.tags.length} tags`
                  ].filter(Boolean).join(' · ')}
                </p>
              </div>

              {(() => {
                const paleta = paletaDasTags(vendo.tags)
                if (paleta.length === 0) return null
                return (
                  <div>
                    <p className="mb-2 text-[10px] uppercase tracking-wider text-gray-500">Paleta de cores</p>
                    <div className="flex h-8 overflow-hidden rounded-lg border border-gray-200">
                      {paleta.map(cor => (
                        <span key={cor.hex} className="flex-1" style={{ backgroundColor: cor.hex }} title={`${cor.nome} ${cor.hex}`} />
                      ))}
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
                      {paleta.map(cor => (
                        <div key={cor.hex} className="flex items-center gap-2 text-xs">
                          <span className="h-4 w-4 shrink-0 rounded border border-gray-200" style={{ backgroundColor: cor.hex }} />
                          <span className="min-w-0 flex-1 truncate text-gray-800">{cor.nome}</span>
                          <span className="shrink-0 font-mono text-[10px] uppercase text-gray-400">{cor.hex}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              <div>
                <p className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500">
                  Fotos
                  <span className="normal-case tracking-normal text-gray-400">
                    clique na lupa para ver as tags
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {vendo.imagens.map((imagem, indice) => {
                    const daFoto = vendo.tags.filter(t => (t.imagemIndex ?? 0) === indice)
                    return (
                      <div key={`ver-${indice}`} className="relative overflow-hidden rounded-lg border border-gray-200">
                        <img src={imagem} alt="" loading="lazy" className="aspect-[3/4] w-full object-cover" />
                        {daFoto.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setFotoDaVisualizacao(indice)}
                            aria-label="Ver tags da foto"
                            className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-black"
                          >
                            <Search size={11} />
                            {daFoto.length}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* tags de uma foto, dentro da visualização */}
      {vendo && fotoDaVisualizacao !== null && (
        <TagsDaFoto
          imagem={vendo.imagens[fotoDaVisualizacao]}
          tags={vendo.tags.filter(t => (t.imagemIndex ?? 0) === fotoDaVisualizacao)}
          indice={fotoDaVisualizacao}
          total={vendo.imagens.length}
          aoFechar={() => setFotoDaVisualizacao(null)}
        />
      )}

      {/* lixeira */}
      {lixeiraAberta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setLixeiraAberta(false) }}
        >
          <div className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-xl border border-gray-100 bg-white text-left shadow-xl">
            <div className="flex items-center justify-end gap-3 border-b border-gray-100 px-6 pt-4 pb-3">
              <span className="text-[10px] text-gray-400">
                {naLixeira.length === 0
                  ? 'Lixeira vazia'
                  : `${naLixeira.length} ${naLixeira.length === 1 ? 'item' : 'itens'}`}
              </span>
              <button
                type="button"
                onClick={() => setLixeiraAberta(false)}
                aria-label="Fechar"
                className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin px-6 pt-4 pb-5">
              <h2 className="mb-4 text-[26px] font-semibold leading-tight text-black">Lixeira</h2>

              {naLixeira.length === 0 ? (
                <p className="text-xs text-gray-400">
                  Nada excluído por aqui. O que você apagar fica guardado nesta tela.
                </p>
              ) : (
                <div className="space-y-2">
                  {naLixeira.map(item => (
                    <div key={item.id} className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3">
                      {item.imagens[0] && (
                        <img src={item.imagens[0]} alt="" className="h-8 w-8 shrink-0 rounded object-cover" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-black">{item.nome}</p>
                        <p className="text-[10px] text-gray-400">
                          {item.imagens.length} fotos · excluída em {formatarDataHora(item.excluidaEm ?? '')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void recuperar(item)}
                        className="flex shrink-0 items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-[11px] text-gray-600 transition-colors hover:bg-gray-100"
                      >
                        <RotateCcw size={12} />
                        Recuperar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmando({ item, definitiva: true })}
                        aria-label="Apagar de vez"
                        className="shrink-0 rounded-full p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
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
      )}

      {/* material aberto para ver, com a lupa em cada foto */}
      {materialVendo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) { setMaterialVendo(null); setFotoDoMaterial(null) }
          }}
        >
          <div className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-xl border border-gray-100 bg-white text-left shadow-xl">
            <div className="flex items-center justify-end gap-3 border-b border-gray-100 px-6 pt-4 pb-3">
              <span className="text-[10px] text-gray-400">{formatarDataHora(materialVendo.criadoEm)}</span>
              <button
                type="button"
                onClick={() => { setMaterialVendo(null); setFotoDoMaterial(null) }}
                aria-label="Fechar"
                className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto scrollbar-thin px-6 pt-4 pb-6">
              <div>
                <h2 className="text-[26px] font-semibold leading-tight text-black">{materialVendo.nome}</h2>
                <p className="mt-1 text-[11px] text-gray-500">
                  {materialVendo.imagens.length} {materialVendo.imagens.length === 1 ? 'foto' : 'fotos'} ·{' '}
                  {materialVendo.tags.length} tags
                </p>
                {materialVendo.descricao && (
                  <p className="mt-2 max-w-xl text-xs leading-relaxed text-gray-600">
                    {materialVendo.descricao}
                  </p>
                )}
              </div>

              {coresDoMaterial(materialVendo).length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] uppercase tracking-wider text-gray-500">Cores do material</p>
                  <div className="flex h-8 overflow-hidden rounded-lg border border-gray-200">
                    {coresDoMaterial(materialVendo).map(hex => (
                      <span key={hex} className="flex-1" style={{ backgroundColor: hex }} title={hex} />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500">
                  Fotos
                  <span className="normal-case tracking-normal text-gray-400">
                    clique na lupa para ver as tags
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {materialVendo.imagens.map((imagem, indice) => {
                    const daFoto = materialVendo.tags.filter(t => (t.imagemIndex ?? 0) === indice)
                    return (
                      <div key={`mat-${indice}`} className="relative overflow-hidden rounded-lg border border-gray-200">
                        <img src={imagem} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                        {daFoto.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setFotoDoMaterial(indice)}
                            aria-label="Ver tags da foto"
                            className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-black"
                          >
                            <Search size={11} />
                            {daFoto.length}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* tags de uma foto do material */}
      {materialVendo && fotoDoMaterial !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setFotoDoMaterial(null) }}
        >
          <div className="w-full max-w-lg rounded-xl border border-gray-100 bg-white shadow-2xl">
            <div className="flex items-start justify-between px-6 pt-5 pb-4">
              <div>
                <h3 className="text-sm font-semibold text-black">Tags do material</h3>
                <p className="mt-0.5 text-[10px] text-gray-400">
                  Foto {fotoDoMaterial + 1} de {materialVendo.imagens.length}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFotoDoMaterial(null)}
                aria-label="Fechar"
                className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex gap-5 px-6 pb-6">
              <img
                src={materialVendo.imagens[fotoDoMaterial]}
                alt=""
                className="aspect-square w-32 shrink-0 rounded-lg object-cover"
              />

              <div className="min-w-0 flex-1 space-y-2">
                {['Material', 'Acabamento', 'Cor', 'Trama', 'Aplicação'].map(campo => {
                  const doCampo = materialVendo.tags.filter(
                    t => t.campo === campo && (t.imagemIndex ?? 0) === fotoDoMaterial
                  )
                  if (doCampo.length === 0) return null
                  return (
                    <div key={campo} className="flex gap-2 text-xs">
                      <span className="w-24 shrink-0 text-gray-400">{campo}</span>
                      <span className="flex min-w-0 flex-wrap items-center gap-2 text-gray-800">
                        {doCampo.map(tag => (
                          <span key={tag.id} className="flex items-center gap-1">
                            {tag.hex && (
                              <span
                                className="h-3 w-3 rounded-full border border-gray-200"
                                style={{ backgroundColor: tag.hex }}
                              />
                            )}
                            {tag.valor}
                          </span>
                        ))}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* confirmação de exclusão de material ou layout */}
      {aExcluir && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setAExcluir(null) }}
        >
          <div className="w-full max-w-[360px] rounded-xl border border-gray-100 bg-white shadow-2xl">
            <div className="flex items-start justify-between px-5 pt-5 pb-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-black">
                  {aExcluir.tipo === 'material'
                    ? aExcluir.item.nome
                    : `${aExcluir.item.codigo} · ${aExcluir.item.nome}`}
                </h3>
                <p className="mt-0.5 text-[10px] text-gray-400">
                  Apagar este {aExcluir.tipo === 'material' ? 'material' : 'layout'} de vez? Não dá para voltar atrás.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAExcluir(null)}
                aria-label="Cancelar"
                className="shrink-0 rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
              >
                <X size={15} />
              </button>
            </div>

            <div className="px-5 pb-5">
              <p className="text-[11px] text-gray-500">
                {aExcluir.tipo === 'material'
                  ? 'As fotos saem do Storage e o registro sai do banco.'
                  : 'O layout sai do banco e deixa de aparecer nas sugestões da IA.'}
              </p>
            </div>

            <div className="flex h-14 items-center justify-end gap-2 border-t border-gray-100 px-5">
              <button
                type="button"
                onClick={() => setAExcluir(null)}
                className="rounded-lg px-4 py-2 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-black"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const alvo = aExcluir
                  setAExcluir(null)
                  if (alvo.tipo === 'material') {
                    setMateriais(prev => prev.filter(m => m.id !== alvo.item.id))
                    await fetch(`/api/materiais?id=${encodeURIComponent(alvo.item.id)}`, { method: 'DELETE' })
                      .catch(() => undefined)
                  } else {
                    setLayouts(prev => prev.filter(l => l.id !== alvo.item.id))
                    await fetch(`/api/marketing/layouts?id=${encodeURIComponent(alvo.item.id)}`, { method: 'DELETE' })
                      .catch(() => undefined)
                  }
                }}
                className="rounded-lg bg-red-600 px-5 py-2 text-xs font-medium text-white transition-colors hover:bg-red-700"
              >
                Apagar de vez
              </button>
            </div>
          </div>
        </div>
      )}

      {/* confirmação de exclusão */}
      {confirmando && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmando(null) }}
        >
          <div className="w-full max-w-[360px] rounded-xl border border-gray-100 bg-white shadow-2xl">
            <div className="flex items-start justify-between px-5 pt-5 pb-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-black">{confirmando.item.nome}</h3>
                <p className="mt-0.5 text-[10px] text-gray-400">
                  {confirmando.definitiva
                    ? 'Apagar esta referência de vez? Não dá para voltar atrás.'
                    : 'Tem certeza que deseja excluir esta referência?'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmando(null)}
                aria-label="Cancelar"
                className="shrink-0 rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
              >
                <X size={15} />
              </button>
            </div>

            <div className="px-5 pb-5">
              <p className="text-[11px] text-gray-500">
                {confirmando.definitiva
                  ? 'As fotos saem do Storage e o registro sai do banco.'
                  : 'Ela vai para a lixeira e pode ser recuperada a qualquer momento.'}
              </p>
            </div>

            <div className="flex h-14 items-center justify-end gap-2 border-t border-gray-100 px-5">
              <button
                type="button"
                onClick={() => setConfirmando(null)}
                className="rounded-lg px-4 py-2 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-black"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmar}
                className="rounded-lg bg-red-600 px-5 py-2 text-xs font-medium text-white transition-colors hover:bg-red-700"
              >
                {confirmando.definitiva ? 'Apagar de vez' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
