import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ImagemEntrada { id: string; url: string }
interface PostEntrada {
  id: string
  tipo: 'single' | 'carousel' | 'reels'
  legenda?: string
  agendadoEm?: string | null
  status?: string
  imagens: ImagemEntrada[]
}

// PGRST205 = tabela ausente; 42703 = coluna ausente.
// Sem os códigos as duas mensagens se confundem, porque ambas
// contêm "feed_posts" e "does not exist".
const semTabela = (error: { code?: string } | null) =>
  error?.code === 'PGRST205'

// colunas do passo 2 ainda não criadas
const semAgendamento = (error: { code?: string; message?: string } | null) =>
  error?.code === '42703' && /agendado_em|status/.test(error.message ?? '')

const AVISO_MIGRACAO =
  'Tabelas do feed ainda não existem. Rode migrations_feed.sql no Supabase (SQL Editor).'

const AVISO_AGENDAMENTO =
  'Colunas de agendamento ainda não existem. Rode migrations_feed_agendamento.sql no Supabase (SQL Editor).'

const COLUNAS_COM_AGENDA =
  'id, tipo, legenda, posicao, agendado_em, status, feed_imagens (id, url, posicao)'
const COLUNAS_SEM_AGENDA =
  'id, tipo, legenda, posicao, feed_imagens (id, url, posicao)'

// Carrega o feed da empresa, na ordem do grid
export async function GET(request: NextRequest) {
  try {
    const empresaId = request.nextUrl.searchParams.get('empresa_id')

    const buscar = (colunas: string) => {
      const q = supabase.from('feed_posts').select(colunas).order('posicao', { ascending: true })
      return empresaId ? q.eq('empresa_id', empresaId) : q.is('empresa_id', null)
    }

    let { data, error } = await buscar(COLUNAS_COM_AGENDA)
    let aviso: string | undefined

    if (semTabela(error)) {
      return NextResponse.json({ posts: [], aviso: AVISO_MIGRACAO })
    }
    if (semAgendamento(error)) {
      aviso = AVISO_AGENDAMENTO
      ;({ data, error } = await buscar(COLUNAS_SEM_AGENDA))
    }
    if (error) {
      console.error('GET /api/feed/posts:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const posts = (data ?? []).map((p: any) => ({
      id: p.id,
      tipo: p.tipo,
      legenda: p.legenda ?? '',
      agendadoEm: p.agendado_em ?? null,
      status: p.status ?? 'rascunho',
      imagens: (p.feed_imagens ?? [])
        .sort((a: any, b: any) => a.posicao - b.posicao)
        .map((i: any) => ({ id: i.id, url: i.url }))
    }))

    return NextResponse.json({ posts, aviso })
  } catch (error: any) {
    console.error('GET /api/feed/posts:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Substitui o feed inteiro pelo estado atual da tela.
// Grava primeiro e só então apaga o que saiu, para nunca ficar sem dados.
export async function PUT(request: NextRequest) {
  try {
    const { posts, empresaId } = await request.json() as {
      posts: PostEntrada[]
      empresaId?: string | null
    }
    if (!Array.isArray(posts)) {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })
    }

    let aviso: string | undefined

    const linhaBase = (p: PostEntrada, i: number) => ({
      id: p.id,
      empresa_id: empresaId ?? null,
      tipo: p.tipo,
      legenda: p.legenda ?? null,
      posicao: i,
      updated_at: new Date().toISOString()
    })

    const linhasPosts = posts.map((p, i) => ({
      ...linhaBase(p, i),
      agendado_em: p.agendadoEm || null,
      status: p.status ?? 'rascunho'
    }))

    if (linhasPosts.length > 0) {
      let { error } = await supabase.from('feed_posts').upsert(linhasPosts)
      if (semTabela(error)) {
        return NextResponse.json({ salvos: 0, aviso: AVISO_MIGRACAO })
      }
      if (semAgendamento(error)) {
        // salva sem agendamento até a migração do passo 2 rodar
        aviso = AVISO_AGENDAMENTO
        ;({ error } = await supabase.from('feed_posts').upsert(posts.map(linhaBase)))
      }
      if (error) {
        console.error('PUT feed_posts:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    const linhasImagens = posts.flatMap(p =>
      p.imagens.map((img, i) => ({
        id: img.id,
        post_id: p.id,
        url: img.url,
        posicao: i
      }))
    )

    if (linhasImagens.length > 0) {
      const { error } = await supabase.from('feed_imagens').upsert(linhasImagens)
      if (error) {
        console.error('PUT feed_imagens:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    // limpa o que não está mais na tela, sempre dentro da empresa atual
    // (sem o filtro por empresa, salvar um feed apagaria o das outras)
    const idsPosts = posts.map(p => p.id)
    const idsImagens = linhasImagens.map(i => i.id)

    const daEmpresa = () => {
      const q = supabase.from('feed_posts').delete()
      return empresaId ? q.eq('empresa_id', empresaId) : q.is('empresa_id', null)
    }

    if (idsPosts.length > 0) {
      await daEmpresa().not('id', 'in', `(${idsPosts.map(id => `"${id}"`).join(',')})`)
      if (idsImagens.length > 0) {
        await supabase.from('feed_imagens').delete()
          .in('post_id', idsPosts)
          .not('id', 'in', `(${idsImagens.map(id => `"${id}"`).join(',')})`)
      }
    } else {
      await daEmpresa()
    }

    return NextResponse.json({ salvos: linhasPosts.length, aviso })
  } catch (error: any) {
    console.error('PUT /api/feed/posts:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
