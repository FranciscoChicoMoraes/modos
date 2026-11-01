import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { FONTES } from '@/lib/marketing/moodboard'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Entrada {
  nome: string
  objetivo: string
  desconto: string
  periodo: string
  grupos: string[]
  produtos: string[]
  marcas: string[]
  secoes: string[]      // categorias da loja
}

const DIRECAO = {
  type: 'object' as const,
  properties: {
    nome: {
      type: 'string' as const,
      description: 'Nome curto da direção criativa, em português, até 4 palavras. Ex: "Dourado noturno", "Minimal off-white".'
    },
    descricao: {
      type: 'string' as const,
      description: 'Uma frase explicando o clima da direção e por que combina com a campanha.'
    },
    release: {
      type: 'string' as const,
      description: 'Release da campanha, no máximo 150 caracteres, que cabe em duas linhas. Fala da campanha no clima desta direção, em tom de convite. Sem travessão.'
    },
    paleta: {
      type: 'array' as const,
      description: 'Cinco cores da direção, da dominante para a de apoio.',
      items: {
        type: 'object' as const,
        properties: {
          hex: { type: 'string' as const, description: 'Cor em hexadecimal, ex: #1C1917' },
          nome: { type: 'string' as const, description: 'Nome da cor em português, ex: "Grafite"' }
        },
        required: ['hex', 'nome'],
        additionalProperties: false
      }
    },
    paletaArtes: {
      type: 'array' as const,
      description: 'De três a cinco cores ideais para as artes desta campanha: fundo, texto e realce. Precisam ter contraste entre si e conversar com a paleta da direção.',
      items: {
        type: 'object' as const,
        properties: {
          hex: { type: 'string' as const, description: 'Cor em hexadecimal, ex: #F5F0E8' },
          nome: { type: 'string' as const, description: 'Nome da cor em português seguido do uso, ex: "Areia, fundo das artes"' }
        },
        required: ['hex', 'nome'],
        additionalProperties: false
      }
    },
    materiais: {
      type: 'array' as const,
      description: 'De um a três materiais do acervo que compõem o cenário das fotos desta direção, com o nome exatamente como está na lista de materiais cadastrados. Nunca invente um material que não esteja lá. Sem acervo, devolva lista vazia.',
      items: {
        type: 'object' as const,
        properties: {
          nome: { type: 'string' as const, description: 'Nome de um material cadastrado, escrito exatamente como aparece na lista do acervo.' },
          uso: { type: 'string' as const, description: 'Uma frase curta dizendo onde o material entra na composição do cenário.' }
        },
        required: ['nome', 'uso'],
        additionalProperties: false
      }
    },
    textura: { type: 'string' as const, description: 'Textura ou material da direção, em português. Ex: "Veludo canelado".' },
    texturaDescricao: { type: 'string' as const, description: 'Uma frase sobre como usar a textura nas peças.' },
    fonte: { type: 'string' as const, description: `Nome exato de uma fonte desta lista: ${FONTES.join(', ')}` },
    fonteUso: { type: 'string' as const, description: 'Uma frase sobre o uso da fonte, ex: títulos em caixa alta com muito espaço entre letras.' },
    fontesTitulo: {
      type: 'array' as const,
      description: `Três fontes para título, da principal para as alternativas. A primeira é a mesma de "fonte". Todas escritas exatamente como nesta lista: ${FONTES.join(', ')}`,
      items: { type: 'string' as const }
    },
    fontesTexto: {
      type: 'array' as const,
      description: `Três fontes para subtítulo e texto corrido, legíveis em corpo pequeno e diferentes das de título. Todas escritas exatamente como nesta lista: ${FONTES.join(', ')}`,
      items: { type: 'string' as const }
    },
    layout: {
      type: 'string' as const,
      description: 'Código de um dos layouts de feed cadastrados, exatamente como aparece na lista.'
    },
    layoutMotivo: {
      type: 'string' as const,
      description: 'Uma frase curta explicando por que esse layout combina com a campanha e com o acervo.'
    },
    acervo: {
      type: 'boolean' as const,
      description: 'true quando a direção parte do acervo de referências da agência, usando cores e textura de lá.'
    },
    apoio: {
      type: 'string' as const,
      description: 'Quando acervo for true, diga em uma frase o que veio do acervo. Quando for false, string vazia.'
    },
    consultas: {
      type: 'object' as const,
      description: 'Consultas de busca de imagem, SEMPRE em inglês, específicas e visuais. Sem nomes de marcas registradas.',
      properties: {
        mosaico: { type: 'array' as const, items: { type: 'string' as const }, description: 'Seis consultas para o mosaico de prévia do feed.' },
        cenario: { type: 'array' as const, items: { type: 'string' as const }, description: 'Três consultas de produto em cenário, still life.' },
        pessoas: { type: 'array' as const, items: { type: 'string' as const }, description: 'Três consultas de produto em pessoas, moda editorial.' },
        arte: { type: 'array' as const, items: { type: 'string' as const }, description: 'Três consultas de peça gráfica: convite, banner, tipografia.' },
        videos: { type: 'array' as const, items: { type: 'string' as const }, description: 'Duas consultas de vídeo curto de moda.' }
      },
      required: ['mosaico', 'cenario', 'pessoas', 'arte', 'videos'],
      additionalProperties: false
    }
  },
  required: ['nome', 'descricao', 'release', 'paleta', 'paletaArtes', 'materiais', 'textura', 'texturaDescricao', 'fonte', 'fonteUso', 'fontesTitulo', 'fontesTexto', 'layout', 'layoutMotivo', 'acervo', 'apoio', 'consultas'],
  additionalProperties: false
}

const RESPOSTA_SCHEMA = {
  type: 'object' as const,
  properties: {
    direcoes: {
      type: 'array' as const,
      description: 'Exatamente seis direções criativas bem diferentes entre si.',
      items: DIRECAO
    }
  },
  required: ['direcoes'],
  additionalProperties: false
}

const semAcento = (t: string) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

interface TagRef { grupo?: string; campo?: string; valor?: string; hex?: string }
interface LinhaRef { nome: string; objetivo?: string | null; tags: TagRef[]; criado_em: string }

// Acervo: o que a agência já fotografou e etiquetou. As referências que
// combinam com a campanha pesam mais, e o resto entra como repertório.
const lerAcervo = async (dados: Entrada) => {
  const { data, error } = await supabase
    .from('referencias')
    .select('nome, objetivo, tags, criado_em')
    .is('excluida_em', null)
    .order('criado_em', { ascending: false })
    .limit(60)

  if (error || !data) return null

  const termos = [dados.objetivo, ...dados.grupos, ...dados.produtos, ...dados.marcas]
    .filter(Boolean)
    .map(semAcento)

  const combina = (linha: LinhaRef) => {
    const texto = semAcento([
      linha.nome, linha.objetivo ?? '',
      ...linha.tags.map(t => `${t.campo ?? ''} ${t.valor ?? ''}`)
    ].join(' '))
    return termos.some(t => t.length >= 3 && texto.includes(t))
  }

  const linhas = data as LinhaRef[]
  const escolhidas = linhas.filter(combina)
  const usadas = escolhidas.length > 0 ? escolhidas : linhas.slice(0, 12)
  if (usadas.length === 0) return null

  // cores mais frequentes, com o nome que a análise deu
  const cores = new Map<string, { nome: string; vezes: number }>()
  const texturas = new Map<string, number>()
  const cenarios = new Set<string>()

  usadas.forEach(linha => {
    linha.tags.forEach(tag => {
      const campo = semAcento(tag.campo ?? '')
      if (tag.hex && /^#[0-9a-fA-F]{6}$/.test(tag.hex)) {
        const chave = tag.hex.toUpperCase()
        const atual = cores.get(chave)
        cores.set(chave, { nome: atual?.nome ?? tag.valor ?? '', vezes: (atual?.vezes ?? 0) + 1 })
      }
      if (campo.includes('textura') || campo.includes('material')) {
        if (tag.valor) texturas.set(tag.valor, (texturas.get(tag.valor) ?? 0) + 1)
      }
      if (campo.includes('descricao') && semAcento(tag.grupo ?? '').includes('cenario')) {
        if (tag.valor) cenarios.add(tag.valor)
      }
    })
  })

  const maisUsadas = <T,>(mapa: Map<string, T>, peso: (v: T) => number, limite: number) =>
    [...mapa.entries()].sort((a, b) => peso(b[1]) - peso(a[1])).slice(0, limite)

  return {
    referencias: usadas.length,
    combinaram: escolhidas.length,
    cores: maisUsadas(cores, v => v.vezes, 12).map(([hex, v]) => `${v.nome || 'cor'} ${hex}`),
    texturas: maisUsadas(texturas, v => v, 8).map(([nome]) => nome),
    cenarios: [...cenarios].slice(0, 8)
  }
}

interface LinhaAcao {
  nome: string
  direcao_nome?: string | null
  dados?: { direcao?: { nome?: string; fonte?: string; textura?: string; paleta?: { hex: string; nome: string }[] } }
}

// Histórico: o que já foi ao ar, para a proposta não repetir caminho
const lerHistorico = async () => {
  const { data, error } = await supabase
    .from('acoes')
    .select('nome, direcao_nome, dados')
    .order('criada_em', { ascending: false })
    .limit(20)

  if (error || !data) return null

  const usadas = (data as LinhaAcao[])
    .map(linha => linha.dados?.direcao)
    .filter((d): d is NonNullable<typeof d> => Boolean(d?.nome))
    .map(d => ({
      nome: d.nome ?? '',
      fonte: d.fonte ?? '',
      textura: d.textura ?? '',
      dominante: d.paleta?.[0]?.hex ?? ''
    }))

  return usadas.length > 0 ? usadas : null
}

interface LinhaLayout {
  codigo: string
  nome: string
  perfil: string
  linhas: number
  ordem_visual: string[]
  requisitos: Record<string, number>
}

interface LinhaMaterial { nome: string; descricao?: string | null }

// Materiais cadastrados: a composição do cenário sai daqui sempre que possível
const lerMateriais = async () => {
  const { data, error } = await supabase
    .from('materiais')
    .select('nome, descricao')
    .order('criado_em', { ascending: false })
    .limit(40)

  if (error || !data || data.length === 0) return null
  return data as LinhaMaterial[]
}

// Layouts de feed cadastrados: a IA escolhe um deles para cada direção
const lerLayouts = async () => {
  const { data, error } = await supabase
    .from('layouts_feed')
    .select('codigo, nome, perfil, linhas, ordem_visual, requisitos')
    .order('codigo', { ascending: true })

  if (error || !data || data.length === 0) return null
  return data as LinhaLayout[]
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'Chave da API não configurada. Adicione ANTHROPIC_API_KEY no .env.local e reinicie o servidor.' },
      { status: 500 }
    )
  }

  let dados: Entrada
  try {
    dados = await req.json()
    if (!dados?.nome) {
      return NextResponse.json({ error: 'Informe a campanha.' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  const lista = (itens: string[], limite = 24) =>
    itens.length > 0 ? itens.slice(0, limite).join(', ') : 'não informado'

  // as duas fontes de contexto: o que a agência já fotografou e o que já foi ao ar
  const [acervo, historico, layouts, materiais] = await Promise.all([
    lerAcervo(dados), lerHistorico(), lerLayouts(), lerMateriais()
  ])

  const blocoAcervo = acervo
    ? `
Acervo da agência (${acervo.referencias} referências cadastradas, ${acervo.combinaram} com ligação direta com esta campanha)
- Cores recorrentes: ${acervo.cores.join(', ') || 'não informado'}
- Texturas e materiais: ${acervo.texturas.join(', ') || 'não informado'}
- Cenários já fotografados: ${acervo.cenarios.join(', ') || 'não informado'}`
    : `
Acervo da agência: ainda sem referências cadastradas.`

  const blocoLayouts = layouts
    ? `
Layouts de feed cadastrados (M = Modelo, P = Produto, A = Arte)
${layouts.map(l => {
      const grade: string[] = []
      for (let i = 0; i < l.ordem_visual.length; i += 3) {
        grade.push(l.ordem_visual.slice(i, i + 3).join(''))
      }
      return `- ${l.codigo} ${l.nome} (${l.perfil}): ${grade.join(' / ')} · M ${l.requisitos.M ?? 0}, P ${l.requisitos.P ?? 0}, A ${l.requisitos.A ?? 0}`
    }).join('\n')}`
    : `
Layouts de feed: nenhum cadastrado.`

  const blocoMateriais = materiais
    ? `
Materiais cadastrados no acervo
${materiais.map(m => `- ${m.nome}${m.descricao ? `: ${m.descricao}` : ''}`).join('\n')}`
    : `
Materiais cadastrados: nenhum até agora.`

  const blocoHistorico = historico
    ? `
Direções já usadas nas campanhas anteriores desta loja
${historico.map(h => `- ${h.nome}: fonte ${h.fonte}, textura ${h.textura}, cor dominante ${h.dominante}`).join('\n')}`
    : `
Direções já usadas: nenhuma até agora.`

  const instrucoes = `Você é diretor de arte de uma agência de marketing de moda e acessórios.

Campanha
- Nome: ${dados.nome}
- Objetivo: ${dados.objetivo}
- Desconto: ${dados.desconto || 'sem desconto'}
- Período: ${dados.periodo}
- Seções da loja: ${lista(dados.secoes)}
- Grupos de produtos: ${lista(dados.grupos)}
- Produtos: ${lista(dados.produtos, 40)}
- Marcas: ${lista(dados.marcas, 40)}
${blocoAcervo}
${blocoLayouts}
${blocoMateriais}
${blocoHistorico}

Proponha SEIS direções criativas para essa campanha. Cada direção é um caminho visual completo: paleta, textura, tipografia e referências de imagem.

Regras:
1. As seis direções precisam ser claramente diferentes entre si em cor e clima. Nada de seis variações do mesmo bege.
2. A paleta tem cinco cores em hexadecimal, coerentes entre si e adequadas ao objetivo da campanha e à época do ano do período informado.
3. A fonte precisa ser uma da lista fornecida, escrita exatamente igual. O mesmo vale para as três de título e as três de texto, que não podem se repetir entre os dois grupos.
4. As consultas de busca são em inglês, descrevendo a imagem desejada, com produto, luz, cor e enquadramento. Ex: "gold jewelry on dark velvet, moody studio light". Não cite marcas registradas nem nomes de pessoas.
5. As consultas do mosaico devem representar o feed inteiro: alterne produto em cenário, produto em pessoa e peça gráfica.
6. Escreva os textos em português do Brasil, sem travessão.
7. Pelo menos DUAS das seis direções precisam nascer do acervo: use ao menos duas cores da lista de cores recorrentes na paleta, e uma textura que apareça no acervo. Nessas, marque acervo como true e explique em apoio o que veio de lá, citando as cores pelo código. Nas demais, acervo é false e apoio é string vazia.
8. Nenhuma direção pode repetir a fonte nem a cor dominante de uma direção já usada nas campanhas anteriores. Se o clima for parecido com algum já usado, mude a paleta e diga na descrição o que muda.
9. Quando o acervo estiver vazio, todas as direções vêm com acervo false, e a regra 7 não se aplica.
10. O release fala da campanha, não da direção: convida o cliente, cabe em duas linhas e no máximo 150 caracteres. Cada direção escreve o seu, no clima dela.
11. A paleta das artes tem de três a cinco cores pensadas para peça gráfica: um fundo, uma cor de texto com contraste sobre esse fundo e uma ou duas de realce. Pode repetir no máximo uma cor da paleta da direção.
12. Escolha de um a três materiais para a composição do cenário SOMENTE entre os materiais cadastrados no acervo, escrevendo o nome exatamente como aparece na lista. Nunca invente material, nem sugira um que não esteja cadastrado: o guia mostra fotos reais do acervo. Pode escolher dois materiais parecidos, como dois linhos ou dois couros, quando os dois fizerem sentido para esta campanha. Se o acervo não tiver nenhum material que sirva, devolva a lista vazia. Sem materiais cadastrados, a lista também vem vazia.
13. Escolha para cada direção um layout de feed entre os cadastrados e devolva em "layout" o código exatamente como está na lista. Não invente código. Considere o objetivo da campanha e o que o acervo tem: campanha de desconto pede perfil Promocional, coleção nova pede mais Modelo, catálogo pede mais Produto. Se o acervo tiver poucas fotos com pessoa, prefira um layout com menos M. Duas direções podem repetir o mesmo layout, mas não as seis.`

  const client = new Anthropic()

  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 12000,
      thinking: { type: 'adaptive' },
      output_config: {
        format: { type: 'json_schema', schema: RESPOSTA_SCHEMA }
      },
      messages: [{ role: 'user', content: instrucoes }]
    })
    const response = await stream.finalMessage()

    if (response.stop_reason === 'refusal') {
      return NextResponse.json({ error: 'O modelo recusou a geração. Ajuste a campanha e tente de novo.' }, { status: 502 })
    }
    if (response.stop_reason === 'max_tokens') {
      return NextResponse.json({ error: 'Resposta incompleta do modelo. Tente novamente.' }, { status: 502 })
    }

    const bloco = response.content.find(b => b.type === 'text')
    if (!bloco || bloco.type !== 'text') {
      return NextResponse.json({ error: 'Resposta vazia do modelo.' }, { status: 502 })
    }

    const { direcoes } = JSON.parse(bloco.text)

    // o código do layout precisa existir: se vier inventado, cai no primeiro
    // layout do perfil sugerido, e em último caso no primeiro cadastrado
    type Bruta = {
      layout?: string
      materiais?: { nome: string; uso: string }[]
      paletaArtes?: { hex: string; nome: string }[]
      paleta?: { hex: string; nome: string }[]
      fonte?: string
      fontesTitulo?: string[]
      fontesTexto?: string[]
    }

    const semAcentoMinusculo = (t: string) => semAcento(t).trim()

    // só vale material cadastrado: o nome é trocado pelo do acervo e o que
    // não existir lá é descartado
    const materiaisDoAcervo = (escolhidos: { nome: string; uso: string }[] | undefined) => {
      if (!materiais || materiais.length === 0) return []
      return (escolhidos ?? [])
        .map(escolhido => {
          const alvo = semAcentoMinusculo(escolhido.nome ?? '')
          const achado = materiais.find(m => semAcentoMinusculo(m.nome) === alvo)
            ?? materiais.find(m => {
              const nome = semAcentoMinusculo(m.nome)
              return alvo.length >= 3 && (nome.includes(alvo) || alvo.includes(nome))
            })
          return achado ? { nome: achado.nome, uso: escolhido.uso } : null
        })
        .filter((m): m is { nome: string; uso: string } => m !== null)
        .slice(0, 3)
    }

    // só vale fonte que exista na lista: o que vier fora dela é descartado e
    // o trio se completa com as seguintes, sem repetir
    const trioDeFontes = (escolhidas: string[] | undefined, usadas: string[]) => {
      const validas = (escolhidas ?? []).filter(f => FONTES.includes(f) && !usadas.includes(f))
      const trio = [...new Set(validas)].slice(0, 3)
      for (const fonte of FONTES) {
        if (trio.length >= 3) break
        if (!trio.includes(fonte) && !usadas.includes(fonte)) trio.push(fonte)
      }
      return trio
    }

    const corrigidas = (direcoes ?? []).map((direcao: Bruta) => {
      // o código do layout precisa existir: se vier inventado, cai no primeiro
      const layout = !layouts || layouts.length === 0
        ? ''
        : layouts.some(l => l.codigo === direcao.layout) ? direcao.layout : layouts[0].codigo

      const fontesTitulo = trioDeFontes(
        [direcao.fonte ?? '', ...(direcao.fontesTitulo ?? [])],
        []
      )
      const fontesTexto = trioDeFontes(direcao.fontesTexto, fontesTitulo)

      return {
        ...direcao,
        layout,
        fontesTitulo,
        fontesTexto,
        // o guia divide seis fotos entre os materiais, sempre do acervo
        materiais: materiaisDoAcervo(direcao.materiais),
        // sem paleta de artes, as artes seguem a da direção
        paletaArtes: (direcao.paletaArtes ?? []).length > 0
          ? direcao.paletaArtes
          : (direcao.paleta ?? []).slice(0, 3)
      }
    })

    return NextResponse.json({ direcoes: corrigidas })
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: 'Chave da API inválida. Confira o ANTHROPIC_API_KEY no .env.local.' }, { status: 500 })
    }
    if (e instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: 'Limite de requisições atingido. Aguarde um minuto e tente de novo.' }, { status: 429 })
    }
    if (e instanceof Anthropic.APIError) {
      console.error('Erro da Anthropic:', e.status, e.name, e.message)
      if (e.message.includes('credit balance is too low')) {
        return NextResponse.json({ error: 'Sem créditos na conta da Anthropic.' }, { status: 402 })
      }
      return NextResponse.json({ error: `Erro na API da Anthropic (${e.status}).` }, { status: 502 })
    }
    console.error('Erro ao gerar direções:', e)
    return NextResponse.json({ error: 'Erro inesperado ao gerar as direções.' }, { status: 500 })
  }
}
