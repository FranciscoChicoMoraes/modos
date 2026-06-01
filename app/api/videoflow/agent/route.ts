import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { title, scriptBody } = await req.json()

    if (!title || !scriptBody) {
      return NextResponse.json(
        { error: 'Title e scriptBody são obrigatórios' },
        { status: 400 }
      )
    }

    const systemPrompt = `Você é um agente especializado em extrair palavras-chave de roteiros para busca de vídeos B-roll.
Responda APENAS com JSON válido, sem markdown.`

    const userPrompt = `Analise este roteiro e extraia 6-8 palavras-chave em inglês para buscar vídeos B-roll relevantes no Pinterest.
Título: "${title}"
Roteiro: "${scriptBody}"
Responda APENAS com JSON neste formato:
{
  "keywords": ["keyword1", "keyword2", ...],
  "searchTerms": ["search term 1", "search term 2"]
}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const cleanedText = rawText.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleanedText)

    return NextResponse.json({
      keywords: parsed.keywords || [],
      searchTerms: parsed.searchTerms || []
    })
  } catch (error) {
    console.error('Erro ao extrair keywords:', error)
    return NextResponse.json(
      { error: 'Erro ao extrair keywords' },
      { status: 500 }
    )
  }
}
