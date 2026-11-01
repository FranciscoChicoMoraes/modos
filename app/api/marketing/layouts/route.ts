import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  LAYOUTS_INICIAIS, lerSequencia, montarLayout, type LayoutFeed
} from '@/lib/marketing/layoutsFeed'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const semTabela = (mensagem?: string) =>
  Boolean(mensagem && /could not find the table|does not exist/i.test(mensagem))

const daLinha = (linha: Record<string, unknown>): LayoutFeed => ({
  id: String(linha.id),
  codigo: String(linha.codigo),
  nome: String(linha.nome),
  perfil: linha.perfil as LayoutFeed['perfil'],
  colunas: Number(linha.colunas),
  linhas: Number(linha.linhas),
  ordem_visual: linha.ordem_visual as LayoutFeed['ordem_visual'],
  ordem_publicacao: linha.ordem_publicacao as LayoutFeed['ordem_publicacao'],
  requisitos: linha.requisitos as LayoutFeed['requisitos'],
  criadoEm: String(linha.criado_em ?? '')
})

// na primeira abertura, os dez layouts de partida entram sozinhos
const semear = async () => {
  const prontos = LAYOUTS_INICIAIS.flatMap(inicial => {
    const leitura = lerSequencia(inicial.sequencia)
    if (!leitura.ok) return []
    return [{
      id: `inicial-${inicial.codigo}`,
      ...montarLayout(inicial, leitura.linhas),
      criado_em: new Date().toISOString()
    }]
  })

  await supabase.from('layouts_feed').insert(prontos)
}

export async function GET() {
  const buscar = () => supabase
    .from('layouts_feed')
    .select('*')
    .order('codigo', { ascending: true })

  let { data, error } = await buscar()

  if (error) {
    return NextResponse.json(
      { layouts: [], indisponivel: true, motivo: error.message },
      { status: semTabela(error.message) ? 200 : 500 }
    )
  }

  if ((data ?? []).length === 0) {
    await semear()
    ;({ data, error } = await buscar())
  }

  return NextResponse.json({ layouts: (data ?? []).map(daLinha) })
}

export async function PUT(req: NextRequest) {
  let layout: LayoutFeed
  try {
    layout = (await req.json()).layout
    if (!layout?.id || !layout.nome) {
      return NextResponse.json({ error: 'Envie o layout completo.' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  const { error } = await supabase.from('layouts_feed').upsert({
    id: layout.id,
    codigo: layout.codigo,
    nome: layout.nome,
    perfil: layout.perfil,
    colunas: layout.colunas,
    linhas: layout.linhas,
    ordem_visual: layout.ordem_visual,
    ordem_publicacao: layout.ordem_publicacao,
    requisitos: layout.requisitos
  }, { onConflict: 'id' })

  if (error) {
    return NextResponse.json(
      { ok: false, indisponivel: semTabela(error.message), motivo: error.message },
      { status: semTabela(error.message) ? 200 : 500 }
    )
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Informe o id.' }, { status: 400 })

  const { error } = await supabase.from('layouts_feed').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
