import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// service_role: o upload roda no servidor e não esbarra nas regras de
// segurança do Storage, como acontecia ao enviar direto do navegador
const supabase = createClient(supabaseUrl!, supabaseKey!)

const BUCKET = 'avatares'

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const file = form.get('file')
    const empresaId = form.get('empresaId')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
    }
    if (typeof empresaId !== 'string' || !empresaId) {
      return NextResponse.json({ error: 'Empresa não informada' }, { status: 400 })
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Envie um arquivo de imagem' }, { status: 400 })
    }

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const nomeArquivo = `${empresaId}-${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(nomeArquivo, file, { contentType: file.type, upsert: true })

    if (error) {
      console.error('Erro ao subir avatar:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(nomeArquivo)
    return NextResponse.json({ url: data.publicUrl })
  } catch (error: any) {
    console.error('POST /api/demandas/avatar:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
