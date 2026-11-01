import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Campanha } from '@/lib/marketing/campanhas'

// Ações ficam na tabela "acoes", ligadas à campanha que as originou.
// A direção criativa e o moodboard viajam dentro de "dados".

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const semTabela = (mensagem?: string) =>
  Boolean(mensagem && /could not find the table|does not exist/i.test(mensagem))

// a campanha de origem pode ter sido apagada: sem ela, o vínculo fica nulo
const vinculo = async (acao: Campanha) => {
  const id = acao.campanhasIds?.[0]
  if (!id) return null
  const { data } = await supabase.from('campanhas').select('id').eq('id', id).maybeSingle()
  return data?.id ?? null
}

export async function GET() {
  const { data, error } = await supabase
    .from('acoes')
    .select('dados')
    .order('criada_em', { ascending: false })

  if (error) {
    return NextResponse.json(
      { acoes: [], indisponivel: true, motivo: error.message },
      { status: semTabela(error.message) ? 200 : 500 }
    )
  }

  const acoes = (data ?? []).map(l => l.dados as Campanha)
  return NextResponse.json({ acoes })
}

export async function PUT(req: NextRequest) {
  let acao: Campanha
  try {
    acao = (await req.json()).acao
    if (!acao?.id) {
      return NextResponse.json({ error: 'Envie a ação.' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('acoes')
    .upsert({
      id: acao.id,
      campanha_id: await vinculo(acao),
      nome: acao.nome,
      direcao_nome: acao.direcao?.nome ?? null,
      dados: acao,
      atualizada_em: new Date().toISOString()
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

  const { error } = await supabase.from('acoes').delete().eq('id', id)
  if (error) {
    return NextResponse.json(
      { ok: false, indisponivel: semTabela(error.message), motivo: error.message },
      { status: semTabela(error.message) ? 200 : 500 }
    )
  }
  return NextResponse.json({ ok: true })
}
