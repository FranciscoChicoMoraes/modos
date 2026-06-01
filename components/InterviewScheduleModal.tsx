'use client'

import { useState } from 'react'
import { X, Calendar, Clock, Link as LinkIcon } from 'lucide-react'
import { Candidate } from '@/types'

interface InterviewScheduleModalProps {
  isOpen: boolean
  candidate: Candidate | null
  onClose: () => void
  onSchedule: (candidateId: string, date: string, time: string) => void
}

export function InterviewScheduleModal({
  isOpen,
  candidate,
  onClose,
  onSchedule,
}: InterviewScheduleModalProps) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [generatedMeetLink, setGeneratedMeetLink] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  if (!isOpen || !candidate) return null

  const handleGenerateMeetLink = async () => {
    if (!date.trim() || !time.trim()) {
      alert('Por favor, selecione a data e hora da entrevista')
      return
    }

    setIsGenerating(true)
    try {
      // Simulate API call to generate Google Meet link
      await new Promise(resolve => setTimeout(resolve, 1000))

      // In production, this would call your backend which calls Google Meet API
      const meetLink = `https://meet.google.com/${Math.random().toString(36).substr(2, 9)}`
      setGeneratedMeetLink(meetLink)
    } catch (error) {
      console.error('Erro ao gerar link:', error)
      alert('Erro ao gerar link de reunião')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleConfirmSchedule = () => {
    if (!date || !time) {
      alert('Por favor, preencha data e hora')
      return
    }
    onSchedule(candidate.id, date, time)
    handleClose()
  }

  const handleClose = () => {
    setDate('')
    setTime('')
    setGeneratedMeetLink(null)
    onClose()
  }

  const copyMeetLink = () => {
    if (generatedMeetLink) {
      navigator.clipboard.writeText(generatedMeetLink)
      alert('Link copiado para a área de transferência!')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="bg-white rounded-lg max-w-md w-full shadow-2xl relative animate-modalSlideIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Agendar Entrevista</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors hover:scale-110 duration-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Candidate Info */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <p className="text-sm text-gray-600">Candidata</p>
            <p className="text-lg font-semibold text-gray-900">{candidate.name}</p>
            <p className="text-sm text-gray-500">{candidate.email}</p>
          </div>

          {/* Date Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar size={16} />
              Data da Entrevista
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all duration-200"
            />
          </div>

          {/* Time Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Clock size={16} />
              Hora da Entrevista
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all duration-200"
            />
          </div>

          {/* Generated Meet Link */}
          {generatedMeetLink && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-expandDown">
              <p className="text-sm font-medium text-green-900 mb-3 flex items-center gap-2">
                <LinkIcon size={16} />
                Link do Google Meet
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={generatedMeetLink}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm bg-white border border-green-200 rounded text-gray-700 transition-all duration-200"
                />
                <button
                  onClick={copyMeetLink}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded font-medium transition-all duration-200 hover:shadow-md"
                >
                  Copiar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all duration-200 hover:shadow-md"
          >
            Cancelar
          </button>
          {!generatedMeetLink ? (
            <button
              onClick={handleGenerateMeetLink}
              disabled={isGenerating || !date || !time}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md"
            >
              {isGenerating ? 'Gerando...' : 'Gerar Link Google Meet'}
            </button>
          ) : (
            <button
              onClick={handleConfirmSchedule}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md"
            >
              Confirmar Agendamento
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
