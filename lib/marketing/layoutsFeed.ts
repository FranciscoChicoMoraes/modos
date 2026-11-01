// Layouts de feed: a sequência de posts que a IA usa para montar o guia.
// Cada posição é Modelo, Produto ou Arte.

export type Categoria = 'M' | 'P' | 'A'

export const PERFIS = ['Humano', 'Equilibrado', 'Produto', 'Promocional'] as const
export type Perfil = (typeof PERFIS)[number]

export const NOMES_CATEGORIA: Record<Categoria, string> = {
  M: 'Modelo',
  P: 'Produto',
  A: 'Arte'
}

export const COLUNAS = 3

export interface LayoutFeed {
  id: string
  codigo: string
  nome: string
  perfil: Perfil
  colunas: number
  linhas: number
  ordem_visual: Categoria[]
  ordem_publicacao: Categoria[]
  requisitos: Record<Categoria, number>
  criadoEm: string
}

export interface LeituraDaSequencia {
  ok: boolean
  erro?: string
  linhas: Categoria[][]
}

// Aceita maiúscula, minúscula, com espaço, vírgula ou tudo junto (MPP).
// Cada linha do texto é uma linha da grade e precisa ter três itens.
export const lerSequencia = (texto: string): LeituraDaSequencia => {
  const linhasDeTexto = texto
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)

  if (linhasDeTexto.length === 0) {
    return { ok: false, erro: 'Cole a sequência do feed, uma linha por linha da grade.', linhas: [] }
  }

  const linhas: Categoria[][] = []

  for (let i = 0; i < linhasDeTexto.length; i++) {
    const itens = linhasDeTexto[i]
      .toUpperCase()
      .split(/[\s,;]+/)
      .filter(Boolean)
      // "MPP" também vale: quebra a palavra em letras
      .flatMap(parte => (parte.length > 1 ? parte.split('') : [parte]))

    const invalido = itens.find(item => !['M', 'P', 'A'].includes(item))
    if (invalido) {
      return {
        ok: false,
        erro: `Linha ${i + 1}: "${invalido}" não é uma categoria. Use apenas M, P ou A.`,
        linhas: []
      }
    }

    if (itens.length !== COLUNAS) {
      return {
        ok: false,
        erro: `Linha ${i + 1}: tem ${itens.length} ${itens.length === 1 ? 'item' : 'itens'} e precisa ter ${COLUNAS}.`,
        linhas: []
      }
    }

    linhas.push(itens as Categoria[])
  }

  return { ok: true, linhas }
}

export const contar = (ordem: Categoria[]): Record<Categoria, number> => ({
  M: ordem.filter(c => c === 'M').length,
  P: ordem.filter(c => c === 'P').length,
  A: ordem.filter(c => c === 'A').length
})

export const percentual = (quantidade: number, total: number) =>
  total === 0 ? 0 : Math.round((quantidade / total) * 100)

// A grade é lida da esquerda para a direita, de cima para baixo.
// A publicação é o contrário: o primeiro post é o canto inferior direito.
export const ordemDePublicacao = (ordemVisual: Categoria[]): Categoria[] =>
  [...ordemVisual].reverse()

// posição de publicação de cada quadro, na leitura visual
export const numeroDePublicacao = (indiceVisual: number, total: number) =>
  total - indiceVisual

export const montarLayout = (
  dados: { codigo: string; nome: string; perfil: Perfil },
  linhas: Categoria[][]
): Omit<LayoutFeed, 'id' | 'criadoEm'> => {
  const ordemVisual = linhas.flat()
  return {
    codigo: dados.codigo.trim(),
    nome: dados.nome.trim(),
    perfil: dados.perfil,
    colunas: COLUNAS,
    linhas: linhas.length,
    ordem_visual: ordemVisual,
    ordem_publicacao: ordemDePublicacao(ordemVisual),
    requisitos: contar(ordemVisual)
  }
}

// Os dez layouts que já entram cadastrados na primeira abertura.
export const LAYOUTS_INICIAIS: { codigo: string; nome: string; perfil: Perfil; sequencia: string }[] = [
  { codigo: '01', nome: 'Referência', perfil: 'Humano', sequencia: 'P P M\nM M P\nM P M\nP M M' },
  { codigo: '02', nome: 'Mescla equilibrada', perfil: 'Equilibrado', sequencia: 'M P P\nP M M\nM M P\nP P M' },
  { codigo: '03', nome: 'Mescla com arte', perfil: 'Equilibrado', sequencia: 'M P A\nP M P\nA P M\nM M P' },
  { codigo: '04', nome: 'Abertura com arte', perfil: 'Equilibrado', sequencia: 'A M P\nP P M\nM A P\nP M M' },
  { codigo: '05', nome: 'Mescla vitrine', perfil: 'Produto', sequencia: 'P M P\nP P A\nM P P\nP A M' },
  { codigo: '06', nome: 'Mescla humana', perfil: 'Humano', sequencia: 'M M P\nP M M\nM P M\nM M A' },
  { codigo: '07', nome: 'Arte central', perfil: 'Equilibrado', sequencia: 'M P M\nP A P\nM M P\nP P M' },
  { codigo: '08', nome: 'Liquidação', perfil: 'Promocional', sequencia: 'A P M\nP P A\nM A P\nP M P' },
  { codigo: '09', nome: 'Assinatura no topo', perfil: 'Humano', sequencia: 'A P M\nM M P\nP P M\nM P M' },
  { codigo: '10', nome: 'Diagonal solta', perfil: 'Equilibrado', sequencia: 'M P P\nP A M\nM P A\nP M M' }
]
