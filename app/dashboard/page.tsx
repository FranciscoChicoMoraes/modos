'use client'

import { useState, useMemo, useEffect, type ReactNode } from 'react'
import { Candidate } from '@/types'
import { Search, ChevronDown, Sun, Moon, CheckCircle2, Circle } from 'lucide-react'
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
  empresa_id?: string
}

interface Empresa {
  id: string
  nome: string
  cor: string
  tarefas: Tarefa[]
}

// Dados serão buscados da API (removido mock)

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

const dataParaTimestamp = (data: string) => {
  const [dia, mes, ano] = data.split('/')
  return new Date(`${ano}-${mes}-${dia}`).getTime()
}

const paraISOLocal = (d: Date) => {
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

const isoParaData = (iso: string) => {
  const [ano, mes, dia] = iso.split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}

const dataChave = (d: Date) => {
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  return `${dia}/${mes}/${d.getFullYear()}`
}

const somarDiasData = (d: Date, dias: number) => {
  const r = new Date(d)
  r.setDate(r.getDate() + dias)
  return r
}

export default function Dashboard() {
  const [candidates, setCandidates, isCandidatesLoaded] = useLocalStorage<Candidate[]>('candidates', MOCK_CANDIDATES)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [search, setSearch] = useState('')
  const [ageFilter, setAgeFilter] = useState<string>('')
  const [genderFilter, setGenderFilter] = useState<string>('')
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [archiveCandidate, setArchiveCandidate] = useState<{ id: string; name: string } | null>(null)
  const [empresasExpandidas, setEmpresasExpandidas] = useState<Set<string>>(new Set())
  const [periodoInicio, setPeriodoInicio] = useState(() => paraISOLocal(somarDiasData(new Date(), -3)))
  const [periodoFim, setPeriodoFim] = useState(() => paraISOLocal(somarDiasData(new Date(), 3)))

  const toggleEmpresa = (id: string) => {
    setEmpresasExpandidas(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Carregar empresas e tarefas do Supabase
  useEffect(() => {
    const loadEmpresas = async () => {
      try {
        const res = await fetch('/api/demandas')
        if (res.ok) {
          const data = await res.json()
          setEmpresas(data)
        }
      } catch (err) {
        console.error('Erro ao carregar empresas:', err)
        setEmpresas([])
      }
    }

    // Carregar na montagem
    loadEmpresas()

    // Atualizar a cada 10 segundos
    const interval = setInterval(loadEmpresas, 10000)
    return () => clearInterval(interval)
  }, [])

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

        {/* Resumo geral */}
        {(() => {
          const todasTarefas = empresas.flatMap(e => e.tarefas)
          const grupos = [
            { label: 'Total de tarefas', icone: null, tarefas: todasTarefas },
            { label: 'Manhã', icone: <Sun size={14} className="text-amber-500" />, tarefas: todasTarefas.filter(t => t.periodo === 'manha') },
            { label: 'Tarde', icone: <Moon size={14} className="text-blue-500" />, tarefas: todasTarefas.filter(t => t.periodo === 'tarde') },
          ]

          return (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
              {grupos.map(grupo => {
                const concluidas = grupo.tarefas.filter(t => t.concluida).length
                const aFazer = grupo.tarefas.length - concluidas

                return (
                  <div key={grupo.label} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium uppercase tracking-wide">
                      {grupo.icone}
                      {grupo.label}
                    </div>
                    <p className="text-2xl font-semibold text-black mt-2">{grupo.tarefas.length}</p>
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Concluídas</span>
                        <span className="font-semibold text-green-600">{concluidas}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">A fazer</span>
                        <span className={`font-semibold ${aFazer > 0 ? 'text-red-600' : 'text-gray-400'}`}>{aFazer}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {/* Card: Tarefas por Dia */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Tarefas por Dia</h3>

            {/* Seletor de período */}
            <div className="flex items-center gap-2 mb-4">
              <input
                type="date"
                value={periodoInicio}
                onChange={(e) => setPeriodoInicio(e.target.value)}
                className="flex-1 min-w-0 px-2 py-1.5 border border-gray-200 rounded text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-black"
              />
              <span className="text-xs text-gray-400 shrink-0">até</span>
              <input
                type="date"
                value={periodoFim}
                onChange={(e) => setPeriodoFim(e.target.value)}
                className="flex-1 min-w-0 px-2 py-1.5 border border-gray-200 rounded text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            {(() => {
              const inicio = isoParaData(periodoInicio)
              const fim = isoParaData(periodoFim)
              if (isNaN(inicio.getTime()) || isNaN(fim.getTime()) || fim < inicio) {
                return <p className="text-xs text-gray-400">Período inválido</p>
              }

              const agora = new Date()
              const hojeTs = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime()

              const porData: Record<string, Tarefa[]> = {}
              empresas.forEach(empresa => {
                empresa.tarefas.forEach(tarefa => {
                  if (!porData[tarefa.data]) porData[tarefa.data] = []
                  porData[tarefa.data].push(tarefa)
                })
              })

              const dias: Date[] = []
              for (let d = new Date(inicio); d <= fim && dias.length < 31; d = somarDiasData(d, 1)) {
                dias.push(d)
              }

              const linhas = dias.map(dia => {
                const tarefasDia = porData[dataChave(dia)] || []
                const ts = dia.getTime()
                const pendentes = tarefasDia.filter(t => !t.concluida).length
                return {
                  chave: dataChave(dia),
                  ts,
                  atrasadas: ts < hojeTs ? pendentes : 0,
                  porVir: ts >= hojeTs ? pendentes : 0,
                  concluidas: tarefasDia.filter(t => t.concluida).length,
                  total: tarefasDia.length,
                }
              })
              const maxDia = Math.max(1, ...linhas.map(l => l.total))

              return (
                <>
                  <div className="space-y-2.5">
                    {linhas.map(linha => (
                      <div key={linha.chave} className="flex items-center gap-2 text-xs">
                        <span className={`w-12 shrink-0 ${linha.ts === hojeTs ? 'font-bold text-black' : 'text-gray-600'}`}>
                          {linha.ts === hojeTs ? 'Hoje' : formatarData(linha.chave)}
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden flex">
                          {linha.concluidas > 0 && (
                            <div className="bg-green-500 h-2" style={{ width: `${(linha.concluidas / maxDia) * 100}%` }}></div>
                          )}
                          {linha.atrasadas > 0 && (
                            <div className="bg-red-500 h-2" style={{ width: `${(linha.atrasadas / maxDia) * 100}%` }}></div>
                          )}
                          {linha.porVir > 0 && (
                            <div className="bg-blue-500 h-2" style={{ width: `${(linha.porVir / maxDia) * 100}%` }}></div>
                          )}
                        </div>
                        <span className={`w-5 text-right font-semibold ${linha.atrasadas > 0 ? 'text-red-600' : 'text-gray-300'}`}>
                          {linha.atrasadas}
                        </span>
                        <span className={`w-5 text-right font-semibold ${linha.porVir > 0 ? 'text-blue-600' : 'text-gray-300'}`}>
                          {linha.porVir}
                        </span>
                        <span className={`w-5 text-right font-semibold ${linha.concluidas > 0 ? 'text-green-600' : 'text-gray-300'}`}>
                          {linha.concluidas}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Legenda */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span> Atrasadas
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span> Por vir
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span> Concluídas
                    </span>
                  </div>
                </>
              )
            })()}
          </div>

          {/* Card: Visão por Empresa */}
          <div className="lg:col-span-2 space-y-3">
            {[...empresas].sort((a, b) => {
              const pendentesA = a.tarefas.filter(t => !t.concluida).length
              const pendentesB = b.tarefas.filter(t => !t.concluida).length
              if (pendentesA !== pendentesB) return pendentesB - pendentesA
              return b.tarefas.length - a.tarefas.length
            }).map(empresa => {
              const totalTarefas = empresa.tarefas.length
              const tarefasFeitas = empresa.tarefas.filter(t => t.concluida).length
              const tarefasAFazer = totalTarefas - tarefasFeitas
              const percentualConcluido = totalTarefas > 0 ? Math.round((tarefasFeitas / totalTarefas) * 100) : 0
              const tarefasManha = empresa.tarefas
                .filter(t => t.periodo === 'manha')
                .sort((a, b) => dataParaTimestamp(a.data) - dataParaTimestamp(b.data))
              const tarefasTarde = empresa.tarefas
                .filter(t => t.periodo === 'tarde')
                .sort((a, b) => dataParaTimestamp(a.data) - dataParaTimestamp(b.data))
              const expandida = empresasExpandidas.has(empresa.id)

              const listaTurno = (titulo: string, icone: ReactNode, tarefas: Tarefa[]) => (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900 mb-2">
                    {icone}
                    <span>{titulo}</span>
                    <span className="text-gray-500 font-normal">({tarefas.length})</span>
                  </div>
                  {tarefas.length === 0 ? (
                    <p className="text-xs text-gray-400">Nenhuma tarefa</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {tarefas.map(tarefa => (
                        <li key={tarefa.id} className="flex items-start gap-2 text-xs">
                          {tarefa.concluida ? (
                            <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
                          ) : (
                            <Circle size={14} className="text-gray-300 shrink-0 mt-0.5" />
                          )}
                          <span className={`flex-1 ${tarefa.concluida ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                            {tarefa.descricao}
                          </span>
                          <span className="text-gray-400 shrink-0">{formatarData(tarefa.data)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )

              return (
                <div key={empresa.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleEmpresa(empresa.id)}
                    className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${CORES[empresa.cor] || 'bg-gray-300'}`}></div>
                      <span className="text-sm font-semibold text-gray-900 flex-1 truncate">{empresa.nome}</span>
                      <span className="hidden sm:flex items-center gap-1 text-xs bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                        <Sun size={12} /> {tarefasManha.length}
                      </span>
                      <span className="hidden sm:flex items-center gap-1 text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                        <Moon size={12} /> {tarefasTarde.length}
                      </span>
                      <span className="text-xs text-gray-600 font-medium w-9 text-right">{percentualConcluido}%</span>
                      <ChevronDown
                        size={16}
                        className={`text-gray-400 shrink-0 transition-transform ${expandida ? 'rotate-180' : ''}`}
                      />
                    </div>
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-green-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${percentualConcluido}%` }}
                      ></div>
                    </div>
                    <div className="mt-2 flex justify-between text-xs">
                      <span className={`font-semibold ${tarefasAFazer > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {tarefasAFazer} a fazer
                      </span>
                      <span className="text-green-600 font-semibold">{tarefasFeitas} feitas</span>
                    </div>
                  </button>

                  {expandida && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {listaTurno('Manhã', <Sun size={14} className="text-amber-500" />, tarefasManha)}
                        {listaTurno('Tarde', <Moon size={14} className="text-blue-500" />, tarefasTarde)}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
