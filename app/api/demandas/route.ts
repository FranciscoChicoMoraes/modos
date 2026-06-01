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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, cor } = body

    console.log('POST /api/demandas - recebido:', { nome, cor })

    if (!nome?.trim()) {
      return NextResponse.json(
        { error: 'Nome obrigatório' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('empresas')
      .insert([{ nome: nome.trim(), cor: cor || null }])
      .select()

    if (error) {
      console.error('POST erro Supabase:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('POST sucesso, inserido:', data)
    return NextResponse.json(data?.[0], { status: 201 })
  } catch (error: any) {
    console.error('POST /api/demandas catch:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
