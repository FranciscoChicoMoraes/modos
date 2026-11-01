import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl!, supabaseKey!)

const BUCKET = 'referencias'

const parseDataUrl = (dataUrl: string) => {
  const [header, payload] = dataUrl.split(',')
  if (!payload || !header) return null

  const mimeMatch = header.match(/data:(image\/[a-zA-Z0-9.+-]+);base64/)
  const mimeType = mimeMatch?.[1] ?? 'image/jpeg'

  const binary = Buffer.from(payload, 'base64')
  return { mimeType, binary }
}

const ensureBucket = async () => {
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.some(bucket => bucket.name === BUCKET)

  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 15 * 1024 * 1024
    })

    if (error) {
      throw new Error(error.message)
    }
  }
}

const uploadImageToSupabase = async (dataUrl: string, index: number) => {
  const parsed = parseDataUrl(dataUrl)
  if (!parsed) return null

  const ext = parsed.mimeType.includes('png') ? 'png' : parsed.mimeType.includes('webp') ? 'webp' : 'jpg'
  const fileName = `referencias/${Date.now()}-${index}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, parsed.binary, {
      contentType: parsed.mimeType,
      upsert: true
    })

  if (error) {
    throw new Error(error.message)
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
  return data.publicUrl
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('referencias')
      .select('*')
      .order('criado_em', { ascending: false })

    if (error) {
      return NextResponse.json({ itens: [], error: error.message }, { status: 500 })
    }

    return NextResponse.json({ itens: data ?? [] })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao listar referências.'
    console.error('Erro ao listar referências:', message)
    return NextResponse.json({ itens: [], error: message }, { status: 500 })
  }
}

// edita a referência, ou manda para a lixeira e traz de volta
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const id = String(body?.id ?? '')
    if (!id) return NextResponse.json({ error: 'Informe o id.' }, { status: 400 })

    const mudancas: Record<string, unknown> = {}

    if ('excluidaEm' in body) {
      mudancas.excluida_em = body.excluidaEm ? String(body.excluidaEm) : null
    }
    if (typeof body?.nome === 'string' && body.nome.trim()) {
      mudancas.nome = body.nome.trim()
    }
    if ('objetivo' in body) {
      mudancas.objetivo = body.objetivo ? String(body.objetivo) : null
    }
    if (Array.isArray(body?.tags)) {
      mudancas.tags = body.tags
    }
    if ('resumo' in body) {
      mudancas.resumo = body.resumo ? String(body.resumo) : null
    }
    // imagem nova chega em base64: sobe para o Storage e guarda a URL
    if (Array.isArray(body?.imagens)) {
      await ensureBucket()
      mudancas.imagens = await Promise.all(
        body.imagens.map(async (img: string, i: number) =>
          String(img).startsWith('data:') ? (await uploadImageToSupabase(String(img), i)) ?? img : img
        )
      )
    }

    if (Object.keys(mudancas).length === 0) {
      return NextResponse.json({ ok: true })
    }

    const { error } = await supabase
      .from('referencias')
      .update(mudancas)
      .eq('id', id)

    if (error) {
      // coluna nova ainda não criada: a tela segue com a marcação local
      const semColuna = /excluida_em|objetivo|resumo/.test(error.message)
      return NextResponse.json(
        { ok: false, semColuna, error: error.message },
        { status: semColuna ? 200 : 500 }
      )
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }
}

// apaga de vez: some a linha e os arquivos do Storage
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Informe o id.' }, { status: 400 })

  const { data } = await supabase
    .from('referencias')
    .select('imagens')
    .eq('id', id)
    .maybeSingle()

  const arquivos = ((data?.imagens ?? []) as string[])
    .map(url => url.split(`/object/public/${BUCKET}/`)[1])
    .filter(Boolean)

  if (arquivos.length > 0) {
    await supabase.storage.from(BUCKET).remove(arquivos)
  }

  const { error } = await supabase.from('referencias').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const nome = String(body?.nome ?? '').trim()
    const imagens = Array.isArray(body?.imagens) ? body.imagens.filter(Boolean) : []
    const tags = Array.isArray(body?.tags) ? body.tags : []
    const objetivo = body?.objetivo ? String(body.objetivo) : null
    const resumo = body?.resumo ? String(body.resumo) : null

    if (!nome || imagens.length === 0) {
      return NextResponse.json({ error: 'Informe nome e pelo menos uma imagem.' }, { status: 400 })
    }

    await ensureBucket()

    const imagensPublicas = await Promise.all(
      imagens.map(async (dataUrl: string, index: number) => {
        const url = await uploadImageToSupabase(String(dataUrl), index)
        return url ?? dataUrl
      })
    )

    const item = {
      id: crypto.randomUUID(),
      nome,
      objetivo,
      resumo,
      imagens: imagensPublicas,
      tags,
      criado_em: new Date().toISOString()
    }

    let { data, error } = await supabase
      .from('referencias')
      .insert([item])
      .select()
      .single()

    // colunas novas: sem elas, grava o resto em vez de falhar
    if (error && /objetivo|resumo/.test(error.message)) {
      const { objetivo: _, resumo: __, ...semObjetivo } = item
      ;({ data, error } = await supabase
        .from('referencias')
        .insert([semObjetivo])
        .select()
        .single())
    }

    if (error) {
      console.error('Erro ao salvar referência no Supabase:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, item: data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao criar referência.'
    console.error('Erro ao criar referência:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
