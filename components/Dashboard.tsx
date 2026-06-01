'use client'

import { useState } from 'react'
import { CandidateCard } from './CandidateCard'
import { Search } from 'lucide-react'
import type { Candidate } from '@/types'

const MOCK_CANDIDATES: Candidate[] = [
  {
    id: '1',
    platform_id: 'p1',
    name: 'Maria Silva',
    email: 'maria@email.com',
    phone: '(11) 98765-4321',
    experience_years: 3,
    skills: ['Design', 'Photoshop', 'Figma'],
    areas: ['Design Gráfico', 'Produção de Conteúdo'],
    stage: 'curriculum',
    created_at: new Date().toISOString(),
    resume: '',
    social_media: {},
    archived: false,
  },
  {
    id: '2',
    platform_id: 'p2',
    name: 'João Santos',
    email: 'joao@email.com',
    phone: '(11) 91234-5678',
    experience_years: 5,
    skills: ['Edição', 'Premiere', 'After Effects'],
    areas: ['Edição de Vídeo', 'Produção de Conteúdo'],
    stage: 'interview',
    created_at: new Date().toISOString(),
    resume: '',
    social_media: {},
    archived: false,
  },
  {
    id: '3',
    platform_id: 'p3',
    name: 'Ana Costa',
    email: 'ana@email.com',
    phone: '(11) 99876-5432',
    experience_years: 2,
    skills: ['Instagram', 'TikTok', 'Copywriting'],
    areas: ['Social Media', 'Produção de Conteúdo'],
    stage: 'test',
    created_at: new Date().toISOString(),
    resume: '',
    social_media: {},
    archived: false,
  },
]

const STAGES = [
  { id: 'curriculum', label: 'Currículo', color: 'blue' },
  { id: 'interview', label: 'Entrevista', color: 'purple' },
  { id: 'test', label: 'Teste', color: 'amber' },
  { id: 'hired', label: 'Contratada', color: 'green' },
]

export function Dashboard() {
  const [candidates, setCandidates] = useState<Candidate[]>(MOCK_CANDIDATES)
  const [search, setSearch] = useState('')
  const [draggedCandidate, setDraggedCandidate] = useState<string | null>(null)

  const handleDelete = (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta candidata?')) return
    setCandidates(candidates.filter(c => c.id !== id))
  }

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

    setCandidates(
      candidates.map(c =>
        c.id === draggedCandidate
          ? { ...c, stage: newStage as Candidate['stage'] }
          : c
      )
    )
    setDraggedCandidate(null)
  }

  const filtered = candidates.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                       c.email.toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  const getCandidatesByStage = (stageId: string) => {
    return filtered.filter(c => c.stage === stageId)
  }

  const getStageColor = (color: string) => {
    const colors: { [key: string]: string } = {
      blue: 'border-blue-500 bg-blue-50',
      purple: 'border-purple-500 bg-purple-50',
      amber: 'border-amber-500 bg-amber-50',
      green: 'border-green-500 bg-green-50',
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard CRM</h1>
        <p className="text-gray-600">Funil de Recrutamento</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STAGES.map((stage) => {
          const stageCandidates = getCandidatesByStage(stage.id)
          return (
            <div
              key={stage.id}
              className={`flex flex-col rounded-lg shadow-md overflow-hidden ${getStageColor(stage.color)}`}
            >
              {/* Column Header */}
              <div className={`border-b-2 ${getStageColor(stage.color).split(' ')[0]} p-4`}>
                <h2 className="text-lg font-bold text-gray-900">{stage.label}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {stageCandidates.length}
                </p>
              </div>

              {/* Cards Container */}
              <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
                className="flex-1 p-4 space-y-3 overflow-y-auto min-h-[500px] transition-colors"
              >
                {stageCandidates.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">Nenhuma candidata</p>
                  </div>
                ) : (
                  stageCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, candidate.id)}
                      className="cursor-grab active:cursor-grabbing opacity-100 hover:opacity-90 transition-opacity"
                    >
                      <CandidateCard
                        candidate={candidate}
                        onArchive={handleDelete}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
