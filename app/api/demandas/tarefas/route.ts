import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { empresa_id, descricao, data, periodo } = await request.json()

    console.log('POST /api/demandas/tarefas - recebido:', { empresa_id, descricao, data, periodo })

    if (!descricao?.trim() || !data || !periodo) {
      console.log('POST - campos faltando')
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      )
    }

    const { data: tarefa, error } = await supabase
      .from('tarefas')
      .insert([{
        empresa_id,
        descricao: descricao.trim(),
        data,
        periodo,
        concluida: false
      }])
      .select()

    console.log('POST - resposta Supabase:', { tarefa, error })

    if (error) {
      console.error('POST - erro Supabase:', error)
      throw error
    }

    console.log('POST - sucesso:', tarefa?.[0])
    return NextResponse.json(tarefa?.[0], { status: 201 })
  } catch (error: any) {
    console.error('POST /api/demandas/tarefas - erro:', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Falha ao criar tarefa' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, descricao, data, periodo, concluida } = await request.json()

    const updateData: any = {}
    if (descricao !== undefined) updateData.descricao = descricao
    if (data !== undefined) updateData.data = data
    if (periodo !== undefined) updateData.periodo = periodo
    if (concluida !== undefined) updateData.concluida = concluida

    const { data: tarefa, error } = await supabase
      .from('tarefas')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) throw error
    return NextResponse.json(tarefa[0])
  } catch (error) {
    console.error('PATCH /api/demandas/tarefas:', error)
    return NextResponse.json({ error: 'Falha ao atualizar tarefa' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    const { error } = await supabase
      .from('tarefas')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/demandas/tarefas:', error)
    return NextResponse.json({ error: 'Falha ao deletar tarefa' }, { status: 500 })
  }
}
