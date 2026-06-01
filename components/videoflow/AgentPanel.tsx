'use client'

import { Loader } from 'lucide-react'

interface AgentPanelProps {
  status: 'idle' | 'running' | 'done' | 'error'
  keywords?: string[]
  searchTerms?: string[]
  error?: string
  onRun?: () => void
}

export function AgentPanel({ status, keywords = [], searchTerms = [], error, onRun }: AgentPanelProps) {
  const statusConfig = {
    idle: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Pronto' },
    running: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'Processando...' },
    done: { bg: 'bg-green-100', text: 'text-green-600', label: 'Concluído' },
    error: { bg: 'bg-red-100', text: 'text-red-600', label: 'Erro' }
  }

  const config = statusConfig[status]

  return (
    <div className={`${config.bg} rounded-lg p-4 space-y-4`}>
      {/* Status */}
      <div className="flex items-center gap-2">
        {status === 'running' && <Loader size={16} className="animate-spin" />}
        <span className={`${config.text} font-semibold text-sm`}>{config.label}</span>
      </div>

      {/* Keywords */}
      {keywords.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">Keywords Extraídas:</p>
          <div className="flex flex-wrap gap-2">
            {keywords.map((kw, i) => (
              <span key={i} className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search Terms */}
      {searchTerms.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">Termos de Busca B-roll:</p>
          <div className="space-y-1">
            {searchTerms.map((term, i) => (
              <a
                key={i}
                href={`https://www.pinterest.com/search/videos/?q=${encodeURIComponent(term)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-blue-600 hover:underline truncate"
                title={term}
              >
                🔗 {term}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-2">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Run Button */}
      {status === 'idle' && onRun && (
        <button
          onClick={onRun}
          className="w-full bg-black hover:bg-gray-800 text-white text-xs font-medium py-2 rounded transition-colors"
        >
          Executar Agente
        </button>
      )}
    </div>
  )
}
