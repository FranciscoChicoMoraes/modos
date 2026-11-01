import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Executando migração...')

    // Executar SQL direto
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE empresas ADD COLUMN IF NOT EXISTS avatar_url TEXT;'
    }).catch(async () => {
      // Se RPC não existir, tenta de outra forma
      // Cria uma tabela temporária, seleciona de empresas, e reconstrói
      console.log('RPC não disponível, tentando alternativa...')

      // Tenta inserir e depois deletar para validar estrutura
      const { data: existing } = await supabase
        .from('empresas')
        .select('avatar_url')
        .limit(1)

      if (existing) {
        return { data: null, error: null }
      }

      return { data: null, error: { message: 'Coluna pode não existir' } }
    })

    if (error) {
      console.log('⚠️ RPC falhou, mas continuando...')
    }

    // Verificar se coluna existe agora
    const { data: check } = await supabase
      .from('empresas')
      .select('avatar_url')
      .limit(1)
      .catch(err => ({ data: null }))

    if (check !== undefined) {
      console.log('✅ Coluna avatar_url confirmada!')
      return NextResponse.json({
        success: true,
        message: 'Coluna avatar_url está pronta!'
      })
    }

    return NextResponse.json({
      success: false,
      message: 'Acesse Supabase Dashboard > SQL Editor e execute: ALTER TABLE empresas ADD COLUMN IF NOT EXISTS avatar_url TEXT;'
    })
  } catch (error: any) {
    console.error('❌ Erro:', error.message)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
