import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// Nota de curadoria da referência: duas frases curtas, no tom de
// inspiração de moda. Trabalha só com as tags, sem reenviar as fotos.

interface TagEntrada {
  grupo?: string
  campo?: string
  valor?: string
  hex?: string
}

const RESPOSTA_SCHEMA = {
  type: 'object' as const,
  properties: {
    resumo: {
      type: 'string' as const,
      description: 'Uma frase de inspiração, no máximo 80 caracteres contando espaços.'
    }
  },
  required: ['resumo'],
  additionalProperties: false
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Chave da API não configurada.' }, { status: 500 })
  }

  let nome = ''
  let objetivo = ''
  let tags: TagEntrada[] = []

  try {
    const body = await req.json()
    nome = String(body?.nome ?? '')
    objetivo = String(body?.objetivo ?? '')
    tags = Array.isArray(body?.tags) ? body.tags : []
    if (tags.length === 0) {
      return NextResponse.json({ error: 'Envie as tags da referência.' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  // agrupa os valores por campo, sem repetir
  const porCampo = new Map<string, string[]>()
  tags.forEach(tag => {
    const chave = `${tag.grupo ?? ''} ${tag.campo ?? ''}`.trim()
    const valor = (tag.valor ?? '').trim()
    if (!chave || !valor) return
    const lista = porCampo.get(chave) ?? []
    if (!lista.includes(valor) && lista.length < 8) lista.push(valor)
    porCampo.set(chave, lista)
  })

  const descricao = [...porCampo.entries()]
    .map(([chave, valores]) => `- ${chave}: ${valores.join(', ')}`)
    .join('\n')

  const instrucoes = `Você é curador de imagem de uma agência de moda e acessórios.

Referência: ${nome || 'sem nome'}
${objetivo ? `Campanha: ${objetivo}` : ''}

O que a análise viu nas fotos:
${descricao}

Escreva a nota de curadoria deste conjunto, para aparecer no cartão da referência.

Regras:
1. No máximo 80 caracteres contando espaços. Uma frase só.
2. Tom de inspiração, não de laudo. Fale do clima que as imagens criam.
   Exemplo do tom e do tamanho: "Tons terrosos, perfumes sofisticados e texturas naturais."
3. Escolha os dois ou três elementos mais fortes: cor, material ou produto.
4. Português do Brasil, sem travessão, sem ponto de exclamação, sem citar marca.
5. Nada de "esta referência" ou "as imagens mostram": vá direto ao clima.`

  const client = new Anthropic()

  try {
    const resposta = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 400,
      output_config: { format: { type: 'json_schema', schema: RESPOSTA_SCHEMA } },
      messages: [{ role: 'user', content: instrucoes }]
    })

    const bloco = resposta.content.find(b => b.type === 'text')
    if (!bloco || bloco.type !== 'text') {
      return NextResponse.json({ error: 'Resposta vazia do modelo.' }, { status: 502 })
    }

    const { resumo } = JSON.parse(bloco.text)

    // garantia de tamanho: corta na palavra, sem deixar frase pela metade
    const LIMITE = 80
    const texto = String(resumo ?? '').trim()
    const cortado = texto.length <= LIMITE
      ? texto
      : `${texto.slice(0, LIMITE).replace(/[\s,;.]+\S*$/, '')}.`

    return NextResponse.json({ resumo: cortado })
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: 'Chave da API inválida. Confira o ANTHROPIC_API_KEY no .env.local.' },
        { status: 500 }
      )
    }
    if (e instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: 'Limite de requisições atingido. Aguarde um minuto e tente de novo.' },
        { status: 429 }
      )
    }
    if (e instanceof Anthropic.APIError) {
      console.error('Erro ao escrever o resumo:', e.status, e.message)
      if (e.message.includes('credit balance is too low')) {
        return NextResponse.json(
          { error: 'Sem créditos na conta da Anthropic. Adicione créditos em Plans & Billing no platform.claude.com.' },
          { status: 402 }
        )
      }
      return NextResponse.json({ error: `Erro na API da Anthropic (${e.status}).` }, { status: 502 })
    }
    console.error('Erro ao escrever o resumo:', e)
    return NextResponse.json({ error: 'Erro inesperado ao escrever o resumo.' }, { status: 500 })
  }
}
