import type { DirecaoCriativa, Moodboard as MoodboardDados } from '@/lib/marketing/moodboard'

// Dados fixos das campanhas: objetivos do varejo, sugestões de desconto
// e a árvore de canais e formatos da veiculação.

export interface BlocoObjetivos {
  id: string
  titulo: string
  itens: string[]
}

// Os objetivos seguem o calendário do varejo, na ordem do ano.
export const OBJETIVOS: BlocoObjetivos[] = [
  {
    id: 'varejo',
    titulo: 'Calendário do varejo',
    itens: [
      'Liquida de Janeiro',
      'Promo Bloquinho Carnaval',
      'Dia Internacional da Mulher',
      'Semana do Consumidor',
      'Dia do Consumidor',
      'Páscoa',
      'Dia das Mães',
      'Dia dos Namorados',
      'Arraiá de Ofertas São João',
      'Liquida de Julho',
      'Pix Day',
      'Dia do Amigo',
      'Dia dos Pais',
      'Dia do Cliente',
      'Dia das Crianças',
      'Dia dos Avós',
      'Black Friday',
      'Natal',
      'Virada de Ano'
    ]
  },
  {
    id: 'setor',
    titulo: 'Datas do setor',
    itens: [
      'Dia do Joalheiro',
      'Dia do Oftalmologista',
      'Dia do Relojoeiro',
      'Dia do Alfaiate',
      'Dia da Costureira',
      'Dia do Sapateiro'
    ]
  },
  {
    id: 'loja',
    titulo: 'Rotina da loja',
    itens: [
      'Lançamento de coleção',
      'Novidades',
      'Desconto fecha mês',
      'Aniversário da cidade'
    ]
  }
]

// Todas as campanhas que já vêm cadastradas, em lista única.
export const OBJETIVOS_ROUPAS: BlocoObjetivos[] = [
  {
    id: 'varejo',
    titulo: 'Calendário do varejo',
    itens: [
      'Liquida de Janeiro',
      'Promo Bloquinho Carnaval',
      'Dia Internacional da Mulher',
      'Semana do Consumidor',
      'Dia do Consumidor',
      'Páscoa',
      'Dia das Mães',
      'Dia dos Namorados',
      'Arraiá de Ofertas São João',
      'Liquida de Julho',
      'Pix Day',
      'Dia do Amigo',
      'Dia dos Pais',
      'Dia do Cliente',
      'Dia das Crianças',
      'Dia dos Avós',
      'Black Friday',
      'Natal',
      'Virada de Ano'
    ]
  },
  {
    id: 'setor',
    titulo: 'Datas do setor',
    itens: [
      'Dia do Joalheiro',
      'Dia do Oftalmologista',
      'Dia do Relojoeiro',
      'Dia do Alfaiate',
      'Dia da Costureira',
      'Dia do Sapateiro'
    ]
  },
  {
    id: 'loja',
    titulo: 'Rotina da loja',
    itens: [
      'Lançamento de coleção',
      'Novidades',
      'Desconto fecha mês',
      'Aniversário da cidade'
    ]
  }
]

export const CATEGORIAS_ROUPAS = new Set([
  'loja-roupas',
  'moda-infantil',
  'moda-intima',
  'moda-fitness',
  'moda-evangelica',
  'plus-size',
  'alta-costura',
  'alfaiataria',
  'moda-praia',
  'moda-country'
])

export const CAMPANHAS_PADRAO = OBJETIVOS.flatMap(b => b.itens)

const semAcento = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Sugere as campanhas padrão mais próximas do que está sendo digitado.
// Começo do nome vem antes de começo de palavra, que vem antes do meio.
export const sugerirCampanhas = (texto: string, limite = 5): string[] => {
  const busca = semAcento(texto.trim())
  if (busca.length < 3) return []

  return CAMPANHAS_PADRAO
    .map(nome => {
      const alvo = semAcento(nome)
      const pos = alvo.indexOf(busca)
      if (pos < 0) return null
      const peso = pos === 0 ? 0 : alvo[pos - 1] === ' ' ? 1 : 2
      return { nome, peso, pos }
    })
    .filter((s): s is { nome: string; peso: number; pos: number } => s !== null)
    .sort((a, b) => a.peso - b.peso || a.pos - b.pos || a.nome.localeCompare(b.nome))
    .slice(0, limite)
    .map(s => s.nome)
}

// Pop-up do desconto: atalhos de porcentagem e formatos de promoção.
export const PERCENTUAIS = ['10%', '15%', '20%', '30%', '40%', '50%', '70%']

export const FORMATOS_PROMOCAO = [
  'Progressiva',
  'Leve 3 pague 2',
  'Segunda peça com desconto',
  'Desconto no Pix',
  'Cashback',
  'Brinde na compra',
  'Frete grátis'
]

export interface FormatoVeiculacao {
  id: string
  nome: string
  padrao: boolean
}

export interface SecaoCanal {
  id: string
  nome: string
  formatos: FormatoVeiculacao[]
}

export interface CanalVeiculacao {
  id: string
  nome: string
  secoes: SecaoCanal[]
}

// Mídia paga: as mesmas peças rodando como anúncio. Já vem marcada no
// Instagram e no Facebook, onde o anúncio é parte da rotina da loja.
const trafego = (padrao: boolean): SecaoCanal => ({
  id: 'trafego',
  nome: 'Tráfego (Patrocinado)',
  formatos: [
    { id: 'foto', nome: 'Foto', padrao },
    { id: 'video', nome: 'Vídeo', padrao },
    { id: 'carrossel', nome: 'Carrossel', padrao }
  ]
})

// Os formatos vêm marcados conforme a chance de a loja produzir a peça.
// Fica desmarcado o que exige produção ao vivo ou audiência própria:
// transmissão e canais no WhatsApp, TikTok Shop e live commerce.
export const CANAIS: CanalVeiculacao[] = [
  {
    id: 'instagram',
    nome: 'Instagram',
    secoes: [
      {
        id: 'feed',
        nome: 'Feed',
        formatos: [
          { id: 'post-estatico', nome: 'Post estático', padrao: true },
          { id: 'carrossel', nome: 'Carrossel', padrao: true }
        ]
      },
      {
        id: 'reels',
        nome: 'Reels',
        formatos: [
          { id: 'video', nome: 'Vídeo', padrao: true },
          { id: 'carrossel-fotos', nome: 'Carrossel de fotos', padrao: true }
        ]
      },
      {
        id: 'stories',
        nome: 'Stories',
        formatos: [
          { id: 'foto', nome: 'Foto', padrao: true },
          { id: 'video', nome: 'Vídeo', padrao: true }
        ]
      },
      {
        id: 'instants',
        nome: 'Instants',
        formatos: [{ id: 'foto', nome: 'Foto', padrao: true }]
      },
      {
        id: 'live-commerce',
        nome: 'Live commerce',
        formatos: [
          { id: 'video', nome: 'Vídeo', padrao: false },
          { id: 'banner', nome: 'Banner', padrao: false }
        ]
      },
      trafego(true)
    ]
  },
  {
    id: 'facebook',
    nome: 'Facebook',
    secoes: [
      {
        id: 'feed',
        nome: 'Feed',
        formatos: [
          { id: 'post-estatico', nome: 'Post estático', padrao: true },
          { id: 'carrossel', nome: 'Carrossel', padrao: true }
        ]
      },
      {
        id: 'reels',
        nome: 'Reels',
        formatos: [
          { id: 'video', nome: 'Vídeo', padrao: true },
          { id: 'carrossel-fotos', nome: 'Carrossel de fotos', padrao: true }
        ]
      },
      {
        id: 'stories',
        nome: 'Stories',
        formatos: [
          { id: 'foto', nome: 'Foto', padrao: true },
          { id: 'video', nome: 'Vídeo', padrao: true }
        ]
      },
      {
        id: 'live-commerce',
        nome: 'Live commerce',
        formatos: [
          { id: 'video', nome: 'Vídeo', padrao: false },
          { id: 'banner', nome: 'Banner', padrao: false }
        ]
      },
      trafego(true)
    ]
  },
  {
    id: 'whatsapp',
    nome: 'WhatsApp',
    secoes: [
      {
        id: 'status',
        nome: 'Status',
        formatos: [
          { id: 'foto', nome: 'Foto', padrao: true },
          { id: 'video', nome: 'Vídeo', padrao: true }
        ]
      },
      {
        id: 'grupos',
        nome: 'Grupos',
        formatos: [
          { id: 'foto', nome: 'Foto', padrao: true },
          { id: 'video', nome: 'Vídeo', padrao: true }
        ]
      },
      {
        id: 'transmissao',
        nome: 'Transmissão',
        formatos: [
          { id: 'foto', nome: 'Foto', padrao: false },
          { id: 'video', nome: 'Vídeo', padrao: false }
        ]
      },
      {
        id: 'canais',
        nome: 'Canais',
        formatos: [
          { id: 'foto', nome: 'Foto', padrao: false },
          { id: 'video', nome: 'Vídeo', padrao: false },
          { id: 'texto', nome: 'Texto', padrao: false }
        ]
      }
    ]
  },
  {
    id: 'tiktok',
    nome: 'TikTok',
    secoes: [
      {
        id: 'for-you',
        nome: 'Vídeo for you',
        formatos: [{ id: 'video', nome: 'Vídeo', padrao: true }]
      },
      {
        id: 'stories',
        nome: 'Stories',
        formatos: [
          { id: 'foto', nome: 'Foto', padrao: true },
          { id: 'video', nome: 'Vídeo', padrao: true }
        ]
      },
      {
        id: 'shop',
        nome: 'TikTok Shop',
        formatos: [{ id: 'video', nome: 'Vídeo', padrao: false }]
      },
      trafego(false)
    ]
  }
]

// identificador de um formato: canal:secao:formato
export const idFormato = (canal: string, secao: string, formato: string) =>
  `${canal}:${secao}:${formato}`

export const formatosPadrao = (canalId: string): string[] => {
  const canal = CANAIS.find(c => c.id === canalId)
  if (!canal) return []
  return canal.secoes.flatMap(secao =>
    secao.formatos.filter(f => f.padrao).map(f => idFormato(canal.id, secao.id, f.id))
  )
}

export const formatosDoCanal = (canalId: string): string[] => {
  const canal = CANAIS.find(c => c.id === canalId)
  if (!canal) return []
  return canal.secoes.flatMap(secao =>
    secao.formatos.map(f => idFormato(canal.id, secao.id, f.id))
  )
}

// canais que a loja publica no dia a dia, marcados ao abrir a etapa
export const CANAIS_PADRAO = ['instagram', 'facebook', 'whatsapp']

export const ACOES_COLECAO: BlocoObjetivos[] = [
  {
    id: 'acelerador-vendas',
    titulo: 'Acelerador de vendas',
    itens: [
      'Gift (presente da coleção) *nas compras acima de X ganha este mimo'
    ]
  }
]

export const nomeCanal = (canalId: string) =>
  CANAIS.find(c => c.id === canalId)?.nome ?? canalId

export interface DescontoCampanha {
  tem: boolean
  percentual: string   // ex.: 30%
  formato: string      // ex.: Progressiva
}

export interface Campanha {
  id: string
  tipo: 'campanha' | 'acao'
  nome: string
  inicio: string       // ISO, YYYY-MM-DD
  fim: string
  escopoGrupos: 'loja' | 'selecao'
  grupos: string[]
  produtos: string[]
  escopoMarcas: 'todas' | 'selecao'
  marcas: string[]
  objetivo: string
  desconto: DescontoCampanha
  canais: string[]
  formatos: string[]
  // uma ação nasce ligada às campanhas escolhidas antes da trilha
  campanhasIds?: string[]
  // quando preenchido, o item está na lixeira e pode voltar
  excluidaEm?: string
  // a ação guarda a direção criativa escolhida e o guia montado com ela
  direcao?: DirecaoCriativa
  moodboard?: MoodboardDados
  criadaEm: string
}

// 01 jan a 05 fev
export const periodoLegivel = (inicio: string, fim: string) => {
  const curto = (iso: string) => {
    const [ano, mes, dia] = iso.split('-').map(Number)
    if (!ano || !mes || !dia) return ''
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
    return `${String(dia).padStart(2, '0')} ${meses[mes - 1]}`
  }
  const a = curto(inicio)
  const b = curto(fim)
  if (!a && !b) return ''
  return a === b ? a : `${a} a ${b}`
}
