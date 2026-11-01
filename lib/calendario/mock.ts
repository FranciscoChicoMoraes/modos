import type { Mes } from './types'

// Dados de exemplo, fáceis de trocar por uma API depois:
// basta substituir MESES por um fetch que devolva Mes[].

const img = (seed: string) => `https://picsum.photos/seed/${seed}/400/600`

const MESES_BASE: Mes[] = [
  {
    id: 'ago',
    titulo: 'Agosto',
    semanas: [
      {
        id: 'ago-s1',
        titulo: 'Semana 1',
        dias: [
          {
            id: 'ago-s1-d1',
            titulo: 'Segunda: Fundamentos de Prompt',
            descricao: 'A base para escrever prompts que geram legendas melhores.',
            imagem: img('prompt'),
            data: '2026-08-03',
            badges: ['4 módulos', '12 aulas'],
            duracao: '45 min',
            href: '/conteudos'
          },
          {
            id: 'ago-s1-d2',
            titulo: 'Terça: Planejamento de Feed',
            descricao: 'Como montar um grid equilibrado para o mês inteiro.',
            imagem: img('feed'),
            data: '2026-08-04',
            badges: ['3 módulos'],
            duracao: '35 min',
            href: '/feed'
          },
          {
            id: 'ago-s1-d3',
            titulo: 'Quarta: Fotografia de Produto',
            descricao: 'Luz, ângulo e composição para joias e óculos.',
            imagem: img('foto'),
            data: '2026-08-05',
            badges: ['5 aulas'],
            duracao: '50 min',
            href: '/conteudos'
          },
          {
            id: 'ago-s1-d4',
            titulo: 'Quinta: Legendas que Vendem',
            descricao: 'Estruturas de copy para produto, prova social e oferta.',
            imagem: img('copy'),
            data: '2026-08-06',
            badges: ['2 módulos', '8 aulas'],
            duracao: '40 min',
            href: '/conteudos'
          },
          {
            id: 'ago-s1-d5',
            titulo: 'Sexta: Reels de Bastidores',
            descricao: 'Roteiros rápidos para gravar em loja sem produção.',
            imagem: img('reels'),
            data: '2026-08-07',
            badges: ['6 roteiros'],
            duracao: '30 min',
            href: '/videoflow'
          },
          {
            id: 'ago-s1-d6',
            titulo: 'Sábado: Revisão da Semana',
            descricao: 'Checklist do que publicar e o que medir.',
            imagem: img('revisao'),
            data: '2026-08-08',
            badges: ['Checklist'],
            duracao: '20 min',
            href: '/dashboard'
          }
        ]
      },
      {
        id: 'ago-s2',
        titulo: 'Semana 2',
        dias: [
          {
            id: 'ago-s2-d1',
            titulo: 'Segunda: Calendário Editorial',
            descricao: 'Distribuindo temas e formatos ao longo do mês.',
            imagem: img('editorial'),
            data: '2026-08-10',
            badges: ['3 módulos'],
            duracao: '38 min',
            href: '/conteudos'
          },
          {
            id: 'ago-s2-d2',
            titulo: 'Terça: Stories com Enquetes',
            descricao: 'Sequências de stories que puxam conversa e direct.',
            imagem: img('stories'),
            data: '2026-08-11',
            badges: ['4 aulas'],
            duracao: '25 min',
            href: '/conteudos'
          },
          {
            id: 'ago-s2-d3',
            titulo: 'Quarta: Campanha Dia dos Pais',
            descricao: 'Do conceito à arte final da campanha sazonal.',
            imagem: img('pais'),
            data: '2026-08-12',
            badges: ['Campanha', '5 peças'],
            duracao: '55 min',
            href: '/marketing'
          },
          {
            id: 'ago-s2-d4',
            titulo: 'Quinta: Carrosséis Educativos',
            descricao: 'Estrutura de 7 slides que segura a atenção.',
            imagem: img('carrossel'),
            data: '2026-08-13',
            badges: ['2 módulos'],
            duracao: '42 min',
            href: '/feed'
          },
          {
            id: 'ago-s2-d5',
            titulo: 'Sexta: Métricas que Importam',
            descricao: 'Alcance, salvamentos e conversa: o que olhar de verdade.',
            imagem: img('metricas'),
            data: '2026-08-14',
            badges: ['Planilha'],
            duracao: '35 min',
            href: '/dashboard'
          }
        ]
      }
    ]
  },
  {
    id: 'set',
    titulo: 'Setembro',
    semanas: [
      {
        id: 'set-s1',
        titulo: 'Semana 1',
        dias: [
          {
            id: 'set-s1-d1',
            titulo: 'Segunda: Primavera nas Vitrines',
            descricao: 'Abertura da estação: paleta, adereços e cenários.',
            imagem: img('primavera'),
            data: '2026-09-07',
            badges: ['Coleção'],
            duracao: '40 min',
            href: '/marketing'
          },
          {
            id: 'set-s1-d2',
            titulo: 'Terça: Vídeo com o Celular',
            descricao: 'Configurações, estabilização e cortes no CapCut.',
            imagem: img('celular'),
            data: '2026-09-08',
            badges: ['3 módulos', '10 aulas'],
            duracao: '48 min',
            href: '/videoflow'
          },
          {
            id: 'set-s1-d3',
            titulo: 'Quarta: Parcerias com Criadores',
            descricao: 'Como propor collab com criadores locais.',
            imagem: img('collab'),
            data: '2026-09-09',
            badges: ['Modelos de proposta'],
            duracao: '30 min',
            href: '/conteudos'
          },
          {
            id: 'set-s1-d4',
            titulo: 'Quinta: Trilhas e Tendências',
            descricao: 'Onde achar áudios em alta e como adaptar ao nicho.',
            imagem: img('trilhas'),
            data: '2026-09-10',
            badges: ['Playlist'],
            duracao: '22 min',
            href: '/playlist'
          },
          {
            id: 'set-s1-d5',
            titulo: 'Sexta: Oferta de Fim de Semana',
            descricao: 'Sequência de posts para promoção relâmpago.',
            imagem: img('oferta'),
            data: '2026-09-11',
            badges: ['4 peças'],
            duracao: '33 min',
            href: '/marketing'
          },
          {
            id: 'set-s1-d6',
            titulo: 'Sábado: Sessão de Dúvidas',
            descricao: 'Encontro ao vivo para revisar a semana.',
            imagem: img('duvidas'),
            data: '2026-09-12',
            badges: ['Ao vivo'],
            duracao: '60 min',
            href: '/conteudos'
          },
          {
            id: 'set-s1-d7',
            titulo: 'Domingo: Inspiração da Semana',
            descricao: 'Curadoria de perfis e campanhas para se inspirar.',
            imagem: img('inspiracao'),
            data: '2026-09-13',
            badges: ['Curadoria'],
            duracao: '15 min',
            href: '/conteudos'
          }
        ]
      },
      {
        id: 'set-s2',
        titulo: 'Semana 2',
        dias: [
          {
            id: 'set-s2-d1',
            titulo: 'Segunda: Branding para Lojas',
            descricao: 'Identidade visual consistente em todos os pontos.',
            imagem: img('branding'),
            data: '2026-09-14',
            badges: ['4 módulos'],
            duracao: '52 min',
            href: '/conteudos'
          },
          {
            id: 'set-s2-d2',
            titulo: 'Terça: Tráfego Local',
            descricao: 'Anúncios com raio de alcance para loja física.',
            imagem: img('trafego'),
            data: '2026-09-15',
            badges: ['2 módulos', '9 aulas'],
            duracao: '47 min',
            href: '/marketing'
          },
          {
            id: 'set-s2-d3',
            titulo: 'Quarta: WhatsApp que Converte',
            descricao: 'Catálogo, respostas rápidas e follow up de vendas.',
            imagem: img('whats'),
            data: '2026-09-16',
            badges: ['Scripts'],
            duracao: '36 min',
            href: '/conteudos'
          },
          {
            id: 'set-s2-d4',
            titulo: 'Quinta: Eventos em Loja',
            descricao: 'Planejamento e divulgação de um evento presencial.',
            imagem: img('evento'),
            data: '2026-09-17',
            badges: ['Checklist', '3 aulas'],
            duracao: '44 min',
            href: '/playlist'
          },
          {
            id: 'set-s2-d5',
            titulo: 'Sexta: Fechamento do Mês',
            descricao: 'Relatório simples para apresentar ao cliente.',
            imagem: img('fechamento'),
            data: '2026-09-18',
            badges: ['Modelo pronto'],
            duracao: '28 min',
            href: '/dashboard'
          }
        ]
      }
    ]
  }
]

// Cada dia aponta para a sua página de briefing (/calendario/[dia]),
// identificada pela data ISO. O href original do mock fica de lado até
// os conteúdos finais existirem.
export const MESES: Mes[] = MESES_BASE.map(mes => ({
  ...mes,
  semanas: mes.semanas.map(semana => ({
    ...semana,
    dias: semana.dias.map(dia => ({ ...dia, href: `/calendario/${dia.data}` }))
  }))
}))
