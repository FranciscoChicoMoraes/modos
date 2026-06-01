'use client'

import { useState, useMemo } from 'react'
import { Candidate } from '@/types'
import { Search } from 'lucide-react'
import { CandidateCard } from '@/components/CandidateCard'
import { CandidateModal } from '@/components/CandidateModal'
import { ArchiveModal } from '@/components/ArchiveModal'
import { useLocalStorage } from '@/hooks/useLocalStorage'

interface Tarefa {
  id: string
  descricao: string
  data: string
  periodo: 'manha' | 'tarde'
  concluida: boolean
}

interface Empresa {
  id: string
  nome: string
  cor: string
  tarefas: Tarefa[]
}

const MOCK_EMPRESAS: Empresa[] = [
  {
    id: '1',
    nome: 'TOK MÁGIKO',
    cor: 'red',
    tarefas: [
      { id: '1-1', descricao: 'Ads tok', data: '31/05/2026', periodo: 'manha', concluida: false },
      { id: '1-2', descricao: 'Guia Expoari', data: '31/05/2026', periodo: 'tarde', concluida: false },
      { id: '1-3', descricao: 'Reunião Daiane', data: '01/06/2026', periodo: 'manha', concluida: false },
    ],
  },
  {
    id: '2',
    nome: 'DIANA FELIX',
    cor: 'gray',
    tarefas: [
      { id: '2-1', descricao: 'Ads tok', data: '31/05/2026', periodo: 'manha', concluida: false },
      { id: '2-2', descricao: 'Reunião', data: '02/06/2026', periodo: 'tarde', concluida: true },
    ],
  },
  {
    id: '3',
    nome: 'ÓTICAMILA',
    cor: 'green',
    tarefas: [
      { id: '3-1', descricao: 'Campanha', data: '01/06/2026', periodo: 'manha', concluida: false },
    ],
  },
]

const MOCK_CANDIDATES: Candidate[] = [
  {
    id: '1',
    platform_id: 'REC-001',
    name: 'Maria Silva',
    email: 'maria@email.com',
    phone: '(11) 98765-4321',
    whatsapp: '5511987654321',
    experience_years: 3,
    skills: ['Design', 'Photoshop', 'Figma'],
    areas: ['Design Gráfico', 'Produção de Conteúdo'],
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    stage: 'curriculum',
    created_at: '2026-05-20',
    age: 28,
    gender: 'female',
    resume: 'Profissional com 3 anos de experiência em design gráfico.',
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
    experience_years: 5,
    skills: ['Edição', 'Premiere', 'After Effects'],
    areas: ['Edição de Vídeo', 'Produção de Conteúdo'],
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    stage: 'interview',
    created_at: '2026-05-19',
    age: 35,
    gender: 'male',
    resume: 'Editor de vídeo experiente.',
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
    experience_years: 2,
    skills: ['Instagram', 'TikTok', 'Copywriting'],
    areas: ['Social Media', 'Produção de Conteúdo'],
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    stage: 'test',
    created_at: '2026-05-18',
    age: 25,
    gender: 'female',
    resume: 'Especialista em social media.',
    social_media: { instagram: 'ana.costa.sm', linkedin: 'ana-costa-social' },
    archived: false,
  },
]

const CORES: Record<string, string> = {
  red: 'bg-red-500',
  gray: 'bg-gray-500',
  green: 'bg-green-500',
}

const formatarData = (data: string) => {
  const [dia, mes, ano] = data.split('/')
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${dia} ${meses[parseInt(mes) - 1]}`
}

export default function Dashboard() {
  const [candidates, setCandidates, isCandidatesLoaded] = useLocalStorage<Candidate[]>('candidates', MOCK_CANDIDATES)
  const [empresas] = useLocalStorage<Empresa[]>('empresas', MOCK_EMPRESAS)
  const [search, setSearch] = useState('')
  const [ageFilter, setAgeFilter] = useState<string>('')
  const [genderFilter, setGenderFilter] = useState<string>('')
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [archiveCandidate, setArchiveCandidate] = useState<{ id: string; name: string } | null>(null)

  const filtered = useMemo(() => {
    return candidates.filter(c => {
      if (c.archived) return false
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                         c.email.toLowerCase().includes(search.toLowerCase())
      const matchAge = !ageFilter || (c.age && (
        (ageFilter === '18-25' && c.age >= 18 && c.age <= 25) ||
        (ageFilter === '26-35' && c.age >= 26 && c.age <= 35) ||
        (ageFilter === '36-50' && c.age >= 36 && c.age <= 50) ||
        (ageFilter === '50+' && c.age >= 50)
      ))
      const matchGender = !genderFilter || c.gender === genderFilter
      return matchSearch && matchAge && matchGender
    })
  }, [candidates, search, ageFilter, genderFilter])

  const stats = {
    curriculum: filtered.filter(c => c.stage === 'curriculum').length,
    interview: filtered.filter(c => c.stage === 'interview').length,
    test: filtered.filter(c => c.stage === 'test').length,
    hired: filtered.filter(c => c.stage === 'hired').length,
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

  if (!isCandidatesLoaded) return null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-black">Dashboard</h1>
        <p className="text-sm text-gray-700 mt-2">Visão geral do processo seletivo</p>
      </div>

      {/* Funnel Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Currículo', value: stats.curriculum, color: 'border-l-4 border-blue-600' },
          { label: 'Entrevista', value: stats.interview, color: 'border-l-4 border-purple-600' },
          { label: 'Teste', value: stats.test, color: 'border-l-4 border-amber-600' },
          { label: 'Contratada', value: stats.hired, color: 'border-l-4 border-green-600' },
        ].map(stat => (
          <div key={stat.label} className={`bg-white border border-gray-200 rounded p-4 sm:p-5 ${stat.color}`}>
            <p className="text-xs text-gray-700 font-medium uppercase tracking-wide">{stat.label}</p>
            <p className="text-2xl sm:text-3xl font-semibold text-black mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded p-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-600" size={16} />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>
          <select
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          >
            <option value="">Faixa Etária</option>
            <option value="18-25">18-25</option>
            <option value="26-35">26-35</option>
            <option value="36-50">36-50</option>
            <option value="50+">50+</option>
          </select>
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          >
            <option value="">Sexo</option>
            <option value="male">Masculino</option>
            <option value="female">Feminino</option>
            <option value="other">Outro</option>
          </select>
        </div>
      </div>

      {/* Candidates Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded">
          <p className="text-sm text-gray-700">Nenhuma candidata encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
          {filtered.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onClick={setSelectedCandidate}
              onArchive={handleArchiveClick}
            />
          ))}
        </div>
      )}

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

      {/* Dashboard de Tarefas */}
      <div className="mt-12">
        <div className="mb-6">
          <h2 className="text-3xl font-semibold text-black">Modos Operandi</h2>
          <p className="text-sm text-gray-700 mt-2">Visão geral das demandas</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Card: Tarefas por Dia */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Tarefas por Dia</h3>
            <div className="space-y-3">
              {Object.entries(
                empresas.reduce((acc: Record<string, number>, empresa) => {
                  empresa.tarefas.forEach(tarefa => {
                    acc[tarefa.data] = (acc[tarefa.data] || 0) + 1
                  })
                  return acc
                }, {})
              )
              .sort((a, b) => {
                const dateA = new Date(a[0].split('/').reverse().join('-'))
                const dateB = new Date(b[0].split('/').reverse().join('-'))
                return dateA.getTime() - dateB.getTime()
              })
              .slice(0, 7)
              .map(([data, count]) => (
                <div key={data} className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">{formatarData(data)}</span>
                  <span className="bg-blue-100 text-blue-700 font-semibold px-3 py-1 rounded-full">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Tarefas por Período */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Tarefas por Período</h3>
            <div className="space-y-3">
              {Object.entries(
                empresas.reduce((acc: Record<string, number>, empresa) => {
                  empresa.tarefas.forEach(tarefa => {
                    const periodo = tarefa.periodo === 'manha' ? '☀ Manhã' : '🌙 Tarde'
                    acc[periodo] = (acc[periodo] || 0) + 1
                  })
                  return acc
                }, {})
              )
              .map(([periodo, count]) => (
                <div key={periodo} className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">{periodo}</span>
                  <span className={`${periodo.includes('Manhã') ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'} font-semibold px-3 py-1 rounded-full`}>
                    {count}
                  </span>
                </div>
              ))}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span>Total</span>
                  <span className="bg-gray-900 text-white px-3 py-1 rounded-full">
                    {empresas.reduce((sum, emp) => sum + emp.tarefas.length, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Tarefas por Empresa */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Tarefas por Empresa</h3>
            <div className="space-y-3">
              {[...empresas].sort((a, b) => b.tarefas.length - a.tarefas.length).map(empresa => (
                <div key={empresa.id} className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`w-3 h-3 rounded-full ${CORES[empresa.cor]}`}></div>
                    <span className="text-gray-600 truncate">{empresa.nome}</span>
                  </div>
                  <span className="bg-gray-100 text-gray-700 font-semibold px-3 py-1 rounded-full flex-shrink-0">
                    {empresa.tarefas.length}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
