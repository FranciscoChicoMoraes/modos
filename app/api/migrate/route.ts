import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

export async function POST() {
  try {
    console.log('Executando migração...')

    // o RPC exec_sql pode não existir no projeto: a falha dele não interrompe
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE empresas ADD COLUMN IF NOT EXISTS avatar_url TEXT;'
      })
      if (error) console.log('RPC exec_sql indisponível:', error.message)
    } catch (erro) {
      console.log('RPC exec_sql indisponível:', (erro as Error).message)
    }

    // a consulta diz se a coluna já existe
    const { data: check, error: erroDaChecagem } = await supabase
      .from('empresas')
      .select('avatar_url')
      .limit(1)

    if (!erroDaChecagem && check) {
      console.log('Coluna avatar_url confirmada.')
      return NextResponse.json({
        success: true,
        message: 'Coluna avatar_url está pronta!'
      })
    }

    return NextResponse.json({
      success: false,
      message: 'Acesse Supabase Dashboard > SQL Editor e execute: ALTER TABLE empresas ADD COLUMN IF NOT EXISTS avatar_url TEXT;'
    })
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Erro inesperado'
    console.error('Erro na migração:', mensagem)
    return NextResponse.json({ error: mensagem }, { status: 500 })
  }
}
