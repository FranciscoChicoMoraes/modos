'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Section {
  id: string
  title: string
  content: string
}

const sections: Section[] = [
  {
    id: 'visao-geral',
    title: '1. Visão Geral do Módulo',
    content: `O VideoFlow é um módulo de workflow para criação, classificação e produção de vídeos. Ele vive dentro do SaaS como uma página/rota dedicada e é composto por três camadas funcionais: estruturação de roteiros com IA, classificação automática por dia da semana e kanban de produção com agente de busca de vídeos B-roll.

Proposta de Valor:
• Criação de roteiros assistida por IA com tom adaptado à intensidade do dia
• Classificação automática: o agente decide em qual dia da semana o conteúdo se encaixa melhor
• Kanban de produção com 4 colunas: Roteiro → Gravando → Editando → Publicado
• Enquanto o usuário grava, o agente já buscou e anexou os vídeos B-roll ao card`
  },
  {
    id: 'estrutura-pastas',
    title: '2. Estrutura de Pastas no Next.js',
    content: `seu-saas/
├── app/
│   └── (dashboard)/
│       └── videoflow/
│           ├── page.tsx          ← kanban principal
│           ├── [id]/page.tsx     ← detalhe do card
│           └── novo/page.tsx     ← criar roteiro
├── components/videoflow/
│   ├── KanbanBoard.tsx
│   ├── ScriptCard.tsx
│   └── AgentPanel.tsx
├── lib/videoflow/
│   ├── agent.ts                 ← lógica do agente
│   └── pinterest.ts             ← integração B-roll
└── supabase/migrations/
    └── videoflow_tables.sql`
  },
  {
    id: 'classificacao-dia',
    title: '3. Lógica de Classificação por Dia',
    content: `Divisão da Semana em 3 Tiers:
• HARD (Segunda e Terça): Conteúdo estratégico, gestão, liderança
• MEDIUM (Quarta e Quinta): Conteúdo educativo, ferramentas
• EASY (Sexta, Sábado, Domingo): Conteúdo leve, inspiração, bem-estar

Algoritmo de Inferência:
1º — Palavras-chave de conteúdo Hard detectadas → Segunda
2º — Palavras-chave de conteúdo Easy detectadas → Sexta
3º — Tier declarado como Medium → Quinta
4º — Tier Hard sem keyword específica → Terça
5º — Fallback → Domingo

Keywords Hard: gestão, liderança, crise, estratégia, vendas, marketing, okr, meta, result, funil, equipe
Keywords Easy: case, erro, rotina, livro, ferramenta, bem-estar, carreira, histór, inspiração, propósito`
  },
  {
    id: 'prompts-agente',
    title: '4. Prompts do Agente de IA',
    content: `Geração de Roteiro:
O sistema usa prompts estruturados para gerar roteiros concisos, diretos e envolventes para vídeos de 2-4 minutos.

Extração de Keywords para B-roll:
O agente analisa roteiros e extrai 6-8 palavras-chave em inglês para busca de vídeos B-roll relevantes.
As keywords devem ser em inglês para melhor cobertura no Pinterest.
Sempre fazer strip de markdown antes de JSON.parse().`
  },
  {
    id: 'banco-dados',
    title: '5. Schema do Banco de Dados (Supabase)',
    content: `Tabelas Principais:

scripts - Armazena roteiros e metadata
• id, user_id, title, topic, script_body
• tier (hard, medium, easy)
• day_id (seg-dom), column_id (roteiro, gravando, editando, publicado)
• agent_status (idle, running, done, error)

script_keywords - Palavras-chave extraídas
• id, script_id, keyword, type (keyword ou searchTerm)

script_videos - Vídeos B-roll associados
• id, script_id, title, source, url, tags

Row Level Security: Implementar RLS em todas as tabelas.
Nenhum usuário acessa dados de outro.`
  },
  {
    id: 'api-routes',
    title: '6. API Routes (Next.js)',
    content: `Rota do Agente — /api/videoflow/agent
Executa server-side para proteger a chave da API Anthropic.
Recebe: scriptId, title, scriptBody
Retorna: keywords, searchTerms, videos

Rota de Geração de Roteiro — /api/videoflow/script
Executa server-side com Anthropic Claude Sonnet.
Recebe: title, topic, tier
Retorna: script (texto do roteiro gerado)

Ambas as rotas usam model: 'claude-sonnet-4-20250514' com max_tokens: 1024`
  },
  {
    id: 'design-system',
    title: '7. Design System',
    content: `Componentes Principais:

TierBadge
• Pill colorida exibindo Hard / Medium / Easy
• Props: tier, size (sm, md)
• Background: versão 10% opaca da cor do tier
• Border: versão 30% opaca da cor do tier

KanbanCard
• Card com border-left 3px colorido pelo tier
• Hover: translateY(-1px) + box-shadow sutil
• Ícones de status: 📝 roteiro, 🤖✓ agente, 🎬N vídeos
• Botões ← → para mover entre colunas

AgentPanel
• Estado: idle | running | done | error
• Exibe keywords como pills
• Exibe searchTerms com link direto ao Pinterest`
  },
  {
    id: 'integracao-videos',
    title: '8. Integrações de Vídeos B-Roll',
    content: `Opções Disponíveis:
• Pexels API (recomendado para iniciar - aprovação imediata)
• Pinterest API (adicionar quando em produção)

Implementação com Pexels:
Criar /lib/videoflow/pexels.ts
Buscar vídeos por query com até 6 resultados
Retornar: id, title, url, thumbnail, source

Adicionar variáveis de ambiente:
• PEXELS_API_KEY

Recomendação: Implementar Pexels agora (gratuito) e Pinterest em fase 4.`
  },
  {
    id: 'kanban-estados',
    title: '9. Kanban — Estados e Transições',
    content: `Colunas:
1. Roteiro - Roteiro criado, esperando gravação
2. Gravando - Vídeo sendo gravado
3. Editando - Vídeo em edição
4. Publicado - Vídeo publicado

Automação Sugerida:
• Ao mover para Gravando → disparar o agente automaticamente
• Ao mover para Editando → notificar que B-rolls estão prontos
• Ao mover para Publicado → registrar data/hora e dia da semana para analytics`
  },
  {
    id: 'checklist-impl',
    title: '10. Checklist de Implementação',
    content: `Fase 1 — Fundação (1-2 dias)
☐ Criar rotas: /videoflow e /videoflow/[id]
☐ Configurar Supabase: tabelas e RLS
☐ Mover componentes para /components/videoflow/
☐ Adaptar estado local para Supabase

Fase 2 — Agente (1 dia)
☐ Criar /api/videoflow/agent server-side
☐ Criar /api/videoflow/script server-side
☐ Remover chamadas diretas à Anthropic do frontend
☐ Adicionar ANTHROPIC_API_KEY

Fase 3 — B-roll (1 dia)
☐ Cadastrar na Pexels API
☐ Criar /lib/videoflow/pexels.ts
☐ Integrar Pexels ao agente
☐ Adicionar PEXELS_API_KEY

Fase 4 — Polimentos (1-2 dias)
☐ Filtro por tier e dia da semana
☐ Barra de ritmo semanal
☐ Analytics básico
☐ Integração Pinterest (quando aprovada)

Estimativa Total: 4-6 dias para completo`
  }
]

export default function ConteudosPage() {
  const [expandedId, setExpandedId] = useState<string | null>('visao-geral')

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2 mb-8">
        <h1 className="text-4xl font-bold text-black">VideoFlow</h1>
        <p className="text-gray-600">Especificação Técnica do Módulo de Workflow de Vídeos</p>
        <p className="text-sm text-gray-500">Documento de referência para integração no SaaS • Versão 1.0 • 2025</p>
      </div>

      {/* Conteúdo */}
      <div className="space-y-4">
        {sections.map((section) => (
          <div
            key={section.id}
            className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
          >
            <button
              onClick={() => setExpandedId(expandedId === section.id ? null : section.id)}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <h2 className="text-lg font-semibold text-black text-left">{section.title}</h2>
              {expandedId === section.id ? (
                <ChevronUp size={20} className="text-gray-600 flex-shrink-0" />
              ) : (
                <ChevronDown size={20} className="text-gray-600 flex-shrink-0" />
              )}
            </button>

            {expandedId === section.id && (
              <div className="px-6 py-4 bg-white border-t border-gray-200">
                <div className="prose prose-sm max-w-none">
                  <pre className="bg-gray-50 p-4 rounded overflow-auto text-xs leading-relaxed text-gray-800 font-mono whitespace-pre-wrap break-words">
                    {section.content}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-200 text-sm text-gray-600">
        <p>Documento de referência para implementação do módulo VideoFlow no SaaS Recruta.</p>
        <p className="mt-2">Para dúvidas sobre a arquitetura, consulte a especificação ou entre em contato com o time de desenvolvimento.</p>
      </div>
    </div>
  )
}
