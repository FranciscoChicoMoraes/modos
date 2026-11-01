import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = 'materiais'

const semTabela = (mensagem?: string) =>
  Boolean(mensagem && /could not find the table|does not exist/i.test(mensagem))

const garantirBucket = async () => {
  const { data } = await supabase.storage.listBuckets()
  if (data?.some(b => b.name === BUCKET)) return
  await supabase.storage.createBucket(BUCKET, { public: true })
}

// sobe a imagem em base64 e devolve a URL pública
const subirImagem = async (dataUrl: string, indice: number) => {
  const [cabecalho, corpo] = dataUrl.split(',')
  if (!corpo || !cabecalho) return null

  const tipo = cabecalho.match(/data:(image\/[a-zA-Z0-9.+-]+);base64/)?.[1] ?? 'image/jpeg'
  const extensao = tipo.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
  const caminho = `materiais/${Date.now()}-${indice}.${extensao}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(caminho, Buffer.from(corpo, 'base64'), { contentType: tipo, upsert: true })

  if (error) return null
  return supabase.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl
}

export async function GET() {
  const { data, error } = await supabase
    .from('materiais')
    .select('*')
    .order('criado_em', { ascending: false })

  if (error) {
    return NextResponse.json(
      { itens: [], indisponivel: true, motivo: error.message },
      { status: semTabela(error.message) ? 200 : 500 }
    )
  }
  return NextResponse.json({ itens: data ?? [] })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const nome = String(body?.nome ?? '').trim()
    const descricao = body?.descricao ? String(body.descricao) : null
    const imagens: string[] = Array.isArray(body?.imagens) ? body.imagens.filter(Boolean) : []
    const tags = Array.isArray(body?.tags) ? body.tags : []

    if (!nome || imagens.length === 0) {
      return NextResponse.json({ error: 'Informe o nome e pelo menos uma imagem.' }, { status: 400 })
    }

    await garantirBucket()

    const publicas = await Promise.all(
      imagens.map(async (img, i) =>
        img.startsWith('data:') ? (await subirImagem(img, i)) ?? img : img
      )
    )

    const item = {
      id: crypto.randomUUID(),
      nome,
      descricao,
      imagens: publicas,
      tags,
      criado_em: new Date().toISOString()
    }

    const { data, error } = await supabase.from('materiais').insert([item]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, item: data })
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : 'Erro ao salvar o material.'
    return NextResponse.json({ error: mensagem }, { status: 500 })
  }
}

// edição: nome, imagens e nova análise
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const id = String(body?.id ?? '')
    if (!id) return NextResponse.json({ error: 'Informe o id.' }, { status: 400 })

    const mudancas: Record<string, unknown> = {}

    if (typeof body?.nome === 'string' && body.nome.trim()) mudancas.nome = body.nome.trim()
    if ('descricao' in body) mudancas.descricao = body.descricao ? String(body.descricao) : null
    if (Array.isArray(body?.tags)) mudancas.tags = body.tags

    if (Array.isArray(body?.imagens)) {
      await garantirBucket()

      // imagem nova chega em base64 e sobe; a que já era URL segue igual
      const finais = await Promise.all(
        body.imagens.map(async (img: string, i: number) =>
          String(img).startsWith('data:') ? (await subirImagem(String(img), i)) ?? img : img
        )
      )
      mudancas.imagens = finais

      // o que saiu da lista também sai do Storage
      const { data: antigo } = await supabase
        .from('materiais').select('imagens').eq('id', id).maybeSingle()

      const removidas = ((antigo?.imagens ?? []) as string[])
        .filter(url => !finais.includes(url))
        .map(url => url.split(`/object/public/${BUCKET}/`)[1])
        .filter(Boolean)

      if (removidas.length > 0) await supabase.storage.from(BUCKET).remove(removidas)
    }

    if (Object.keys(mudancas).length === 0) return NextResponse.json({ ok: true })

    const { data, error } = await supabase
      .from('materiais').update(mudancas).eq('id', id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, item: data })
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : 'Erro ao editar o material.'
    return NextResponse.json({ error: mensagem }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Informe o id.' }, { status: 400 })

  const { data } = await supabase.from('materiais').select('imagens').eq('id', id).maybeSingle()
  const arquivos = ((data?.imagens ?? []) as string[])
    .map(url => url.split(`/object/public/${BUCKET}/`)[1])
    .filter(Boolean)

  if (arquivos.length > 0) await supabase.storage.from(BUCKET).remove(arquivos)

  const { error } = await supabase.from('materiais').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
