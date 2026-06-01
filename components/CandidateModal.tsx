'use client'

import { X, Mail, Phone, Download, MessageCircle, Eye, Archive, Calendar } from 'lucide-react'
import { Candidate } from '@/types'
import { useState } from 'react'

interface CandidateModalProps {
  candidate: Candidate | null
  isOpen: boolean
  onClose: () => void
  onArchive?: (id: string) => void
}

export function CandidateModal({ candidate, isOpen, onClose, onArchive }: CandidateModalProps) {
  const [showResume, setShowResume] = useState(false)

  if (!isOpen || !candidate) return null

  const handleWhatsapp = () => {
    if (candidate.whatsapp) {
      window.open(`https://wa.me/${candidate.whatsapp}`, '_blank')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal com animação */}
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto relative shadow-2xl animate-modalSlideIn">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-black">Ficha do Candidato</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black transition-colors hover:scale-110 duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            {candidate.avatar_url && (
              <img
                src={candidate.avatar_url}
                alt={candidate.name}
                className="w-32 h-32 rounded-full object-cover border-2 border-black animate-avatarFadeIn"
              />
            )}
            <h3 className="text-xl font-semibold text-black mt-4">{candidate.name}</h3>
            {candidate.company_name && (
              <p className="text-sm text-gray-600 mt-1">{candidate.company_name}</p>
            )}
          </div>

          {/* Resume Summary */}
          <div className="border-t border-gray-200 pt-6">
            <button
              onClick={() => setShowResume(!showResume)}
              className="flex items-center gap-2 w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium text-black transition-all duration-200 hover:shadow-md"
            >
              <Eye size={16} />
              Resumo do Candidato
            </button>

            {showResume && (
              <div className="mt-4 p-4 bg-gray-50 rounded text-sm text-gray-700 max-h-40 overflow-y-auto animate-expandDown">
                <p>
                  {candidate.resume || 'Profissional dedicado em ' + (candidate.areas[0] || 'sua área') + ' com ' + (candidate.experience_years || 0) + ' anos de experiência. Possui expertise em ' + candidate.skills.slice(0, 3).join(', ') + '.'}
                </p>
              </div>
            )}
          </div>

          {/* Date & Basic Info */}
          <div className="space-y-2 text-sm border-t border-gray-200 pt-6">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-500" />
              <span className="text-gray-700">
                Inscrição: <span className="font-semibold text-black">{candidate.created_at}</span>
              </span>
            </div>
            {candidate.age && (
              <div className="text-gray-700">
                Idade: <span className="font-semibold text-black">{candidate.age} anos</span>
              </div>
            )}
            {candidate.gender && (
              <div className="text-gray-700">
                Sexo: <span className="font-semibold text-black">
                  {candidate.gender === 'male' ? 'Masculino' : candidate.gender === 'female' ? 'Feminino' : 'Outro'}
                </span>
              </div>
            )}
            <div className="text-gray-700">
              <span className="font-semibold text-black text-sm">{candidate.platform_id}</span>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-3 border-y border-gray-200 py-6">
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-gray-600" />
              <div>
                <p className="text-xs text-gray-700 font-medium">Email</p>
                <a
                  href={`mailto:${candidate.email}`}
                  className="text-sm text-black hover:underline"
                >
                  {candidate.email}
                </a>
              </div>
            </div>
            {candidate.phone && (
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-gray-600" />
                <div>
                  <p className="text-xs text-gray-700 font-medium">Telefone</p>
                  <p className="text-sm text-black">{candidate.phone}</p>
                </div>
              </div>
            )}
            {candidate.whatsapp && (
              <button
                onClick={handleWhatsapp}
                className="flex items-center gap-3 mt-3 transition-transform duration-200 hover:scale-105"
              >
                <div className="w-9 h-9 bg-green-100 rounded flex items-center justify-center">
                  <MessageCircle size={18} className="text-green-600" />
                </div>
                <span className="text-sm text-green-600 hover:text-green-700 font-medium">Abrir WhatsApp</span>
              </button>
            )}
          </div>

          {/* Skills */}
          {candidate.skills.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-800 uppercase tracking-wide mb-2">Habilidades</p>
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-gray-100 text-gray-900 text-xs px-2.5 py-1 rounded transition-transform duration-200 hover:bg-gray-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Areas */}
          {candidate.areas.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-800 uppercase tracking-wide mb-2">Áreas</p>
              <div className="flex flex-wrap gap-1.5">
                {candidate.areas.map((area) => (
                  <span
                    key={area}
                    className="bg-black text-white text-xs px-2.5 py-1 rounded transition-transform duration-200 hover:bg-gray-900"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Resume File */}
          {candidate.resume_url && (
            <a
              href={candidate.resume_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-black hover:bg-gray-800 text-white font-semibold py-2 rounded text-sm transition-all duration-200 hover:shadow-lg"
            >
              <Download size={16} />
              Download CV
            </a>
          )}

          {/* Archive Button */}
          {onArchive && (
            <button
              onClick={() => {
                onArchive(candidate.id)
                onClose()
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded text-sm font-medium hover:bg-red-50 transition-all duration-200 hover:shadow-md"
            >
              <Archive size={16} />
              Arquivar Candidata
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
