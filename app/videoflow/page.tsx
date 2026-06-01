'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, Trash2, X } from 'lucide-react'
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
}

type TierFilter = 'all' | 'hard' | 'medium' | 'easy'
type DayFilter = 'all' | 'segunda' | 'terça' | 'quarta' | 'quinta' | 'sexta' | 'sábado' | 'domingo'

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const DAY_VALUES: DayFilter[] = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo']
const COLUMNS = ['roteiro', 'gravando', 'editando', 'publicado'] as const
const COLUMN_LABELS = { roteiro: 'ROTEIRO', gravando: 'GRAVANDO', editando: 'EDITANDO', publicado: 'PUBLICADO' }

export default function VideoFlowPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [scripts, setScripts] = useState<Script[]>([
    {
      id: '1',
      title: 'Como Estruturar uma Estratégia de Vendas',
      tier: 'hard',
      context: 'Liderança, recrutamento, cultura',
      column_id: 'roteiro',
      agent_status: 'idle',
      videos_count: 0,
      day: 'segunda'
    },
    {
      id: '2',
      title: 'Erros Comuns em Apresentações',
      tier: 'easy',
      context: 'Comunicação, técnicas práticas',
      column_id: 'gravando',
      agent_status: 'done',
      videos_count: 3,
      day: 'sexta'
    },
    {
      id: '3',
      title: 'Design Thinking na prática: do problema à solução',
      tier: 'medium',
      context: 'Inovação, metodologia, cases reais',
      column_id: 'roteiro',
      agent_status: 'idle',
      videos_count: 0,
      day: 'quinta'
    }
  ])

  const [tierFilter, setTierFilter] = useState<TierFilter>('all')
  const [dayFilter, setDayFilter] = useState<DayFilter>('all')
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null)
  const [draggedScriptId, setDraggedScriptId] = useState<string | null>(null)

  const filteredScripts = scripts.filter(s => {
    const tierMatch = tierFilter === 'all' || s.tier === tierFilter
    const dayMatch = dayFilter === 'all' || s.day === dayFilter
    const searchMatch = !searchQuery ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.context?.toLowerCase().includes(searchQuery.toLowerCase())
    return tierMatch && dayMatch && searchMatch
  })

  const handleDelete = (scriptId: string) => {
    setScripts(scripts.filter(s => s.id !== scriptId))
    setDeleteConfirmId(null)
  }

  const handleNavigateToDetail = (scriptId: string) => {
    router.push(`/videoflow/${scriptId}`)
  }

  const getTierColor = (tier: string) => {
    switch(tier) {
      case 'hard': return 'border-l-red-500'
      case 'medium': return 'border-l-yellow-500'
      case 'easy': return 'border-l-green-500'
      default: return 'border-l-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'idle': return '📝'
      case 'running': return '⚙️'
      case 'done': return '✓'
      case 'error': return '⚠️'
      default: return '•'
    }
  }

  const countByStatus = (columnId: string) => {
    return filteredScripts.filter(s => s.column_id === columnId).length
  }

  const getScriptsByColumn = (columnId: string) => {
    return filteredScripts.filter(s => s.column_id === columnId)
  }

  const countByDay = (day: DayFilter) => {
    return scripts.filter(s => s.day === day).length
  }

  const handleDragStart = (scriptId: string) => {
    setDraggedScriptId(scriptId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (columnId: string) => {
    if (!draggedScriptId) return

    setScripts(scripts.map(s =>
      s.id === draggedScriptId
        ? { ...s, column_id: columnId as Script['column_id'] }
        : s
    ))
    setDraggedScriptId(null)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-semibold text-black">VideoFlow</h1>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span className="flex items-center gap-1"><strong className="text-black text-sm">{scripts.length}</strong> roteiros</span>
            <span className="flex items-center gap-1"><strong className="text-black text-sm">{scripts.filter(s => s.column_id === 'gravando').length}</strong> gravando</span>
            <span className="flex items-center gap-1"><strong className="text-black text-sm">{scripts.filter(s => s.agent_status === 'running').length}</strong> IA</span>
            <span className="flex items-center gap-1"><strong className="text-black text-sm">{scripts.filter(s => s.videos_count && s.videos_count > 0).length}</strong> vídeos</span>
          </div>
        </div>
        <Link
          href="/videoflow/novo"
          className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-1.5 px-3 rounded flex items-center gap-1.5 transition-colors"
        >
          <Plus size={16} />
          Novo
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por título ou contexto..."
          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-black"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filtros e Grid de Dias */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400">Filtrar:</span>
          <button
            onClick={() => setTierFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              tierFilter === 'all'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          <div className="flex gap-1.5">
            {(['hard', 'medium', 'easy'] as const).map(tier => (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                  tierFilter === tier
                    ? 'bg-gray-200 text-gray-900'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-150'
                }`}
              >
                {tier === 'hard' && '🔥'}
                {tier === 'medium' && '⚡'}
                {tier === 'easy' && '🌿'}
                {tier}
              </button>
            ))}
          </div>
          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value as DayFilter)}
            className="ml-auto px-3 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white focus:outline-none focus:border-black cursor-pointer"
          >
            <option value="all">Todos os dias</option>
            {DAY_VALUES.map((day, i) => (
              <option key={day} value={day}>{DAYS[i]}</option>
            ))}
          </select>
        </div>

        {/* Grid de Dias */}
        <div className="bg-gradient-to-r from-red-50 via-yellow-50 to-green-50 rounded p-3">
          <div className="grid grid-cols-7 gap-2 text-center">
            {DAYS.map((day, i) => (
              <div key={day}>
                <p className="text-xs text-gray-500 font-medium">{day}</p>
                <p className="text-sm font-bold text-black">{countByDay(DAY_VALUES[i])}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Colunas de Status */}
      <div className="grid grid-cols-4 gap-3">
        {COLUMNS.map(columnId => (
          <div
            key={columnId}
            className="bg-gray-50 rounded p-3 min-h-96"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(columnId)}
          >
            <h3 className="text-xs font-bold text-gray-700 uppercase mb-3 tracking-wider">
              {COLUMN_LABELS[columnId]} <span className="text-gray-500 font-normal">({countByStatus(columnId)})</span>
            </h3>
            <div className="space-y-2">
              {getScriptsByColumn(columnId).map(script => (
                <button
                  key={script.id}
                  draggable
                  onDragStart={() => handleDragStart(script.id)}
                  onClick={() => handleNavigateToDetail(script.id)}
                  className={`w-full text-left bg-white rounded p-3 border-l-3 ${getTierColor(script.tier)} cursor-move hover:shadow-sm transition-all group ${draggedScriptId === script.id ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <TierBadge tier={script.tier} size="sm" />
                        <span className="text-sm">{getStatusIcon(script.agent_status)}</span>
                      </div>
                      <h4 className="font-semibold text-black text-xs mb-0.5 line-clamp-2">
                        {script.title}
                      </h4>
                      {script.context && (
                        <p className="text-xs text-gray-500 mb-1.5">{script.context}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{script.day ? DAYS[DAY_VALUES.indexOf(script.day as DayFilter)] : '•'}</span>
                        {script.videos_count !== undefined && script.videos_count > 0 && (
                          <span>🎬 {script.videos_count}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteConfirmId(script.id)
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </button>
              ))}
              {getScriptsByColumn(columnId).length === 0 && (
                <p className="text-xs text-gray-400 text-center py-6">—</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 space-y-4">
            <h2 className="text-lg font-semibold text-black">Deletar roteiro?</h2>
            <p className="text-sm text-gray-600">
              "{scripts.find(s => s.id === deleteConfirmId)?.title}" será removido permanentemente.
            </p>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-black font-medium py-2 rounded transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
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
