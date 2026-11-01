import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// Análise de material: o que a foto mostra de tipo, acabamento, cor e trama.

const CAMPOS = ['Material', 'Acabamento', 'Cor', 'Trama', 'Aplicação'] as const

const RESPOSTA_SCHEMA = {
  type: 'object' as const,
  properties: {
    descricao: {
      type: 'string' as const,
      description: 'Uma frase de até 120 caracteres descrevendo o material do conjunto, em português.'
    },
    imagens: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          imagemIndex: { type: 'integer' as const },
          tags: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                campo: { type: 'string' as const, enum: [...CAMPOS] },
                valor: { type: 'string' as const, description: 'Valor curto em português.' },
                hex: {
                  type: 'string' as const,
                  description: 'Só no campo Cor: o hexadecimal da cor. Nos outros, string vazia.'
                }
              },
              required: ['campo', 'valor', 'hex'],
              additionalProperties: false
            }
          }
        },
        required: ['imagemIndex', 'tags'],
        additionalProperties: false
      }
    }
  },
  required: ['descricao', 'imagens'],
  additionalProperties: false
}

const extrairTipoImagem = (src: string): 'image/png' | 'image/webp' | 'image/jpeg' => {
  if (src.startsWith('data:image/png')) return 'image/png'
  if (src.startsWith('data:image/webp')) return 'image/webp'
  return 'image/jpeg'
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Chave da API não configurada.' }, { status: 500 })
  }

  let fotos: Array<{ src: string }> = []
  let nome = ''

  try {
    const body = await req.json()
    fotos = body.fotos
    nome = String(body?.nome ?? '')
    if (!Array.isArray(fotos) || fotos.length === 0) {
      return NextResponse.json({ error: 'Envie pelo menos 1 imagem.' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  const blocos: Anthropic.ContentBlockParam[] = fotos.flatMap((foto, index) => {
    const src = String(foto?.src ?? '')
    const base64 = src.includes(',') ? src.split(',')[1] : src
    if (!base64) return []
    return [
      { type: 'text' as const, text: `Imagem ${index + 1}` },
      {
        type: 'image' as const,
        source: { type: 'base64' as const, media_type: extrairTipoImagem(src), data: base64 }
      }
    ]
  })

  const instrucoes = `Você cataloga materiais para uma agência de moda e acessórios.

${nome ? `Material informado pela equipe: ${nome}` : ''}

São ${fotos.length} ${fotos.length === 1 ? 'imagem' : 'imagens'}. Devolva um item por imagem, na ordem em que foram enviadas, com imagemIndex de 0 a ${fotos.length - 1}. Nenhuma imagem pode ficar de fora, mesmo que repita o mesmo material.

Campos de cada tag:
- Material: o material em si, ex: Couro, Veludo, Linho, Vidro, Mármore, Acrílico.
- Acabamento: ex: Fosco, Brilhante, Acetinado, Envelhecido, Escovado.
- Cor: nome da cor em português, com o hexadecimal no campo hex.
- Trama: o desenho da superfície, ex: Canelado, Liso, Granulado, Plissado, Texturizado.
- Aplicação: onde o material cabe na campanha, ex: Fundo de still, Base de produto, Caixa e embalagem.

Regras:
1. Só descreva o que está visível na imagem. Nada de suposição.
2. Valores curtos, em português, com inicial maiúscula, sem frase longa e sem travessão.
3. O campo hex só é preenchido nas tags de Cor.
4. A descrição do conjunto tem no máximo 120 caracteres e fala do clima do material.
5. Cada imagem precisa de pelo menos as tags de Material, Cor e Trama.`

  const client = new Anthropic()

  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 6000,
      thinking: { type: 'adaptive' },
      output_config: { format: { type: 'json_schema', schema: RESPOSTA_SCHEMA } },
      messages: [{ role: 'user', content: [...blocos, { type: 'text', text: instrucoes }] }]
    })
    const resposta = await stream.finalMessage()

    if (resposta.stop_reason === 'refusal') {
      return NextResponse.json({ error: 'A análise foi recusada pelo modelo.' }, { status: 502 })
    }
    if (resposta.stop_reason === 'max_tokens') {
      return NextResponse.json({ error: 'Resposta incompleta. Tente com menos imagens.' }, { status: 502 })
    }

    const bloco = resposta.content.find(b => b.type === 'text')
    if (!bloco || bloco.type !== 'text') {
      return NextResponse.json({ error: 'Resposta vazia do modelo.' }, { status: 502 })
    }

    return NextResponse.json(JSON.parse(bloco.text))
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
      console.error('Erro ao analisar material:', e.status, e.message)
      if (e.message.includes('credit balance is too low')) {
        return NextResponse.json(
          { error: 'Sem créditos na conta da Anthropic. Adicione créditos em Plans & Billing no platform.claude.com.' },
          { status: 402 }
        )
      }
      return NextResponse.json({ error: `Erro na API da Anthropic (${e.status}).` }, { status: 502 })
    }
    console.error('Erro ao analisar material:', e)
    return NextResponse.json({ error: 'Erro inesperado ao analisar as imagens.' }, { status: 500 })
  }
}
