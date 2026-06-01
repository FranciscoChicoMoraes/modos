'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeft, Trash2, RotateCcw } from 'lucide-react'
import { TierBadge } from '@/components/videoflow/TierBadge'

interface Script {
  id: string
  title: string
  tier: 'hard' | 'medium' | 'easy'
  context?: string
  script_body?: string
  column_id: 'roteiro' | 'gravando' | 'editando' | 'publicado'
  agent_status: 'idle' | 'running' | 'done' | 'error'
  videos_count?: number
  day?: 'segunda' | 'terça' | 'quarta' | 'quinta' | 'sexta' | 'sábado' | 'domingo'
  keywords?: string[]
  searchTerms?: string[]
}

type TabType = 'roteiro' | 'agente' | 'videos'

export default function ScriptDetailPage() {
  const router = useRouter()
  const params = useParams()
  const scriptId = params.id as string

  // Mock data - depois virá do banco
  const [script, setScript] = useState<Script>({
    id: scriptId,
    title: 'Como Estruturar uma Estratégia de Vendas',
    tier: 'hard',
    context: 'Liderança, recrutamento, cultura',
    script_body: `[ABERTURA - 0:00-0:15]
"Sabe aquele gestor que faz todo mundo querer sair da empresa? Ele não acordou assim."

[DESENVOLVIMENTO - 0:15-3:00]
1. Liderança é sobre pessoas, não sobre posição
   - O primeiro erro é achar que mandar é liderar
   - Pessoas talentosas saem por causa de chefes, não de empresas

2. Os 3 pilares que todo novo gestor esquece
   - Comunicação clara: diga por que você pediu isso
   - Feedback honesto: aprecie o que funciona
   - Desenvolvimento: invista no crescimento do time

3. Case real: transformar um time tóxico
   - Tomou posse, ouviu o time por 2 semanas
   - Identificou problemas, criou plano de ação
   - 6 meses depois: 0 rotatividade, produtividade +40%

[CTA - 3:00-3:15]
"Se você é novo em gestão, comece ouvindo. O que você já aprendeu como gestor?"`,
    column_id: 'roteiro',
    agent_status: 'idle',
    videos_count: 0,
    day: 'segunda',
    keywords: ['leadership mistakes', 'new manager', 'team management', 'workplace leadership', 'first year manager'],
    searchTerms: ['leadership team office', 'manager speaking', 'team meeting workspace']
  })

  const [activeTab, setActiveTab] = useState<TabType>('roteiro')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = () => {
    // TODO: Integrar com banco
    router.push('/videoflow')
  }

  const handleRegenerate = async () => {
    // TODO: Integrar com Claude
    console.log('Regenerando roteiro...')
  }

  const tabs = [
    { id: 'roteiro' as TabType, label: 'Roteiro' },
    { id: 'agente' as TabType, label: 'Agente IA ✓' },
    { id: 'videos' as TabType, label: `Vídeos (${script.videos_count || 0})` }
  ]

  const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
  const DAY_VALUES = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo']

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-gray-200 pb-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-black transition-colors pt-1"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TierBadge tier={script.tier} size="sm" />
              <span className="text-xs text-gray-500 font-medium">
                {script.day ? DAYS[DAY_VALUES.indexOf(script.day as any)] : '—'}
              </span>
            </div>
            <h1 className="text-xl font-semibold text-black">{script.title}</h1>
            {script.context && (
              <p className="text-sm text-gray-600">{script.context}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="text-red-500 hover:text-red-700 transition-colors p-2"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-red-500 border-b-2 border-red-500'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'roteiro' && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                {script.script_body}
              </p>
            </div>
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-2 text-sm font-medium text-black hover:text-gray-700 transition-colors"
            >
              <RotateCcw size={14} />
              Regenerar com IA
            </button>
          </div>
        )}

        {activeTab === 'agente' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <p className="text-sm text-blue-700 mb-3">
                ✓ Agente executado com sucesso
              </p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-blue-900 mb-2">KEYWORDS EXTRAÍDAS</p>
                  <div className="flex flex-wrap gap-2">
                    {script.keywords?.map(keyword => (
                      <span
                        key={keyword}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-mono"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-900 mb-2">TERMOS DE BUSCA → PINTEREST</p>
                  <div className="space-y-1.5">
                    {script.searchTerms?.map(term => (
                      <div key={term} className="flex items-center justify-between text-xs">
                        <code className="bg-white px-2 py-1 rounded border border-blue-200">
                          {term}
                        </code>
                        <a
                          href={`https://www.pinterest.com/search/?q=${encodeURIComponent(term)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-500 hover:text-red-700 font-medium"
                        >
                          Buscar ↗
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'videos' && (
          <div className="space-y-4">
            <div className="text-center py-12">
              <p className="text-sm text-gray-500 mb-4">
                {script.videos_count ? `${script.videos_count} vídeos encontrados` : 'Nenhum vídeo adicionado ainda'}
              </p>
              {!script.videos_count && (
                <p className="text-xs text-gray-400">
                  Execute o agente IA para buscar vídeos B-roll no Pinterest
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 space-y-4">
            <h2 className="text-lg font-semibold text-black">Deletar roteiro?</h2>
            <p className="text-sm text-gray-600">
              "{script.title}" será removido permanentemente. Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-black font-medium py-2 rounded transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded transition-colors"
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
