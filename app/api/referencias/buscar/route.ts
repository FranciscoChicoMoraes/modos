import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { ImagemRef } from '@/lib/marketing/moodboard'

// Busca no acervo próprio, o que a agência cadastrou em /cadastrodereferencias.
// O guia da ação pergunta primeiro aqui e só depois recorre ao banco externo.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Bloco = 'cenario' | 'pessoas' | 'arte'

interface TagReferencia {
  grupo?: string
  campo?: string
  valor?: string
  categoria?: string   // formato antigo, antes dos grupos
}

interface LinhaReferencia {
  id: string
  nome: string
  objetivo?: string | null
  imagens: string[]
  tags: TagReferencia[]
  criado_em: string
}

const semAcento = (t: string) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// pessoas aparecem na foto? o grupo "Pessoas" só existe quando há gente
const temPessoas = (tags: TagReferencia[]) =>
  tags.some(t => {
    const onde = semAcento(t.grupo ?? t.categoria ?? '')
    return onde.includes('pessoas') &&
      !/nenhuma|sem pessoa|nao ha|ninguem/.test(semAcento(t.valor ?? ''))
  })

// cada referência entra em um bloco só, senão a mesma foto volta nos três e
// o layout de feed perde o sentido: peça gráfica é arte, com gente é modelo,
// o resto é produto em cenário
const categoriaDaReferencia = (linha: LinhaReferencia): Bloco => {
  const texto = semAcento([
    linha.nome,
    linha.objetivo ?? '',
    ...linha.tags.map(t => `${t.grupo ?? t.categoria ?? ''} ${t.campo ?? ''} ${t.valor ?? ''}`)
  ].join(' '))

  if (/tipografia|cartaz|banner|convite|arte grafica|peca grafica/.test(texto)) return 'arte'
  return temPessoas(linha.tags) ? 'pessoas' : 'cenario'
}

const pontuar = (linha: LinhaReferencia, termos: string[], bloco: Bloco) => {
  const texto = semAcento([
    linha.nome,
    linha.objetivo ?? '',
    ...linha.tags.map(t => `${t.grupo ?? t.categoria ?? ''} ${t.campo ?? ''} ${t.valor ?? ''}`)
  ].join(' '))

  let pontos = termos.reduce((soma, termo) => {
    const t = semAcento(termo)
    return t.length >= 3 && texto.includes(t) ? soma + 2 : soma
  }, 0)

  // cada bloco do guia prefere um tipo de foto
  const comPessoas = temPessoas(linha.tags)
  if (bloco === 'pessoas') pontos += comPessoas ? 3 : -2
  if (bloco === 'cenario') pontos += comPessoas ? -1 : 2
  if (bloco === 'arte') {
    const grafica = /tipografia|arte|cartaz|banner|convite|texto|composicao/.test(texto)
    pontos += grafica ? 3 : 0
  }

  return pontos
}

export async function POST(req: NextRequest) {
  let termos: string[] = []
  let bloco: Bloco = 'cenario'
  let limite = 9

  try {
    const body = await req.json()
    termos = Array.isArray(body?.termos) ? body.termos.filter(Boolean) : []
    bloco = ['cenario', 'pessoas', 'arte'].includes(body?.bloco) ? body.bloco : 'cenario'
    limite = Number(body?.limite) > 0 ? Number(body.limite) : 9
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('referencias')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(200)

    if (error) {
      // sem a tabela criada, o guia segue com o banco externo
      return NextResponse.json({ imagens: [], indisponivel: true, motivo: error.message })
    }

    const linhas = (data ?? []) as LinhaReferencia[]

    const candidatas = linhas
      .filter(linha => categoriaDaReferencia(linha) === bloco)
      .map(linha => ({ linha, pontos: pontuar(linha, termos, bloco) }))
      .filter(c => c.pontos > 0)
      .sort((a, b) => b.pontos - a.pontos)

    const imagens: ImagemRef[] = []
    for (const { linha } of candidatas) {
      for (const [i, url] of (linha.imagens ?? []).entries()) {
        if (imagens.length >= limite) break
        if (!url) continue
        imagens.push({
          id: `ref-${linha.id}-${i}`,
          url,
          thumb: url,
          autor: linha.nome,
          fonte: 'Biblioteca',
          link: '/cadastrodereferencias'
        })
      }
      if (imagens.length >= limite) break
    }

    return NextResponse.json({ imagens, total: linhas.length })
  } catch (e) {
    console.error('Erro ao buscar referências:', e)
    return NextResponse.json({ imagens: [], indisponivel: true })
  }
}
