import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Campanha } from '@/lib/marketing/campanhas'

// Campanhas ficam na tabela "campanhas"; as ações têm rota própria.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// enquanto a migração não roda, o app segue com o armazenamento local
const semTabela = (mensagem?: string) =>
  Boolean(mensagem && /could not find the table|does not exist/i.test(mensagem))

const paraLinha = (campanha: Campanha) => ({
  id: campanha.id,
  nome: campanha.nome,
  objetivo: campanha.objetivo,
  inicio: campanha.inicio || null,
  fim: campanha.fim || null,
  dados: campanha,
  atualizada_em: new Date().toISOString()
})

export async function GET() {
  const { data, error } = await supabase
    .from('campanhas')
    .select('dados')
    .order('criada_em', { ascending: false })

  if (error) {
    return NextResponse.json(
      { campanhas: [], indisponivel: true, motivo: error.message },
      { status: semTabela(error.message) ? 200 : 500 }
    )
  }

  const campanhas = (data ?? []).map(l => l.dados as Campanha)
  return NextResponse.json({ campanhas })
}

export async function PUT(req: NextRequest) {
  let campanha: Campanha
  try {
    campanha = (await req.json()).campanha
    if (!campanha?.id) {
      return NextResponse.json({ error: 'Envie a campanha.' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('campanhas')
    .upsert(paraLinha(campanha), { onConflict: 'id' })

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

  const { error } = await supabase.from('campanhas').delete().eq('id', id)
  if (error) {
    return NextResponse.json(
      { ok: false, indisponivel: semTabela(error.message), motivo: error.message },
      { status: semTabela(error.message) ? 200 : 500 }
    )
  }
  return NextResponse.json({ ok: true })
}
