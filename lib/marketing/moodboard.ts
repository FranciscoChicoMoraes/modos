// Direção criativa e moodboard de uma ação: o que a IA propõe e as
// imagens de referência que ilustram cada bloco do fashion guide.

export interface CorPaleta {
  hex: string
  nome: string
}

export interface ConsultasDirecao {
  mosaico: string[]
  cenario: string[]
  pessoas: string[]
  arte: string[]
  videos: string[]
}

// material que compõe o cenário da campanha: o nome vem do cadastro
// de materiais e o uso explica onde ele entra na composição
export interface MaterialSugerido {
  nome: string
  uso: string
}

// o mesmo material depois de casado com o acervo, já com foto e cores
export interface MaterialDoGuia extends MaterialSugerido {
  id?: string
  imagem?: string
  // fotos do cadastro, para o guia mostrar opções do mesmo material
  imagens?: string[]
  cores?: string[]
}

export interface DirecaoCriativa {
  id: string
  nome: string
  descricao: string
  // release da campanha, até duas linhas, no tom da direção
  release?: string
  paleta: CorPaleta[]
  // cores pensadas para as artes: fundo, texto e realce
  paletaArtes?: CorPaleta[]
  // de três a cinco materiais para a composição do cenário
  materiais?: MaterialSugerido[]
  textura: string
  texturaDescricao: string
  fonte: string        // nome exato de uma fonte do Google Fonts
  fonteUso: string
  // três opções para título e três para subtítulo e texto corrido
  fontesTitulo?: string[]
  fontesTexto?: string[]
  // a direção nasceu do acervo de referências da agência?
  acervo?: boolean
  apoio?: string
  // código do layout de feed escolhido entre os cadastrados
  layout?: string
  layoutMotivo?: string
  consultas: ConsultasDirecao
}

export interface ImagemRef {
  id: string
  url: string
  thumb: string
  autor: string
  fonte: string        // origem da peça: sempre a biblioteca de referências
  link: string         // página original, para crédito
  largura?: number
  altura?: number
}

export interface VideoRef extends ImagemRef {
  video: string        // arquivo mp4 para pré-visualização
  duracao?: number
}

import type { Categoria, LayoutFeed } from '@/lib/marketing/layoutsFeed'

export interface Moodboard {
  // o layout escolhido viaja junto, para o guia e o feed não dependerem de busca
  layout?: LayoutFeed
  // materiais do cenário já casados com o cadastro de materiais
  materiais?: MaterialDoGuia[]
  cenario: ImagemRef[]
  pessoas: ImagemRef[]
  arte: ImagemRef[]
  videos: VideoRef[]
  // quando não há provedor de vídeo configurado, ficam os roteiros
  videosIndisponiveis?: boolean
}

// toda exibição de feed mostra a mesma quantidade de quadros, na mesma
// ordem do layout escolhido pela direção
export const QUADROS_DO_FEED = 15

// a capa do cartão mostra só o começo desse mesmo feed
export const QUADROS_DA_CAPA = 9

export interface QuadroFeed {
  url: string
  chave: string
  categoria: Categoria
}

// os blocos do acervo podem devolver a mesma foto: enquanto houver peça
// nova, ela vem antes de repetir
export const proximaInedita = (fila: ImagemRef[], usadas: Set<string>) => {
  while (fila.length > 0) {
    const img = fila.shift()
    if (img && !usadas.has(img.url)) return img
  }
  return undefined
}

// distribui as peças nas posições do layout, repetindo só quando solicitado.
export const montarQuadrosDoFeed = (
  dados: Moodboard,
  total: number,
  permitirRepeticao = true
): QuadroFeed[] => {
  const todas = [...dados.pessoas, ...dados.cenario, ...dados.arte]
  if (todas.length === 0) return []

  const filas: Record<Categoria, ImagemRef[]> = {
    M: [...dados.pessoas],
    P: [...dados.cenario],
    A: [...dados.arte]
  }

  // a mesma foto pode ter entrado em mais de um bloco da busca. A posição do
  // layout fica com quem é só dela, para a grade mostrar o que o layout pede.
  const emOutras = (categoria: Categoria, url: string) =>
    (['M', 'P', 'A'] as Categoria[])
      .filter(outra => outra !== categoria)
      .some(outra => filas[outra].some(img => img.url === url))

  const exclusivaDaCategoria = (categoria: Categoria, usadas: Set<string>) => {
    const fila = filas[categoria] ?? []
    const indice = fila.findIndex(img => !usadas.has(img.url) && !emOutras(categoria, img.url))
    return indice >= 0 ? fila.splice(indice, 1)[0] : undefined
  }

  const ordem = dados.layout?.ordem_visual ?? []
  const alternada: Categoria[] = ['P', 'M', 'A']
  const usadas = new Set<string>()
  const sobra = [...todas]
  const quadros: (QuadroFeed | undefined)[] = new Array(total)
  let rodizio = 0

  // o feed enche de baixo para cima: a primeira peça publicada ocupa a última
  // posição da grade, e as seguintes sobem. A grade sai na ordem visual.
  for (let publicacao = 0; publicacao < total; publicacao++) {
    const posicao = total - 1 - publicacao
    const categoria = ordem.length > 0 ? ordem[posicao % ordem.length] : alternada[posicao % 3]
    const img =
      exclusivaDaCategoria(categoria, usadas) ??
      proximaInedita(filas[categoria] ?? [], usadas) ??
      proximaInedita(sobra, usadas) ??
      (permitirRepeticao ? todas[rodizio++ % todas.length] : undefined)

    if (!img) continue
    usadas.add(img.url)
    quadros[posicao] = {
      url: img.thumb || img.url,
      chave: `${categoria}-${posicao}-${img.id}`,
      categoria
    }
  }

  return quadros.filter((quadro): quadro is QuadroFeed => Boolean(quadro))
}

// fontes liberadas para a IA escolher: todas existem no Google Fonts,
// então dá para carregar a prévia sem surpresa
export const FONTES = [
  'Playfair Display', 'Cormorant Garamond', 'DM Serif Display', 'Libre Baskerville',
  'Marcellus', 'Italiana', 'Tenor Sans', 'Fraunces', 'Syne', 'Space Grotesk',
  'Bebas Neue', 'Oswald', 'Josefin Sans', 'Jost', 'Outfit', 'Manrope',
  'Archivo', 'Inter'
]

export const urlGoogleFonts = (fontes: string[]) => {
  const familias = [...new Set(fontes)]
    .filter(f => FONTES.includes(f))
    .map(f => `family=${f.replace(/ /g, '+')}:wght@400;600;700`)
  if (familias.length === 0) return null
  return `https://fonts.googleapis.com/css2?${familias.join('&')}&display=swap`
}
