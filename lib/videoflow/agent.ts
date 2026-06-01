export const HARD_KEYWORDS = ['gestão', 'liderança', 'crise', 'estratégia', 'vendas', 'marketing', 'okr', 'meta', 'result', 'funil', 'equipe']
export const EASY_KEYWORDS = ['case', 'erro', 'rotina', 'livro', 'ferramenta', 'bem-estar', 'carreira', 'histór', 'inspiração', 'propósito']

export const TIER_DAYS = {
  hard: ['seg', 'ter'],
  medium: ['qua', 'qui'],
  easy: ['sex', 'sab', 'dom']
}

export function inferDay(title: string, tier: 'hard' | 'medium' | 'easy'): string {
  const titleLower = title.toLowerCase()

  // 1º — Hard keywords → Segunda
  if (HARD_KEYWORDS.some(kw => titleLower.includes(kw))) {
    return 'seg'
  }

  // 2º — Easy keywords → Sexta
  if (EASY_KEYWORDS.some(kw => titleLower.includes(kw))) {
    return 'sex'
  }

  // 3º — Medium tier → Quinta
  if (tier === 'medium') {
    return 'qui'
  }

  // 4º — Hard tier without keyword → Terça
  if (tier === 'hard') {
    return 'ter'
  }

  // 5º — Fallback → Domingo
  return 'dom'
}

export async function generateScript(title: string, tier: 'hard' | 'medium' | 'easy', context?: string): Promise<string> {
  const response = await fetch('/api/videoflow/script', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, tier, context })
  })

  if (!response.ok) throw new Error('Erro ao gerar roteiro')
  const data = await response.json()
  return data.script
}

export async function extractKeywords(title: string, script: string): Promise<{
  keywords: string[]
  searchTerms: string[]
}> {
  const response = await fetch('/api/videoflow/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, scriptBody: script })
  })

  if (!response.ok) throw new Error('Erro ao extrair keywords')
  const data = await response.json()
  return {
    keywords: data.keywords || [],
    searchTerms: data.searchTerms || []
  }
}
