'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronRight, X } from 'lucide-react'
import { useFontesGoogle } from '@/hooks/useFontesGoogle'
import { FONTES, montarQuadrosDoFeed, proximaInedita } from '@/lib/marketing/moodboard'
import type {
  CorPaleta, DirecaoCriativa, ImagemRef, MaterialDoGuia,
  Moodboard as MoodboardDados, QuadroFeed
} from '@/lib/marketing/moodboard'
import type { Campanha } from '@/lib/marketing/campanhas'

// O guia é uma apresentação: cada tela é uma página do fashion guide,
// com o ritmo de um editorial de moda.

// texto claro ou escuro conforme a luminância da cor de fundo
const contraste = (hex: string) => {
  const limpo = hex.replace('#', '')
  if (limpo.length < 6) return '#111111'
  const r = parseInt(limpo.slice(0, 2), 16)
  const g = parseInt(limpo.slice(2, 4), 16)
  const b = parseInt(limpo.slice(4, 6), 16)
  const luz = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luz > 0.6 ? '#111111' : '#ffffff'
}

// as três fotos que abrem o guia: alterna modelo e produto, para o
// destaque não ficar só de um tipo
const elegerDestaques = (dados: MoodboardDados) => {
  const destaques: { imagem: ImagemRef; etiqueta: string }[] = []
  const filas: [ImagemRef[], string][] = [
    [[...dados.pessoas], 'Modelo'],
    [[...dados.cenario], 'Produto'],
    [[...dados.arte], 'Arte']
  ]

  const usadas = new Set<string>()

  while (destaques.length < 3 && filas.some(([fila]) => fila.length > 0)) {
    for (const [fila, etiqueta] of filas) {
      if (destaques.length >= 3) break
      const imagem = proximaInedita(fila, usadas)
      if (imagem) {
        usadas.add(imagem.url)
        destaques.push({ imagem, etiqueta })
      }
    }
  }

  return destaques
}

// cabeçalho de página: título grande e a linha de apoio logo abaixo
function Titulo({ titulo, legenda }: {
  titulo: string
  legenda: string
}) {
  return (
    <div className="min-w-0">
      <h3 className="text-[clamp(24px,2.8vw,38px)] font-semibold leading-tight text-black">
        {titulo}
      </h3>
      <p className="mt-2 text-[clamp(13px,1.3vw,18px)] font-normal leading-snug text-black">
        {legenda}
      </p>
    </div>
  )
}

// um dado da capa, em pílula: rótulo pequeno e o número ao lado
function Medida({ rotulo, valor, aoClicar, tinta }: {
  rotulo: string
  valor: string
  // quando clicável, o dado abre a lista completa num pop-up
  aoClicar?: () => void
  tinta: string
}) {
  const [sobre, setSobre] = useState(false)

  const classe = 'flex items-center gap-2 rounded-full border px-4 py-2'
  const estilo = {
    borderColor: `${tinta}33`,
    backgroundColor: `${tinta}${sobre ? '26' : '12'}`,
    color: tinta
  }

  const corpo = (
    <>
      <span className="text-[9px] uppercase tracking-[0.18em] opacity-60">{rotulo}</span>
      <span className="text-sm leading-none">{valor}</span>
    </>
  )

  if (!aoClicar) return <span className={classe} style={estilo}>{corpo}</span>

  // só esta pílula abre algo, então só ela responde ao passar do mouse
  return (
    <button
      type="button"
      onClick={aoClicar}
      onMouseEnter={() => setSobre(true)}
      onMouseLeave={() => setSobre(false)}
      className={`${classe} transition-colors`}
      style={estilo}
    >
      {corpo}
      <ChevronRight size={13} className="opacity-60" />
    </button>
  )
}

// a lista que o dado Produtos abre: grupos, produtos e marcas da campanha
function ListaDeProdutos({ campanha, aoFechar }: {
  campanha: Campanha
  aoFechar: () => void
}) {
  const blocos: { titulo: string; itens: string[] }[] = [
    { titulo: 'Grupos de produtos', itens: campanha.grupos },
    { titulo: 'Produtos', itens: campanha.produtos },
    { titulo: 'Marcas', itens: campanha.marcas }
  ].filter(bloco => bloco.itens.length > 0)

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) aoFechar() }}
    >
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-6 py-4">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-black">Produtos e marcas</h3>
            <p className="mt-0.5 text-[11px] text-gray-400">O que esta campanha cobre.</p>
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

        <div className="space-y-5 overflow-y-auto scrollbar-thin px-6 py-5">
          {blocos.length === 0 ? (
            <p className="text-[11px] text-gray-400">A campanha vale para toda a loja.</p>
          ) : blocos.map(bloco => (
            <div key={bloco.titulo}>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
                {bloco.titulo} · {bloco.itens.length}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {bloco.itens.map(item => (
                  <span
                    key={item}
                    className="rounded-full border border-gray-200 px-2.5 py-1 text-[11px] text-gray-700"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Capa({ campanha, direcao, release, fundo, tinta, foto, fotos, artes, videos, aoVerProdutos }: {
  campanha: Campanha
  direcao: DirecaoCriativa
  release: string
  fundo: string
  tinta: string
  foto?: ImagemRef
  fotos: number
  artes: number
  videos: number
  aoVerProdutos: () => void
}) {
  const nomeDaCampanha = campanha.nome.split(' · ')[0]

  return (
    <div
      className="grid h-full grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]"
      style={{ backgroundColor: fundo, color: tinta }}
    >
      <div className="flex min-h-0 flex-col justify-between p-8 pb-10 sm:p-12 sm:pb-12">
        <p className="text-[10px] uppercase tracking-[0.3em] opacity-60">
          {direcao.nome}
          {direcao.acervo ? ' · do acervo' : ''}
        </p>

        <div className="py-6">
          <h2
            className="text-[clamp(38px,6.5vw,92px)] leading-[0.95]"
            style={{ fontFamily: `'${direcao.fonte}', serif` }}
          >
            {nomeDaCampanha}
          </h2>
          <p className="mt-6 max-w-xl text-sm leading-relaxed opacity-80 sm:text-base">
            {release}
          </p>
        </div>

        <div
          className="flex flex-wrap gap-2 border-t pt-5"
          style={{ borderColor: `${tinta}26` }}
        >
          <Medida
            rotulo="Produtos"
            valor={String(campanha.produtos.length || campanha.grupos.length || 'Toda a loja')}
            aoClicar={aoVerProdutos}
            tinta={tinta}
          />
          <Medida rotulo="Fotos" valor={String(fotos)} tinta={tinta} />
          <Medida rotulo="Vídeos" valor={String(videos)} tinta={tinta} />
          <Medida rotulo="Artes" valor={String(artes)} tinta={tinta} />
        </div>
      </div>

      {/* a foto de abertura sangra até a borda */}
      <div className="relative hidden min-h-0 lg:block">
        {foto ? (
          <img src={foto.thumb || foto.url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full">
            {direcao.paleta.map(cor => (
              <span key={cor.hex} className="flex-1" style={{ backgroundColor: cor.hex }} />
            ))}
          </span>
        )}
      </div>
    </div>
  )
}

function PaginaDestaques({ destaques, fundo, tinta }: {
  destaques: { imagem: ImagemRef; etiqueta: string }[]
  fundo: string
  tinta: string
}) {
  return (
    <div className="flex h-full flex-col p-8 pb-10 sm:p-12 sm:pb-12">
      <Titulo
        titulo="Destaque da campanha"
        legenda="Três fotos de impacto que não podem faltar na grade."
      />

      {destaques.length > 0 ? (
        <div className="mt-8 grid min-h-0 flex-1 grid-cols-3 gap-3 sm:gap-6">
          {destaques.map(({ imagem, etiqueta }, i) => (
            <figure
              key={imagem.id}
              className="group relative h-full overflow-hidden rounded-xl bg-gray-100"
            >
              <img
                src={imagem.thumb || imagem.url}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.07]"
              />
              <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-3 py-2.5 text-[10px] uppercase tracking-[0.2em] text-white">
                <span
                  className="rounded-full px-2 py-0.5"
                  style={{ backgroundColor: fundo, color: tinta }}
                >
                  {etiqueta}
                </span>
                <span className="opacity-80">{String(i + 1).padStart(2, '0')}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="mt-8 text-[11px] text-gray-400">
          O acervo ainda não tem fotos que combinem com esta campanha.
        </p>
      )}
    </div>
  )
}

// faixa de cor em coluna cheia, com o nome escrito sobre a própria cor
function FaixaDeCores({ rotulo, cores, aoCopiar }: {
  rotulo: string
  cores: CorPaleta[]
  aoCopiar: (hex: string) => void
}) {
  return (
    <div className="flex min-h-0 flex-col">
      <p className="text-base font-semibold text-black">{rotulo}</p>
      <div className="mt-3 grid min-h-0 flex-1 gap-1.5" style={{ gridTemplateColumns: `repeat(${cores.length}, minmax(0, 1fr))` }}>
        {cores.map(cor => (
          <div
            key={cor.hex}
            onDoubleClick={() => aoCopiar(cor.hex)}
            title="Dois cliques para copiar o hexadecimal"
            className="flex min-h-0 cursor-pointer select-none flex-col justify-end overflow-hidden rounded-lg p-3 transition-transform duration-300 ease-out hover:scale-[1.03]"
            style={{ backgroundColor: cor.hex, color: contraste(cor.hex) }}
          >
            <p className="truncate text-[11px] leading-tight">{cor.nome}</p>
            <p className="mt-0.5 text-[9px] uppercase tracking-wider opacity-70">{cor.hex}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PaginaCores({ direcao, coresDasArtes, aoCopiar }: {
  direcao: DirecaoCriativa
  coresDasArtes: CorPaleta[]
  aoCopiar: (hex: string) => void
}) {
  return (
    <div className="flex h-full flex-col p-8 pb-10 sm:p-12 sm:pb-12">
      <Titulo
        titulo="Cores da campanha"
        legenda="A paleta da campanha e a paleta pensada para as artes."
      />

      <div className="mt-8 grid min-h-0 flex-1 grid-rows-2 gap-6">
        <FaixaDeCores rotulo="Cores da campanha" cores={direcao.paleta} aoCopiar={aoCopiar} />
        <FaixaDeCores rotulo="Cores ideais para as artes" cores={coresDasArtes} aoCopiar={aoCopiar} />
      </div>
    </div>
  )
}

// ações antigas guardaram uma fonte só: os trios se completam com a lista
const fontesDaDirecao = (direcao: DirecaoCriativa) => {
  const completar = (escolhidas: string[] | undefined, usadas: string[]) => {
    const trio = [...new Set((escolhidas ?? []).filter(f => FONTES.includes(f) && !usadas.includes(f)))].slice(0, 3)
    for (const fonte of FONTES) {
      if (trio.length >= 3) break
      if (!trio.includes(fonte) && !usadas.includes(fonte)) trio.push(fonte)
    }
    return trio
  }

  const titulo = completar([direcao.fonte, ...(direcao.fontesTitulo ?? [])], [])
  return { titulo, texto: completar(direcao.fontesTexto, titulo) }
}

// um A grande na cor das artes, com o nome da fonte embaixo
function AmostraDeFonte({ fonte, letra, cor, aoCopiar }: {
  fonte: string
  letra: string
  cor: CorPaleta
  aoCopiar: (fonte: string) => void
}) {
  return (
    <figure className="flex min-h-0 flex-col">
      <span
        onDoubleClick={() => aoCopiar(fonte)}
        title="Dois cliques para copiar o nome da fonte"
        className="group flex min-h-0 flex-1 cursor-pointer select-none items-center justify-center overflow-hidden rounded-xl"
        style={{ backgroundColor: cor.hex, color: contraste(cor.hex) }}
      >
        <span
          className="text-[clamp(52px,7vw,120px)] leading-none transition-transform duration-300 ease-out group-hover:scale-110"
          style={{ fontFamily: `'${fonte}', serif` }}
        >
          {letra}
        </span>
      </span>
      <figcaption
        className="mt-2.5 shrink-0 truncate text-center text-xs text-black"
        style={{ fontFamily: `'${fonte}', serif` }}
      >
        {fonte}
      </figcaption>
    </figure>
  )
}

function PaginaTipografia({ direcao, coresDasArtes, aoCopiar }: {
  direcao: DirecaoCriativa
  coresDasArtes: CorPaleta[]
  aoCopiar: (fonte: string) => void
}) {
  const grupos = [
    { rotulo: 'Títulos', letra: 'A', fontes: fontesDaDirecao(direcao).titulo },
    { rotulo: 'Subtítulos e textos', letra: 'a', fontes: fontesDaDirecao(direcao).texto }
  ]

  return (
    <div className="flex h-full flex-col p-8 pb-10 sm:p-12 sm:pb-12">
      <Titulo
        titulo="Tipografia"
        legenda="Três fontes para título e três para subtítulo e texto, nas cores das artes."
      />

      <div className="mt-8 grid min-h-0 flex-1 grid-rows-2 gap-6">
        {grupos.map((grupo, i) => (
          <div key={grupo.rotulo} className="flex min-h-0 flex-col">
            <p className="text-base font-semibold text-black">{grupo.rotulo}</p>
            <div className="mt-3 grid min-h-0 flex-1 grid-cols-3 gap-3 sm:gap-4">
              {grupo.fontes.map((fonte, j) => (
                <AmostraDeFonte
                  key={fonte}
                  fonte={fonte}
                  letra={grupo.letra}
                  // cada amostra pega uma cor das artes, sempre com contraste
                  cor={coresDasArtes[(i * 3 + j) % coresDasArtes.length]}
                  aoCopiar={aoCopiar}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// seis fotos no total, divididas entre os materiais escolhidos: um material
// mostra seis opções, dois mostram três de cada, e assim por diante
const FOTOS_DE_MATERIAL = 6

const opcoesPorMaterial = (materiais: MaterialDoGuia[]) => {
  if (materiais.length === 0) return []

  const base = Math.floor(FOTOS_DE_MATERIAL / materiais.length)
  const resto = FOTOS_DE_MATERIAL % materiais.length

  return materiais.map((material, i) => {
    const galeria = material.imagens?.length
      ? material.imagens
      : material.imagem ? [material.imagem] : []
    const quantas = Math.max(base + (i < resto ? 1 : 0), 1)
    return { material, fotos: galeria.slice(0, quantas), quantas }
  })
}

function PaginaMateriais({ materiais, paleta }: {
  materiais: MaterialDoGuia[]
  paleta: CorPaleta[]
}) {
  const grupos = opcoesPorMaterial(materiais)
  const cores = (material: MaterialDoGuia) =>
    material.cores?.length ? material.cores : paleta.map(c => c.hex)

  return (
    <div className="flex h-full flex-col p-8 pb-10 sm:p-12 sm:pb-12">
      <Titulo
        titulo="Materiais da composição do cenário"
        legenda="Opções de cada material escolhido, para comparar possibilidades."
      />

      {grupos.length > 0 ? (
        <div
          className="mt-6 grid min-h-0 flex-1 gap-5"
          style={{ gridTemplateRows: `repeat(${grupos.length}, minmax(0, 1fr))` }}
        >
          {grupos.map(({ material, fotos, quantas }) => (
            <div key={material.nome} className="flex min-h-0 flex-col">
              <p className="shrink-0 text-base font-semibold text-black">
                {material.nome}
                <span className="font-normal text-gray-500"> · {material.uso}</span>
              </p>

              <div
                className="mt-2.5 grid min-h-0 flex-1 gap-3 sm:gap-4"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(quantas, 3)}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${Math.ceil(quantas / 3)}, minmax(0, 1fr))`
                }}
              >
                {Array.from({ length: quantas }).map((_, i) => (
                  <span
                    key={`${material.nome}-${i}`}
                    className="group relative block min-h-0 overflow-hidden rounded-xl bg-gray-100"
                  >
                    {fotos[i] ? (
                      <img
                        src={fotos[i]}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.07]"
                      />
                    ) : (
                      // sem foto suficiente no cadastro, entra a cor do material
                      <span className="flex h-full w-full">
                        {cores(material).map(hex => (
                          <span key={hex} className="flex-1" style={{ backgroundColor: hex }} />
                        ))}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-8 text-[11px] text-gray-400">Nenhum material sugerido para esta direção.</p>
      )}
    </div>
  )
}

// quatro por linha, em retrato e no tamanho de leitura. A seção cresce com a
// grade e quem rola é o guia, como nas demais.
const QUADROS_DO_MOODBOARD = 16

function PaginaMoodboard({ quadros }: { quadros: QuadroFeed[] }) {
  return (
    <div className="flex min-h-full flex-col px-6 pb-8 pt-4 sm:px-8 sm:pt-5">
      <div className="pb-5">
        <Titulo
          titulo="Moodboard"
          legenda="Referências na ordem do layout de feed escolhido."
        />
      </div>

      {quadros.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {quadros.map(quadro => (
            <span
              key={quadro.chave}
              className="relative block aspect-[4/5] overflow-hidden rounded-xl bg-gray-100"
            >
              <img src={quadro.url} alt="" loading="lazy" className="h-full w-full object-cover" />
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-8 text-[11px] text-gray-400">
          Sem peças no acervo para montar o moodboard desta campanha.
        </p>
      )}
    </div>
  )
}

export function Moodboard({ campanha, direcao, dados }: {
  campanha: Campanha
  direcao: DirecaoCriativa
  dados: MoodboardDados
}) {
  const fontes = fontesDaDirecao(direcao)
  useFontesGoogle([direcao.fonte, ...fontes.titulo, ...fontes.texto])

  const [listaAberta, setListaAberta] = useState(false)
  // aviso curto que aparece ao copiar uma cor ou o nome de uma fonte
  const [aviso, setAviso] = useState<{ texto: string; cor?: string } | null>(null)
  const trilhoRef = useRef<HTMLDivElement>(null)
  const avisoRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const copiar = async (valor: string, texto: string, cor?: string) => {
    try {
      await navigator.clipboard.writeText(valor)
    } catch {
      // navegador sem permissão de área de transferência: copia pelo caminho antigo
      const campo = document.createElement('textarea')
      campo.value = valor
      campo.style.position = 'fixed'
      campo.style.opacity = '0'
      document.body.appendChild(campo)
      campo.select()
      document.execCommand('copy')
      campo.remove()
    }

    setAviso({ texto, cor })
    if (avisoRef.current) clearTimeout(avisoRef.current)
    avisoRef.current = setTimeout(() => setAviso(null), 1600)
  }

  const copiarCor = (hex: string) => copiar(hex, 'Cor copiada', hex)
  const copiarFonte = (fonte: string) => copiar(fonte, 'Fonte copiada')

  useEffect(() => () => { if (avisoRef.current) clearTimeout(avisoRef.current) }, [])

  const fundo = direcao.paleta[0]?.hex ?? '#111111'
  const tinta = contraste(fundo)

  const release = direcao.release?.trim() || direcao.descricao
  const destaques = elegerDestaques(dados)
  const coresDasArtes = direcao.paletaArtes?.length ? direcao.paletaArtes : direcao.paleta.slice(0, 3)
  const materiais = (dados.materiais?.length ? dados.materiais : direcao.materiais ?? []).slice(0, 3)
  const quadrosDoMoodboard = montarQuadrosDoFeed(dados, QUADROS_DO_MOODBOARD)

  const paginas = [
    {
      nome: 'Capa',
      conteudo: (
        <Capa
          campanha={campanha}
          direcao={direcao}
          release={release}
          fundo={fundo}
          tinta={tinta}
          foto={destaques[0]?.imagem}
          fotos={dados.cenario.length + dados.pessoas.length}
          artes={dados.arte.length}
          videos={dados.videos.length}
          aoVerProdutos={() => setListaAberta(true)}
        />
      )
    },
    {
      nome: 'Cores',
      conteudo: (
        <PaginaCores direcao={direcao} coresDasArtes={coresDasArtes} aoCopiar={copiarCor} />
      )
    },
    { nome: 'Materiais', conteudo: <PaginaMateriais materiais={materiais} paleta={direcao.paleta} /> },
    {
      nome: 'Tipografia',
      conteudo: (
        <PaginaTipografia direcao={direcao} coresDasArtes={coresDasArtes} aoCopiar={copiarFonte} />
      )
    },
    { nome: 'Destaque', conteudo: <PaginaDestaques destaques={destaques} fundo={fundo} tinta={tinta} /> },
    { nome: 'Moodboard', alta: true, conteudo: <PaginaMoodboard quadros={quadrosDoMoodboard} /> }
  ]

  // o guia rola como qualquer página: o teclado age na própria área de rolagem
  useEffect(() => {
    trilhoRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      <div
        ref={trilhoRef}
        tabIndex={-1}
        className="h-full w-full overflow-y-auto overscroll-contain scrollbar-fina focus:outline-none"
      >
        {paginas.map(p => (
          <section key={p.nome} className={`w-full ${p.alta ? 'min-h-full' : 'h-full'}`}>
            {p.conteudo}
          </section>
        ))}
      </div>

      {aviso && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black px-4 py-2 text-[11px] text-white shadow-lg">
          {aviso.cor && (
            <span className="h-3 w-3 rounded-full border border-white/30" style={{ backgroundColor: aviso.cor }} />
          )}
          {aviso.texto}
          {aviso.cor && <span className="uppercase opacity-60">{aviso.cor}</span>}
        </div>
      )}

      {listaAberta && (
        <ListaDeProdutos campanha={campanha} aoFechar={() => setListaAberta(false)} />
      )}
    </div>
  )
}
