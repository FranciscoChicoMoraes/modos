import { NextRequest, NextResponse } from 'next/server'

// nesta versão do Next os parâmetros da rota chegam como promessa
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    // a gravação no Supabase entra quando as tarefas saírem do rascunho
    console.log('PATCH /api/demandas/tarefas:', id, body)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Falha ao atualizar tarefa' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // a exclusão no Supabase entra quando as tarefas saírem do rascunho
    console.log('DELETE /api/demandas/tarefas:', id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Falha ao deletar tarefa' }, { status: 500 })
  }
}
