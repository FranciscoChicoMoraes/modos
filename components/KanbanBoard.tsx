'use client'

import { useState, useEffect } from 'react'
import { CandidateCard } from './CandidateCard'
import { CandidateModal } from './CandidateModal'
import { ArchiveModal } from './ArchiveModal'
import { InterviewScheduleModal } from './InterviewScheduleModal'
import { Search } from 'lucide-react'
import { Candidate } from '@/types'
import { useLocalStorage } from '@/hooks/useLocalStorage'

const MOCK_CANDIDATES: Candidate[] = [
  {
    id: '1',
    platform_id: 'REC-001',
    name: 'Maria Silva',
    email: 'maria@email.com',
    phone: '(11) 98765-4321',
    whatsapp: '5511987654321',
    company_name: 'Tech Studio Brasil',
    experience_years: 3,
    skills: ['Design', 'Photoshop', 'Figma'],
    areas: ['Design Gráfico', 'Produção de Conteúdo'],
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    stage: 'curriculum',
    created_at: '2026-05-20',
    age: 28,
    gender: 'female',
    resume: 'Profissional com 3 anos de experiência em design gráfico e produção de conteúdo.',
    social_media: { instagram: 'maria.silva', linkedin: 'maria-silva-design' },
    archived: false,
  },
  {
    id: '2',
    platform_id: 'REC-002',
    name: 'João Santos',
    email: 'joao@email.com',
    phone: '(11) 91234-5678',
    whatsapp: '5511912345678',
    company_name: 'Criativa Conteúdos',
    experience_years: 5,
    skills: ['Edição', 'Premiere', 'After Effects'],
    areas: ['Edição de Vídeo', 'Produção de Conteúdo'],
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    stage: 'interview',
    created_at: '2026-05-19',
    age: 35,
    gender: 'male',
    resume: 'Editor de vídeo experiente com 5 anos no mercado.',
    social_media: { instagram: 'joao.santos.video', linkedin: 'joao-santos-editor' },
    archived: false,
  },
  {
    id: '3',
    platform_id: 'REC-003',
    name: 'Ana Costa',
    email: 'ana@email.com',
    phone: '(11) 99876-5432',
    whatsapp: '5511998765432',
    company_name: 'Social Trend Marketing',
    experience_years: 2,
    skills: ['Instagram', 'TikTok', 'Copywriting'],
    areas: ['Social Media', 'Produção de Conteúdo'],
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    stage: 'test',
    created_at: '2026-05-18',
    age: 25,
    gender: 'female',
    resume: 'Especialista em social media com foco em criação de conteúdo.',
    social_media: { instagram: 'ana.costa.sm', linkedin: 'ana-costa-social' },
    archived: false,
  },
]

const STAGES = [
  { id: 'curriculum', label: 'Currículo' },
  { id: 'interview', label: 'Entrevista' },
  { id: 'test', label: 'Teste' },
  { id: 'hired', label: 'Contratada' },
]

export function KanbanBoard() {
  const [candidates, setCandidates, isCandidatesLoaded] = useLocalStorage<Candidate[]>('candidates', MOCK_CANDIDATES)
  const [search, setSearch] = useState('')
  const [draggedCandidate, setDraggedCandidate] = useState<string | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [archiveCandidate, setArchiveCandidate] = useState<{ id: string; name: string } | null>(null)
  const [interviewScheduling, setInterviewScheduling] = useState<Candidate | null>(null)

  const handleDragStart = (e: React.DragEvent, candidateId: string) => {
    setDraggedCandidate(candidateId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, newStage: string) => {
    e.preventDefault()
    if (!draggedCandidate) return

    if (newStage === 'interview') {
      const movedCandidate = candidates.find(c => c.id === draggedCandidate)
      if (movedCandidate) {
        setInterviewScheduling(movedCandidate)
      }
    } else {
      const updatedCandidates = candidates.map(c =>
        c.id === draggedCandidate
          ? { ...c, stage: newStage as Candidate['stage'] }
          : c
      )
      setCandidates(updatedCandidates)
    }

    setDraggedCandidate(null)
  }

  const handleArchiveClick = (id: string) => {
    const candidate = candidates.find(c => c.id === id)
    if (candidate) {
      setArchiveCandidate({ id, name: candidate.name })
    }
  }

  const handleConfirmArchive = (reason: string) => {
    if (archiveCandidate) {
      setCandidates(
        candidates.map(c =>
          c.id === archiveCandidate.id
            ? { ...c, archived: true, archive_reason: reason as 'gave_up' | 'other' }
            : c
        )
      )
      setArchiveCandidate(null)
    }
  }

  const handleScheduleInterview = (candidateId: string, date: string, time: string) => {
    setCandidates(
      candidates.map(c =>
        c.id === candidateId
          ? {
              ...c,
              stage: 'interview',
              interview_scheduled: {
                date,
                time,
              },
            }
          : c
      )
    )
    setInterviewScheduling(null)
  }

  const filtered = candidates.filter(c => {
    if (c.archived) return false
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                       c.email.toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  const getCandidatesByStage = (stageId: string) => {
    return filtered.filter(c => c.stage === stageId)
  }

  if (!isCandidatesLoaded) return null

  return (
    <div className="space-y-8">
      {/* Search */}
      <div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black"
          />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {STAGES.map((stage) => {
          const stageCandidates = getCandidatesByStage(stage.id)
          return (
            <div key={stage.id} className="flex flex-col">
              {/* Column Header */}
              <div className="mb-4 pb-3 border-b border-black">
                <h2 className="text-sm font-semibold text-black uppercase tracking-wide">{stage.label}</h2>
                <p className="text-xs text-gray-500 mt-2">{stageCandidates.length}</p>
              </div>

              {/* Cards Container */}
              <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
                className="flex-1 space-y-2 min-h-[400px]"
              >
                {stageCandidates.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-xs text-gray-300">—</p>
                  </div>
                ) : (
                  stageCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, candidate.id)}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <CandidateCard
                        candidate={candidate}
                        onClick={setSelectedCandidate}
                        onArchive={handleArchiveClick}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      <CandidateModal
        candidate={selectedCandidate}
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onArchive={handleArchiveClick}
      />

      {/* Archive Modal */}
      <ArchiveModal
        isOpen={!!archiveCandidate}
        onClose={() => setArchiveCandidate(null)}
        onConfirm={handleConfirmArchive}
        candidateName={archiveCandidate?.name || ''}
      />

      {/* Interview Schedule Modal */}
      <InterviewScheduleModal
        isOpen={!!interviewScheduling}
        candidate={interviewScheduling}
        onClose={() => setInterviewScheduling(null)}
        onSchedule={handleScheduleInterview}
      />
    </div>
  )
}
