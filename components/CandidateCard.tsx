'use client'

import { MessageCircle, Eye, Archive } from 'lucide-react'
import { Candidate } from '@/types'

interface CandidateCardProps {
  candidate: Candidate
  onClick?: (candidate: Candidate) => void
  onArchive?: (id: string) => void
}

export function CandidateCard({ candidate, onClick, onArchive }: CandidateCardProps) {
  const handleWhatsapp = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (candidate.whatsapp) {
      window.open(`https://wa.me/${candidate.whatsapp}`, '_blank')
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'curriculum':
        return 'ring-2 ring-amber-400' // Amarelo - Atenção, descoberta
      case 'interview':
        return 'ring-2 ring-purple-500' // Roxo - Profissionalismo, confiança
      case 'test':
        return 'ring-2 ring-blue-500' // Azul - Estabilidade, confiança
      case 'hired':
        return 'ring-2 ring-green-500' // Verde - Sucesso, crescimento
      default:
        return 'ring-2 ring-gray-300'
    }
  }

  return (
    <div
      onClick={() => onClick?.(candidate)}
      className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer group flex gap-3"
    >
      {/* Avatar Circular */}
      <div className="flex-shrink-0">
        {candidate.avatar_url && (
          <img
            src={candidate.avatar_url}
            alt={candidate.name}
            className={`w-14 h-14 rounded-full object-cover object-center flex-shrink-0 ${getStageColor(candidate.stage)} group-hover:scale-105 transition-transform ${candidate.stage === 'test' ? 'animate-blueGradientShine' : ''}`}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Name */}
        <h3 className="text-sm font-semibold text-black truncate">{candidate.name}</h3>

        {/* Company */}
        {candidate.company_name && (
          <p className="text-xs text-gray-700 truncate">{candidate.company_name}</p>
        )}

        {/* Skills & Areas - Inline */}
        {(candidate.skills.length > 0 || candidate.areas.length > 0) && (
          <div className="flex flex-wrap gap-0.5 pt-0.5">
            {candidate.skills.slice(0, 1).map((skill) => (
              <span
                key={skill}
                className="inline-block bg-gray-100 text-gray-800 text-xs px-1.5 py-0.5 rounded"
              >
                {skill}
              </span>
            ))}
            {candidate.areas.slice(0, 1).map((area) => (
              <span
                key={area}
                className="inline-block bg-black text-white text-xs px-1.5 py-0.5 rounded"
              >
                {area}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 pt-1">
          {candidate.whatsapp && (
            <button
              onClick={handleWhatsapp}
              className="p-1 text-green-700 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
              title="WhatsApp"
            >
              <MessageCircle size={14} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClick?.(candidate)
            }}
            className="p-1 text-gray-700 hover:text-black hover:bg-gray-100 rounded transition-colors"
            title="Ver detalhes"
          >
            <Eye size={14} />
          </button>
          {onArchive && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onArchive(candidate.id)
              }}
              className="p-1 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Arquivar"
            >
              <Archive size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
