import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('Limpando banco de dados...')

    // Deleta tarefas primeiro
    const { error: tarefasError } = await supabase
      .from('tarefas')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000')

    if (tarefasError) throw tarefasError
    console.log('✓ Tarefas deletadas')

    // Deleta empresas
    const { error: empresasError } = await supabase
      .from('empresas')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000')

    if (empresasError) throw empresasError
    console.log('✓ Empresas deletadas')

    return NextResponse.json({ success: true, message: 'Banco limpo com sucesso' })
  } catch (error: any) {
    console.error('Erro ao limpar:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
