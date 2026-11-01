import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = 'feed'

// Sobe uma imagem do feed e devolve a URL pública.
// O upload passa pelo servidor para não esbarrar nas regras do Storage.
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const file = form.get('file')
    const id = form.get('id')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Envie um arquivo de imagem' }, { status: 400 })
    }

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const nome = `${typeof id === 'string' && id ? id : Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(nome, file, { contentType: file.type, upsert: true })

    if (error) {
      console.error('Erro ao subir imagem do feed:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(nome)
    return NextResponse.json({ url: data.publicUrl })
  } catch (error: any) {
    console.error('POST /api/feed/imagens:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Remove do Storage a imagem de uma publicação apagada
export async function DELETE(request: NextRequest) {
  try {
    const { urls } = await request.json()
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ ok: true })
    }
    const caminhos = urls
      .map((u: string) => u.split(`/${BUCKET}/`)[1])
      .filter(Boolean)

    if (caminhos.length > 0) {
      const { error } = await supabase.storage.from(BUCKET).remove(caminhos)
      if (error) console.error('Erro ao remover imagens:', error)
    }
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('DELETE /api/feed/imagens:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
