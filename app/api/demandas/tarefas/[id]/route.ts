import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    // In production, update in Supabase
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Falha ao atualizar tarefa' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    // In production, delete from Supabase
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Falha ao deletar tarefa' }, { status: 500 })
  }
}
