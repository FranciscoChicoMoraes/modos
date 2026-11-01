import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

interface FotoEntrada {
  id: string
  src: string   // data URL do preview comprimido (500px)
  tipo: 'single' | 'carousel' | 'reels'
}

const RESPOSTA_SCHEMA = {
  type: 'object' as const,
  properties: {
    carrosseis: {
      type: 'array' as const,
      description: 'Grupos de fotos do mesmo produto que devem virar um carrossel',
      items: {
        type: 'object' as const,
        properties: {
          ids: {
            type: 'array' as const,
            description: 'IDs das fotos do grupo, na ordem dos slides (a primeira é a capa)',
            items: { type: 'string' as const }
          },
          produto: {
            type: 'string' as const,
            description: 'Descrição curta do produto, ex: "óculos aviador dourado"'
          }
        },
        required: ['ids', 'produto'],
        additionalProperties: false
      }
    },
    ordem: {
      type: 'array' as const,
      description: 'Ordem final do feed, do topo do grid (mais recente) para o fim (primeira postagem). Para carrosséis propostos, use apenas o primeiro ID do grupo como representante. Todo post deve aparecer exatamente uma vez (pelo próprio ID ou pelo representante do seu grupo).',
      items: { type: 'string' as const }
    },
    resumo: {
      type: 'string' as const,
      description: 'Explicação curta em português da organização proposta, sem travessão'
    }
  },
  required: ['carrosseis', 'ordem', 'resumo'],
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
    if (!Array.isArray(fotos) || fotos.length < 2) {
      return NextResponse.json({ error: 'Envie pelo menos 2 fotos.' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  const client = new Anthropic()

  // cada foto vira um bloco de imagem precedido do seu ID
  const blocosDeFotos = fotos.flatMap((foto) => {
    const base64 = foto.src.split(',')[1]
    if (!base64) return []
    return [
      { type: 'text' as const, text: `Foto id=${foto.id} tipo=${foto.tipo}` },
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

  const instrucoes = `Você é um planejador de feed de Instagram para uma agência.

Acima estão as capas das publicações de um feed, cada uma precedida do seu id e tipo. A ordem em que aparecem é a ordem atual do feed, da mais recente para a primeira postagem.

Sua tarefa:
1. AGRUPAR: identifique fotos do MESMO produto (ex: o mesmo modelo de óculos em ângulos diferentes) e proponha carrosséis. Regras: só fotos do tipo "single" podem ser agrupadas; cada grupo tem de 2 a 10 fotos; escolha como primeira do grupo a foto mais forte para capa; não agrupe produtos diferentes só por serem parecidos; na dúvida, deixe separado.
2. ORDENAR: proponha a ordem final do feed pensando na estética do grid de 3 colunas do Instagram: alterne tons e enquadramentos, evite capas quase idênticas lado a lado, distribua as cores de forma equilibrada.

No campo "ordem", liste do topo do grid (mais recente) para o fim (primeira postagem). Publicações do tipo "carousel" e "reels" existentes entram na ordem pelos próprios ids e não podem ser agrupadas nem desmontadas.`

  try {
    // streaming: feeds grandes (100+ fotos) geram respostas longas e análises demoradas
    const stream = client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 32000,
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

    const proposta = JSON.parse(textBlock.text)
    return NextResponse.json({ proposta })
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
    console.error('Erro ao organizar feed:', e)
    return NextResponse.json({ error: 'Erro inesperado ao organizar o feed.' }, { status: 500 })
  }
}
