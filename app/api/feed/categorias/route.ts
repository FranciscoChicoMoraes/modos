import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

interface FotoEntrada {
  src: string   // data URL do preview comprimido (500px)
}

const RESPOSTA_SCHEMA = {
  type: 'object' as const,
  properties: {
    categorias: {
      type: 'array' as const,
      description: 'Categorias de produtos identificadas nas fotos, em português, com inicial maiúscula. Use categorias amplas de produto, ex: "Óculos solar", "Óculos vista", "Relógio", "Perfume", "Semijoias", "Chapéu", "Bolsa", "Roupas". Sem duplicatas e sem categorias que não aparecem nas fotos.',
      items: { type: 'string' as const }
    }
  },
  required: ['categorias'],
  additionalProperties: false
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'Chave da API não configurada. Adicione ANTHROPIC_API_KEY no .env.local e reinicie o servidor.' },
      { status: 500 }
    )
  }

  let fotos: FotoEntrada[]
  try {
    const body = await req.json()
    fotos = body.fotos
    if (!Array.isArray(fotos) || fotos.length === 0) {
      return NextResponse.json({ error: 'Envie pelo menos 1 foto.' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  const client = new Anthropic()

  const blocosDeFotos = fotos.flatMap((foto, i) => {
    const base64 = foto.src.split(',')[1]
    if (!base64) return []
    return [
      { type: 'text' as const, text: `Foto ${i + 1}` },
      {
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: 'image/jpeg' as const,
          data: base64
        }
      }
    ]
  })

  const instrucoes = `Você é um analista de catálogo de produtos para uma agência de marketing.

Acima estão fotos de um ensaio de produtos de uma loja. Sua tarefa é identificar quais CATEGORIAS de produtos aparecem nas fotos.

Regras:
1. Use categorias amplas de produto, não descrições específicas. Ex: "Óculos solar", "Óculos vista", "Relógio", "Perfume", "Semijoias", "Chapéu", "Bolsa", "Roupas".
2. Separe "Óculos solar" de "Óculos vista" quando der para distinguir (lente escura vs transparente).
3. Inclua apenas categorias que realmente aparecem como produto em destaque nas fotos. Ignore itens de fundo ou cenário.
4. Nomes em português, com a primeira letra maiúscula, sem duplicatas.
5. Liste da categoria mais frequente para a menos frequente.`

  try {
    // streaming: muitas fotos geram análises demoradas
    const stream = client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      output_config: {
        format: {
          type: 'json_schema',
          schema: RESPOSTA_SCHEMA
        }
      },
      messages: [
        {
          role: 'user',
          content: [...blocosDeFotos, { type: 'text', text: instrucoes }]
        }
      ]
    })
    const response = await stream.finalMessage()

    if (response.stop_reason === 'refusal') {
      return NextResponse.json(
        { error: 'A análise foi recusada pelo modelo. Tente novamente com outras fotos.' },
        { status: 502 }
      )
    }
    if (response.stop_reason === 'max_tokens') {
      return NextResponse.json(
        { error: 'Resposta incompleta do modelo. Tente com menos fotos.' },
        { status: 502 }
      )
    }

    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'Resposta vazia do modelo.' }, { status: 502 })
    }

    const { categorias } = JSON.parse(textBlock.text)
    return NextResponse.json({ categorias })
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
      console.error('Erro da Anthropic:', e.status, e.name, e.message)
      if (e.message.includes('credit balance is too low')) {
        return NextResponse.json(
          { error: 'Sem créditos na conta da Anthropic. Adicione créditos em Plans & Billing no platform.claude.com.' },
          { status: 402 }
        )
      }
      return NextResponse.json(
        { error: `Erro na API da Anthropic (${e.status}). Tente novamente.` },
        { status: 502 }
      )
    }
    console.error('Erro ao identificar categorias:', e)
    return NextResponse.json({ error: 'Erro inesperado ao analisar as fotos.' }, { status: 500 })
  }
}
