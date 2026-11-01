import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('API Route Init - URL:', supabaseUrl ? '✓' : '✗', 'Key:', supabaseKey ? '✓' : '✗')

const supabase = createClient(
  supabaseUrl!,
  supabaseKey!
)

export async function GET(req: NextRequest) {
  try {
    console.log('GET /api/demandas - iniciando')

    const { data, error } = await supabase
      .from('empresas')
      .select(`
        *,
        tarefas (
          id,
          descricao,
          data,
          periodo,
          concluida,
          empresa_id
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('GET erro:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('GET sucesso, retornando:', data?.length || 0, 'empresas com tarefas')
    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('GET /api/demandas catch:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// se a coluna claude ainda não existir no banco, refaz a operação sem o campo
const semColunaClaude = (error: { message: string } | null) =>
  error !== null && error.message.includes('claude')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, cor, avatar, instagram, agendamentos, pagina, tiktok, google, claude, loginssenhas } = body

    console.log('POST /api/demandas - recebido:', { nome, cor })

    if (!nome?.trim()) {
      return NextResponse.json(
        { error: 'Nome obrigatório' },
        { status: 400 }
      )
    }

    const payload: Record<string, unknown> = {
      nome: nome.trim(),
      cor: cor || null,
      avatar: avatar || null,
      instagram: instagram || null,
      agendamentos: agendamentos || null,
      pagina: pagina || null,
      tiktok: tiktok || null,
      google: google || null,
      claude: claude || null,
      loginssenhas: loginssenhas || null
    }

    let { data, error } = await supabase
      .from('empresas')
      .insert([payload])
      .select()

    if (semColunaClaude(error)) {
      console.warn('Coluna claude ausente, salvando sem o campo. Rode migrations_claude.sql no Supabase.')
      delete payload.claude
      ;({ data, error } = await supabase.from('empresas').insert([payload]).select())
    }

    if (error) {
      console.error('POST erro Supabase:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('POST sucesso, inserido:', data)

    // Serializar apenas os campos necessários
    const response = data?.[0] ? {
      id: data[0].id,
      nome: data[0].nome,
      cor: data[0].cor,
      instagram: data[0].instagram,
      agendamentos: data[0].agendamentos,
      pagina: data[0].pagina,
      tiktok: data[0].tiktok,
      google: data[0].google,
      claude: data[0].claude ?? null,
      loginssenhas: data[0].loginssenhas,
      created_at: data[0].created_at,
      updated_at: data[0].updated_at
    } : null

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/demandas catch:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, nome, cor, avatar, instagram, agendamentos, pagina, tiktok, google, claude, loginssenhas } = body

    console.log('PATCH /api/demandas - recebido:', { id, nome })

    if (!id || !nome?.trim()) {
      return NextResponse.json(
        { error: 'ID e Nome obrigatórios' },
        { status: 400 }
      )
    }

    // Primeiro verificar se empresa existe
    const { data: empresaExiste } = await supabase
      .from('empresas')
      .select('id')
      .eq('id', id)

    if (!empresaExiste || empresaExiste.length === 0) {
      console.error('Empresa não encontrada:', id)
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      )
    }

    const payload: Record<string, unknown> = {
      nome: nome.trim(),
      cor: cor || null,
      avatar: avatar || null,
      instagram: instagram || null,
      agendamentos: agendamentos || null,
      pagina: pagina || null,
      tiktok: tiktok || null,
      google: google || null,
      claude: claude || null,
      loginssenhas: loginssenhas || null
    }

    let { data, error } = await supabase
      .from('empresas')
      .update(payload)
      .eq('id', id)
      .select()

    if (semColunaClaude(error)) {
      console.warn('Coluna claude ausente, salvando sem o campo. Rode migrations_claude.sql no Supabase.')
      delete payload.claude
      ;({ data, error } = await supabase.from('empresas').update(payload).eq('id', id).select())
    }

    if (error) {
      console.error('PATCH erro Supabase:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('PATCH sucesso, atualizado:', data)

    // Serializar apenas os campos necessários
    const response = data?.[0] ? {
      id: data[0].id,
      nome: data[0].nome,
      cor: data[0].cor,
      instagram: data[0].instagram,
      agendamentos: data[0].agendamentos,
      pagina: data[0].pagina,
      tiktok: data[0].tiktok,
      google: data[0].google,
      claude: data[0].claude ?? null,
      loginssenhas: data[0].loginssenhas,
      created_at: data[0].created_at,
      updated_at: data[0].updated_at
    } : null

    return NextResponse.json(response, { status: 200 })
  } catch (error: any) {
    console.error('PATCH /api/demandas catch:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
