import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const GRUPOS = ['Pessoas', 'Produtos', 'Cenários'] as const

// cada grupo tem os seus campos; a IA preenche só o que a imagem mostra
const CAMPOS_POR_GRUPO: Record<(typeof GRUPOS)[number], string[]> = {
  Pessoas: ['Descrição', 'Pose', 'Ângulo da foto'],
  Produtos: ['Produto', 'Cores', 'Texturas', 'Marca'],
  'Cenários': ['Descrição', 'Material', 'Cor', 'Composição']
}

const CAMPOS_PERMITIDOS = [...new Set(Object.values(CAMPOS_POR_GRUPO).flat())]

const RESPOSTA_SCHEMA = {
  type: 'object' as const,
  properties: {
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
                grupo: { type: 'string' as const, enum: [...GRUPOS] },
                campo: { type: 'string' as const, enum: CAMPOS_PERMITIDOS },
                valor: {
                  type: 'string' as const,
                  description: 'Valor curto em português, sem frase longa.'
                },
                hex: {
                  type: 'string' as const,
                  description: 'Só nos campos de cor (Cores, Cor): a cor em hexadecimal, ex: #C9A227. Nos demais campos, string vazia.'
                }
              },
              required: ['grupo', 'campo', 'valor', 'hex'],
              additionalProperties: false
            }
          }
        },
        required: ['imagemIndex', 'tags'],
        additionalProperties: false
      }
    }
  },
  required: ['imagens'],
  additionalProperties: false
}

const extrairTipoImagem = (src: string): 'image/png' | 'image/webp' | 'image/jpeg' => {
  if (src.startsWith('data:image/png')) return 'image/png'
  if (src.startsWith('data:image/webp')) return 'image/webp'
  return 'image/jpeg'
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'Chave da API não configurada. Adicione ANTHROPIC_API_KEY no .env.local e reinicie o servidor.' },
      { status: 500 }
    )
  }

  let fotos: Array<{ src: string }> = []

  try {
    const body = await req.json()
    fotos = body.fotos
    if (!Array.isArray(fotos) || fotos.length === 0) {
      return NextResponse.json({ error: 'Envie pelo menos 1 imagem.' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  const client = new Anthropic()

  const blocosDeImagens: Anthropic.ContentBlockParam[] = fotos.flatMap((foto, index) => {
    const src = String(foto?.src ?? '')
    const base64 = src.includes(',') ? src.split(',')[1] : src

    if (!base64) {
      return []
    }

    return [
      { type: 'text' as const, text: `Imagem ${index + 1}` },
      {
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: extrairTipoImagem(src),
          data: base64
        }
      }
    ]
  })

  const instrucoes = `Você é um analista de referências visuais para uma agência de marketing de moda e acessórios.

Analise cada imagem separadamente e devolva apenas o JSON estruturado.

Os campos de cada grupo:
- Pessoas: ${CAMPOS_POR_GRUPO.Pessoas.join(', ')}
- Produtos: ${CAMPOS_POR_GRUPO.Produtos.join(', ')}
- Cenários: ${CAMPOS_POR_GRUPO['Cenários'].join(', ')}

Regras:
1. Cada tag tem grupo, campo e valor. O campo precisa pertencer ao grupo, conforme a lista acima.
2. 'imagemIndex' é a posição da imagem no conjunto enviado, começando em 0.
3. Só descreva o que está visível. Nunca invente elemento que não aparece.
4. O grupo Pessoas só entra quando há pessoa na imagem. Sem pessoa, nenhuma tag desse grupo.
5. O campo Marca só entra quando a marca estiver legível na imagem.
6. Em Produtos, repita o grupo para cada produto diferente que aparecer.
7. Valores curtos, em português, com a primeira letra maiúscula, sem frase longa e sem travessão.
8. Nos campos de cor (Cores e Cor), o valor é o nome da cor em português e 'hex' traz o hexadecimal correspondente ao que aparece na imagem, ex: valor "Vermelho coral", hex "#E8624A". Nos outros campos, 'hex' vai como string vazia.
9. Liste cada cor relevante da imagem em uma tag própria, da mais presente para a menos presente.`

  try {
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
          content: [...blocosDeImagens, { type: 'text', text: instrucoes }]
        }
      ]
    })

    const response = await stream.finalMessage()

    if (response.stop_reason === 'refusal') {
      return NextResponse.json(
        { error: 'A análise foi recusada pelo modelo. Tente novamente com outras imagens.' },
        { status: 502 }
      )
    }

    if (response.stop_reason === 'max_tokens') {
      return NextResponse.json(
        { error: 'Resposta incompleta do modelo. Tente com menos fotos ou imagens menores.' },
        { status: 502 }
      )
    }

    const textBlock = response.content.find(block => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'Resposta vazia do modelo.' }, { status: 502 })
    }

    const payload = JSON.parse(textBlock.text)
    return NextResponse.json(payload)
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: 'Chave da API inválida. Confira o ANTHROPIC_API_KEY no .env.local.' },
        { status: 500 }
      )
    }

    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: 'Limite de requisições atingido. Aguarde um pouco e tente novamente.' },
        { status: 429 }
      )
    }

    if (error instanceof Anthropic.APIError) {
      console.error('Erro da Anthropic:', error.status, error.name, error.message)
      if (error.message.includes('credit balance is too low')) {
        return NextResponse.json(
          { error: 'Sem créditos na conta da Anthropic. Adicione créditos em Plans & Billing no platform.claude.com.' },
          { status: 402 }
        )
      }
      return NextResponse.json(
        { error: `Erro na API da Anthropic (${error.status}). Tente novamente.` },
        { status: 502 }
      )
    }

    console.error('Erro ao analisar referências com Claude:', error)
    return NextResponse.json({ error: 'Erro inesperado ao analisar as referências.' }, { status: 500 })
  }
}
