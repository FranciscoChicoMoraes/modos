import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { title, tier, context } = await req.json()

    if (!title) {
      return NextResponse.json({ error: 'Title é obrigatório' }, { status: 400 })
    }

    const systemPrompt = `Você é um especialista em roteiros para vídeos de marketing e gestão de pessoas.
Crie roteiros concisos, diretos e envolventes para vídeos de 2-4 minutos.
Responda apenas com o roteiro, sem explicações extras.`

    const userPrompt = `Crie um roteiro para um vídeo sobre: "${title}".
${context ? `Contexto adicional: ${context}` : ''}
Intensidade: ${tier}.
O vídeo é para redes sociais, com foco em marketing, gestão de pessoas e inovação empresarial.
Tom: real, direto, sem clichês.
Estrutura: abertura impactante → desenvolvimento → CTA.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    })

    const script = message.content[0].type === 'text' ? message.content[0].text : ''

    return NextResponse.json({ script })
  } catch (error) {
    console.error('Erro ao gerar roteiro:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar roteiro' },
      { status: 500 }
    )
  }
}
