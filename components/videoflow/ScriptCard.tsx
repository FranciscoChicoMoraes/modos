'use client'

import { ChevronLeft, ChevronRight, Trash2, Eye } from 'lucide-react'
import { TierBadge } from './TierBadge'

interface Script {
  id: string
  title: string
  tier: 'hard' | 'medium' | 'easy'
  script_body?: string
  agent_status: 'idle' | 'running' | 'done' | 'error'
  videos_count?: number
}

interface ScriptCardProps {
  script: Script
  onMove: (direction: 'left' | 'right') => void
  onView: () => void
  onDelete: () => void
}

export function ScriptCard({ script, onMove, onView, onDelete }: ScriptCardProps) {
  const tierColors = {
    hard: 'border-red-400',
    medium: 'border-yellow-400',
    easy: 'border-green-400'
  }

  const statusIcons = {
    idle: '📝',
    running: '🤖',
    done: '✓',
    error: '❌'
  }

  return (
    <div className={`border-l-4 ${tierColors[script.tier]} bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all hover:-translate-y-0.5`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-black text-sm line-clamp-2">{script.title}</h3>
          <TierBadge tier={script.tier} size="sm" />
        </div>
        <button
          onClick={onDelete}
          className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Status */}
      <div className="text-xs text-gray-600 mb-3 space-y-1">
        <div className="flex items-center gap-1">
          <span>{statusIcons[script.agent_status]} Agente: {script.agent_status}</span>
        </div>
        {script.videos_count !== undefined && (
          <div>
            🎬 {script.videos_count} vídeos B-roll
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onMove('left')}
          className="flex-1 px-2 py-1.5 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium text-gray-700 transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={onView}
          className="flex-1 px-2 py-1.5 bg-black hover:bg-gray-800 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
        >
          <Eye size={14} />
          Ver
        </button>
        <button
          onClick={() => onMove('right')}
          className="flex-1 px-2 py-1.5 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium text-gray-700 transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
