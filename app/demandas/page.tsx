'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Edit2, Trash2, ExternalLink, Pause, Play } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key loaded:', !!supabaseKey)

const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || ''
)

interface Tarefa {
  id: string
  descricao: string
  data: string
  periodo: 'manha' | 'tarde'
  concluida: boolean
  aguardando?: boolean
}

interface Empresa {
  id: string
  nome: string
  cor: string
  avatar?: string
  instagram?: string
  agendamentos?: string
  pagina?: string
  tiktok?: string
  google?: string
  loginssenhas?: string
  tarefas: Tarefa[]
}

type CorEmpresa = 'red' | 'gray' | 'green'

const CORES: Record<CorEmpresa, string> = {
  red: 'bg-red-500',
  gray: 'bg-gray-500',
  green: 'bg-green-500',
}

const formatarData = (data: string) => {
  const [dia, mes, ano] = data.split('/')
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${dia} ${meses[parseInt(mes) - 1]}`
}

export default function DemandasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])

  const [showAddEmpresa, setShowAddEmpresa] = useState(false)
  const [selectedEmpresaDetalhes, setSelectedEmpresaDetalhes] = useState<string | null>(null)
  const [showAddTarefaPopup, setShowAddTarefaPopup] = useState<string | null>(null)
  const [tarefasAguardando, setTarefasAguardando] = useState<Set<string>>(new Set())
  const [newTarefaDescricao, setNewTarefaDescricao] = useState('')
  const [newTarefaDataSeletor, setNewTarefaDataSeletor] = useState('')
  const [newTarefaPeriodo, setNewTarefaPeriodo] = useState<'manha' | 'tarde'>('manha')
  const [selectedTarefaEdit, setSelectedTarefaEdit] = useState<{empresaId: string, tarefaId: string} | null>(null)
  const [editTarefaDescricao, setEditTarefaDescricao] = useState('')
  const [editTarefaData, setEditTarefaData] = useState('')
  const [editTarefaPeriodo, setEditTarefaPeriodo] = useState<'manha' | 'tarde'>('manha')
  const [editTarefaDataSeletor, setEditTarefaDataSeletor] = useState('')
  const [sugestoesNovasTarefas, setSugestoesNovasTarefas] = useState<string[]>([])
  const [sugestoesEdicaoTarefas, setSugestoesEdicaoTarefas] = useState<string[]>([])
  const [newEmpresaNome, setNewEmpresaNome] = useState('')
  const [newEmpresaAvatar, setNewEmpresaAvatar] = useState<string>('')
  const [newEmpresaInstagram, setNewEmpresaInstagram] = useState('')
  const [newEmpresaAgendamentos, setNewEmpresaAgendamentos] = useState('')
  const [newEmpresaPagina, setNewEmpresaPagina] = useState('')
  const [newEmpresaTiktok, setNewEmpresaTiktok] = useState('')
  const [newEmpresaGoogle, setNewEmpresaGoogle] = useState('')
  const [newEmpresaLogins, setNewEmpresaLogins] = useState('')

  // Carregar dados via API ao montar
  useEffect(() => {
    const carregarDados = async () => {
      try {
        console.log('Carregando dados da API...')
        const res = await fetch('/api/demandas')
        const data = await res.json()
        console.log('Dados carregados:', data)

        if (Array.isArray(data)) {
          setEmpresas(data.map((emp: any) => ({
            ...emp,
            tarefas: emp.tarefas || []
          })))
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
      }
    }

    carregarDados()
  }, [])

  // Ordenar empresas por data mais próxima
  const empresasOrdenadas = [...empresas].sort((a, b) => {
    const dataMaisProximaA = a.tarefas.length > 0 ? new Date(a.tarefas[0].data.split('/').reverse().join('-')) : new Date('9999-12-31')
    const dataMaisProximaB = b.tarefas.length > 0 ? new Date(b.tarefas[0].data.split('/').reverse().join('-')) : new Date('9999-12-31')
    return dataMaisProximaA.getTime() - dataMaisProximaB.getTime()
  })

  const handleAddEmpresa = async () => {
    if (!newEmpresaNome.trim()) return
    const cores: CorEmpresa[] = ['red', 'gray', 'green']
    const novaCor = cores[empresas.length % 3] as CorEmpresa
    const empresaId = uuidv4()
    const novaEmpresa: Empresa = {
      id: empresaId,
      nome: newEmpresaNome,
      cor: novaCor,
      avatar: newEmpresaAvatar,
      instagram: newEmpresaInstagram,
      agendamentos: newEmpresaAgendamentos,
      pagina: newEmpresaPagina,
      tiktok: newEmpresaTiktok,
      google: newEmpresaGoogle,
      loginssenhas: newEmpresaLogins,
      tarefas: [],
    }

    // Salvar via API route (usa service_role_key do servidor)
    try {
      const res = await fetch('/api/demandas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: empresaId,
          nome: novaEmpresa.nome,
          cor: novaEmpresa.cor,
          instagram: novaEmpresa.instagram || null,
          agendamentos: novaEmpresa.agendamentos || null,
          pagina: novaEmpresa.pagina || null,
          tiktok: novaEmpresa.tiktok || null,
          google: novaEmpresa.google || null,
          loginssenhas: novaEmpresa.loginssenhas || null,
        })
      })
      const data = await res.json()
      if (!res.ok) {
        console.error('Erro API ao salvar empresa:', data)
        alert('Erro ao salvar empresa: ' + data.error)
      } else {
        console.log('Empresa salva com sucesso:', data)
      }
    } catch (err) {
      console.error('Erro ao salvar empresa:', err)
      alert('Erro: ' + (err as Error).message)
    }

    setEmpresas([...empresas, novaEmpresa])
    setNewEmpresaNome('')
    setNewEmpresaAvatar('')
    setNewEmpresaInstagram('')
    setNewEmpresaAgendamentos('')
    setNewEmpresaPagina('')
    setNewEmpresaTiktok('')
    setNewEmpresaGoogle('')
    setNewEmpresaLogins('')
    setShowAddEmpresa(false)
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewEmpresaAvatar(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const getTodasAsDescricoes = () => {
    const descricoes = new Set<string>()
    empresas.forEach(emp => {
      emp.tarefas.forEach(tarefa => {
        descricoes.add(tarefa.descricao)
      })
    })
    return Array.from(descricoes).sort()
  }

  const filtrarSugestoes = (texto: string) => {
    if (!texto.trim()) return []
    const textoLower = texto.toLowerCase()
    return getTodasAsDescricoes().filter(desc =>
      desc.toLowerCase().startsWith(textoLower)
    )
  }

  const handleToggleTarefa = (empresaId: string, tarefaId: string) => {
    setEmpresas(
      empresas.map(emp => {
        if (emp.id === empresaId) {
          return {
            ...emp,
            tarefas: emp.tarefas.map(t =>
              t.id === tarefaId ? { ...t, concluida: !t.concluida } : t
            ),
          }
        }
        return emp
      })
    )
  }

  const adicionarTarefa = async (empresaId: string, data: string, periodo: 'manha' | 'tarde') => {
    if (!newTarefaDescricao.trim()) return

    const tarefaId = uuidv4()

    // Salvar via API route (usa service_role_key do servidor)
    try {
      const res = await fetch('/api/demandas/tarefas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa_id: empresaId,
          descricao: newTarefaDescricao,
          data: data,
          periodo: periodo,
        })
      })
      const insertData = await res.json()
      if (!res.ok) {
        console.error('Erro API ao salvar tarefa:', insertData)
        alert('Erro ao salvar tarefa: ' + insertData.error)
      } else {
        console.log('Tarefa salva com sucesso:', insertData)
      }
    } catch (err) {
      console.error('Erro ao salvar tarefa:', err)
      alert('Erro: ' + (err as Error).message)
    }

    setEmpresas(
      empresas.map(emp => {
        if (emp.id === empresaId) {
          const novasTarefas = [
            ...emp.tarefas,
            {
              id: tarefaId,
              descricao: newTarefaDescricao,
              data: data,
              periodo: periodo,
              concluida: false,
            },
          ]
          return {
            ...emp,
            tarefas: novasTarefas.sort((a, b) => {
              const dateA = new Date(a.data.split('/').reverse().join('-'))
              const dateB = new Date(b.data.split('/').reverse().join('-'))
              if (dateA.getTime() !== dateB.getTime()) {
                return dateA.getTime() - dateB.getTime()
              }
              return a.periodo === 'manha' ? -1 : 1
            })
          }
        }
        return emp
      })
    )
    setNewTarefaDescricao('')
    setNewTarefaDataSeletor('')
    setNewTarefaPeriodo('manha')
    setSugestoesNovasTarefas([])
    setShowAddTarefaPopup(null)
  }

  const getDataHoje = () => {
    const hoje = new Date()
    return `${hoje.getDate()}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`
  }

  const getDataAmanha = () => {
    const amanha = new Date()
    amanha.setDate(amanha.getDate() + 1)
    return `${amanha.getDate()}/${String(amanha.getMonth() + 1).padStart(2, '0')}/${amanha.getFullYear()}`
  }

  const handleDeleteEmpresa = (empresaId: string) => {
    setEmpresas(empresas.filter(emp => emp.id !== empresaId))
  }

  const handleEditarTarefa = (empresaId: string, tarefaId: string) => {
    const tarefa = empresas.find(e => e.id === empresaId)?.tarefas.find(t => t.id === tarefaId)
    if (tarefa) {
      setSelectedTarefaEdit({ empresaId, tarefaId })
      setEditTarefaDescricao(tarefa.descricao)
      setEditTarefaData(tarefa.data)
      setEditTarefaPeriodo(tarefa.periodo)
      setEditTarefaDataSeletor('')
    }
  }

  const handleSalvarEdicaoTarefa = () => {
    if (!selectedTarefaEdit || !editTarefaDescricao.trim()) return

    setEmpresas(
      empresas.map(emp => {
        if (emp.id === selectedTarefaEdit.empresaId) {
          return {
            ...emp,
            tarefas: emp.tarefas.map(t =>
              t.id === selectedTarefaEdit.tarefaId
                ? { ...t, descricao: editTarefaDescricao, data: editTarefaData, periodo: editTarefaPeriodo }
                : t
            ).sort((a, b) => {
              const dateA = new Date(a.data.split('/').reverse().join('-'))
              const dateB = new Date(b.data.split('/').reverse().join('-'))
              if (dateA.getTime() !== dateB.getTime()) {
                return dateA.getTime() - dateB.getTime()
              }
              return a.periodo === 'manha' ? -1 : 1
            })
          }
        }
        return emp
      })
    )
    setSelectedTarefaEdit(null)
    setEditTarefaDescricao('')
    setEditTarefaData('')
    setEditTarefaPeriodo('manha')
    setEditTarefaDataSeletor('')
    setSugestoesEdicaoTarefas([])
  }

  const handleDeletarTarefa = (empresaId: string, tarefaId: string) => {
    setEmpresas(
      empresas.map(emp => {
        if (emp.id === empresaId) {
          return {
            ...emp,
            tarefas: emp.tarefas.filter(t => t.id !== tarefaId)
          }
        }
        return emp
      })
    )
    setSelectedTarefaEdit(null)
  }

  const handleToggleAguardando = (tarefaId: string) => {
    const novasAguardando = new Set(tarefasAguardando)
    if (novasAguardando.has(tarefaId)) {
      novasAguardando.delete(tarefaId)
    } else {
      novasAguardando.add(tarefaId)
    }
    setTarefasAguardando(novasAguardando)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-black">Demandas</h1>
        <button
          onClick={() => setShowAddEmpresa(true)}
          className="bg-black hover:bg-gray-800 text-white text-xs font-medium py-1.5 px-3 rounded flex items-center gap-1.5 transition-colors"
        >
          <Plus size={14} />
          Nova Empresa
        </button>
      </div>

      {/* Grid 3 colunas */}
      <div className="grid grid-cols-3 gap-3">
        {empresasOrdenadas.map(empresa => (
          <div
            key={empresa.id}
            className="bg-white rounded p-3 border border-gray-100"
          >
            {/* Header da Empresa */}
            <div
              className="flex items-center gap-2.5 mb-2.5 pb-2.5 border-b border-gray-150 cursor-pointer hover:opacity-80 transition-opacity"
              onDoubleClick={() => setSelectedEmpresaDetalhes(empresa.id)}
            >
              {empresa.avatar ? (
                <img
                  src={empresa.avatar}
                  alt={empresa.nome}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className={`w-10 h-10 rounded-full ${CORES[empresa.cor as CorEmpresa]} flex-shrink-0`} />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-black text-xs">{empresa.nome}</h3>
              </div>
            </div>

            {/* Lista de Tarefas em formato tabela */}
            <div
              className="divide-y divide-gray-150 max-h-48 overflow-y-scroll"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitScrollbar: 'none'
              }}
            >
              <style>{`
                [data-task-list]::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              {empresa.tarefas.sort((a, b) => {
                if (a.concluida === b.concluida) return 0
                return a.concluida ? 1 : -1
              }).map(tarefa => (
                <div
                  key={tarefa.id}
                  className={`group flex items-center gap-2 border-l-4 transition-colors ${tarefasAguardando.has(tarefa.id) ? 'border-l-red-500 bg-red-50' : 'border-l-transparent'}`}
                >
                  <button
                    onDoubleClick={() => handleToggleTarefa(empresa.id, tarefa.id)}
                    className="w-full text-left py-2 px-3 hover:bg-gray-50 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className={`opacity-30 ${tarefa.periodo === 'manha' ? 'text-orange-400' : 'text-blue-400'}`}>
                        ☀
                      </span>
                      <span className={`flex-1 truncate ${tarefa.concluida ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {tarefa.descricao}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleAguardando(tarefa.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                        title={tarefasAguardando.has(tarefa.id) ? 'Retomar' : 'Pausar'}
                      >
                        {tarefasAguardando.has(tarefa.id) ? (
                          <Pause size={14} className="text-red-600 fill-red-600" />
                        ) : (
                          <Play size={14} className="text-gray-600" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditarTarefa(empresa.id, tarefa.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                        title="Abrir"
                      >
                        <ExternalLink size={14} className="text-gray-600" />
                      </button>
                    </div>
                    <span className="text-gray-500 flex-shrink-0 whitespace-nowrap">
                      {formatarData(tarefa.data)}
                    </span>
                  </button>
                </div>
              ))}
            </div>

            {/* Footer com botão Nova Tarefa */}
            <div className="border-t border-gray-150 pt-2 mt-2">
              <button
                onClick={() => setShowAddTarefaPopup(empresa.id)}
                className="w-full text-center text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors py-1"
              >
                + Nova Tarefa
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Editar Tarefa */}
      {selectedTarefaEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4 space-y-4 max-h-96 overflow-y-auto">
            <h2 className="text-lg font-semibold text-black">Editar Tarefa</h2>

            <div className="space-y-2">
              <input
                type="text"
                value={editTarefaDescricao}
                onChange={(e) => {
                  setEditTarefaDescricao(e.target.value)
                  setSugestoesEdicaoTarefas(filtrarSugestoes(e.target.value))
                }}
                placeholder="Descrição da tarefa"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-black"
                autoFocus
              />
              {sugestoesEdicaoTarefas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {sugestoesEdicaoTarefas.map((sugestao) => (
                    <button
                      key={sugestao}
                      onClick={() => {
                        setEditTarefaDescricao(sugestao)
                        setSugestoesEdicaoTarefas([])
                      }}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full transition-colors"
                    >
                      {sugestao}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">Período:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setEditTarefaPeriodo('manha')}
                  className={`py-2.5 text-xs rounded-full font-medium transition-colors ${
                    editTarefaPeriodo === 'manha'
                      ? 'bg-orange-400 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ☀ Manhã
                </button>
                <button
                  onClick={() => setEditTarefaPeriodo('tarde')}
                  className={`py-2.5 text-xs rounded-full font-medium transition-colors ${
                    editTarefaPeriodo === 'tarde'
                      ? 'bg-blue-400 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ☀ Tarde
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">Data:</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setEditTarefaData(getDataHoje())}
                  className={`py-2 text-xs rounded-full font-medium transition-colors ${
                    editTarefaData === getDataHoje()
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Hoje
                </button>
                <button
                  onClick={() => setEditTarefaData(getDataAmanha())}
                  className={`py-2 text-xs rounded-full font-medium transition-colors ${
                    editTarefaData === getDataAmanha()
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Amanhã
                </button>
                <input
                  type="date"
                  value={editTarefaDataSeletor}
                  onChange={(e) => {
                    setEditTarefaDataSeletor(e.target.value)
                    if (e.target.value) {
                      const [ano, mes, dia] = e.target.value.split('-')
                      setEditTarefaData(`${dia}/${mes}/${ano}`)
                    }
                  }}
                  className="px-2 py-2 text-xs border border-gray-300 rounded-full focus:outline-none focus:border-black"
                />
              </div>
              <p className="text-xs text-gray-500">Data selecionada: {formatarData(editTarefaData)}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSalvarEdicaoTarefa}
                className="flex-1 bg-black hover:bg-gray-800 text-white font-medium py-2.5 text-xs rounded-full transition-colors"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  handleDeletarTarefa(selectedTarefaEdit.empresaId, selectedTarefaEdit.tarefaId)
                }}
                className="px-3 py-2.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors"
                title="Deletar"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => {
                  setSelectedTarefaEdit(null)
                  setEditTarefaDescricao('')
                  setEditTarefaData('')
                  setEditTarefaPeriodo('manha')
                  setEditTarefaDataSeletor('')
                  setSugestoesEdicaoTarefas([])
                }}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-black font-medium py-2.5 text-xs rounded-full transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes da Empresa */}
      {selectedEmpresaDetalhes && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 my-8 space-y-4">
            {empresas.find(e => e.id === selectedEmpresaDetalhes) && (
              <>
                <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                  {empresas.find(e => e.id === selectedEmpresaDetalhes)?.avatar ? (
                    <img
                      src={empresas.find(e => e.id === selectedEmpresaDetalhes)?.avatar}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-16 h-16 rounded-full ${CORES[empresas.find(e => e.id === selectedEmpresaDetalhes)?.cor as CorEmpresa]}`} />
                  )}
                  <h2 className="text-lg font-semibold text-black">
                    {empresas.find(e => e.id === selectedEmpresaDetalhes)?.nome}
                  </h2>
                </div>

                {/* Redes Sociais */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-700 uppercase">Redes Sociais</h3>
                  <div className="space-y-2">
                    {empresas.find(e => e.id === selectedEmpresaDetalhes)?.instagram && (
                      <a
                        href={empresas.find(e => e.id === selectedEmpresaDetalhes)?.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <span className="text-lg">📷</span> Instagram
                      </a>
                    )}
                    {empresas.find(e => e.id === selectedEmpresaDetalhes)?.agendamentos && (
                      <a
                        href={empresas.find(e => e.id === selectedEmpresaDetalhes)?.agendamentos}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <span className="text-lg">📅</span> Agendamentos
                      </a>
                    )}
                    {empresas.find(e => e.id === selectedEmpresaDetalhes)?.pagina && (
                      <a
                        href={empresas.find(e => e.id === selectedEmpresaDetalhes)?.pagina}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <span className="text-lg">🌐</span> Página
                      </a>
                    )}
                    {empresas.find(e => e.id === selectedEmpresaDetalhes)?.tiktok && (
                      <a
                        href={empresas.find(e => e.id === selectedEmpresaDetalhes)?.tiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <span className="text-lg">🎵</span> Tik Tok
                      </a>
                    )}
                    {empresas.find(e => e.id === selectedEmpresaDetalhes)?.google && (
                      <a
                        href={empresas.find(e => e.id === selectedEmpresaDetalhes)?.google}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <span className="text-lg">🔍</span> Google
                      </a>
                    )}
                  </div>
                </div>

                {/* Logins e Senhas */}
                {empresas.find(e => e.id === selectedEmpresaDetalhes)?.loginssenhas && (
                  <div className="space-y-2 pt-3 border-t border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-700 uppercase">Logins e Senhas</h3>
                    <div className="bg-gray-50 rounded p-3 text-xs text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {empresas.find(e => e.id === selectedEmpresaDetalhes)?.loginssenhas}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedEmpresaDetalhes(null)}
                    className="flex-1 bg-black hover:bg-gray-800 text-white font-medium py-2 text-xs rounded transition-colors"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => {
                      alert('Empresa arquivada')
                      setSelectedEmpresaDetalhes(null)
                    }}
                    className="flex-1 border border-gray-300 hover:bg-gray-50 text-black font-medium py-2 text-xs rounded transition-colors"
                  >
                    Arquivar
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteEmpresa(selectedEmpresaDetalhes)
                      setSelectedEmpresaDetalhes(null)
                    }}
                    className="flex-1 border border-red-300 hover:bg-red-50 text-red-600 font-medium py-2 text-xs rounded transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Popup Nova Tarefa */}
      {showAddTarefaPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4 space-y-4">
            <h2 className="text-lg font-semibold text-black">Nova Tarefa</h2>

            <div className="space-y-2">
              <input
                type="text"
                value={newTarefaDescricao}
                onChange={(e) => {
                  setNewTarefaDescricao(e.target.value)
                  setSugestoesNovasTarefas(filtrarSugestoes(e.target.value))
                }}
                placeholder="Descrição da tarefa"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-black"
                autoFocus
              />
              {sugestoesNovasTarefas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {sugestoesNovasTarefas.map((sugestao) => (
                    <button
                      key={sugestao}
                      onClick={() => {
                        setNewTarefaDescricao(sugestao)
                        setSugestoesNovasTarefas([])
                      }}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full transition-colors"
                    >
                      {sugestao}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">Período:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setNewTarefaPeriodo('manha')}
                  className={`py-2.5 text-xs rounded-full font-medium transition-colors ${
                    newTarefaPeriodo === 'manha'
                      ? 'bg-orange-400 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ☀ Manhã
                </button>
                <button
                  onClick={() => setNewTarefaPeriodo('tarde')}
                  className={`py-2.5 text-xs rounded-full font-medium transition-colors ${
                    newTarefaPeriodo === 'tarde'
                      ? 'bg-blue-400 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ☀ Tarde
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">Data:</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => adicionarTarefa(showAddTarefaPopup, getDataHoje(), newTarefaPeriodo)}
                  disabled={!newTarefaDescricao.trim()}
                  className="bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white font-medium py-2 text-xs rounded-full transition-colors"
                >
                  Hoje
                </button>
                <button
                  onClick={() => adicionarTarefa(showAddTarefaPopup, getDataAmanha(), newTarefaPeriodo)}
                  disabled={!newTarefaDescricao.trim()}
                  className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white font-medium py-2 text-xs rounded-full transition-colors"
                >
                  Amanhã
                </button>
                <input
                  type="date"
                  value={newTarefaDataSeletor}
                  onChange={(e) => setNewTarefaDataSeletor(e.target.value)}
                  className="px-2 py-2 text-xs border border-gray-300 rounded-full focus:outline-none focus:border-black"
                />
              </div>
              <p className="text-xs text-gray-500">Data selecionada: {formatarData(newTarefaDataSeletor ? (() => { const [ano, mes, dia] = newTarefaDataSeletor.split('-'); return `${dia}/${mes}/${ano}`; })() : getDataHoje())}</p>
              {newTarefaDataSeletor && (
                <button
                  onClick={() => {
                    const [ano, mes, dia] = newTarefaDataSeletor.split('-')
                    adicionarTarefa(showAddTarefaPopup, `${dia}/${mes}/${ano}`, newTarefaPeriodo)
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 text-xs rounded-full transition-colors"
                >
                  Adicionar com data selecionada
                </button>
              )}
            </div>

            <button
              onClick={() => {
                setShowAddTarefaPopup(null)
                setNewTarefaDescricao('')
                setNewTarefaDataSeletor('')
                setNewTarefaPeriodo('manha')
                setSugestoesNovasTarefas([])
              }}
              className="w-full border border-gray-300 hover:bg-gray-50 text-black font-medium py-2.5 text-xs rounded-full transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal Nova Empresa */}
      {showAddEmpresa && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 my-8 space-y-4">
            <h2 className="text-lg font-semibold text-black">Nova Empresa</h2>

            {/* Avatar Upload */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Avatar da Empresa</label>
              <div className="flex items-center gap-3">
                {newEmpresaAvatar && (
                  <img src={newEmpresaAvatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Nome */}
            <input
              type="text"
              value={newEmpresaNome}
              onChange={(e) => setNewEmpresaNome(e.target.value)}
              placeholder="Nome da empresa"
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-black"
              autoFocus
            />

            {/* Redes Sociais */}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="url"
                value={newEmpresaInstagram}
                onChange={(e) => setNewEmpresaInstagram(e.target.value)}
                placeholder="Instagram"
                className="px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-black"
              />
              <input
                type="url"
                value={newEmpresaAgendamentos}
                onChange={(e) => setNewEmpresaAgendamentos(e.target.value)}
                placeholder="Agendamentos"
                className="px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-black"
              />
              <input
                type="url"
                value={newEmpresaPagina}
                onChange={(e) => setNewEmpresaPagina(e.target.value)}
                placeholder="Página"
                className="px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-black"
              />
              <input
                type="url"
                value={newEmpresaTiktok}
                onChange={(e) => setNewEmpresaTiktok(e.target.value)}
                placeholder="Tik Tok"
                className="px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-black"
              />
              <input
                type="url"
                value={newEmpresaGoogle}
                onChange={(e) => setNewEmpresaGoogle(e.target.value)}
                placeholder="Google"
                className="px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-black"
              />
            </div>

            {/* Logins e Senhas */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Logins e Senhas</label>
              <textarea
                value={newEmpresaLogins}
                onChange={(e) => setNewEmpresaLogins(e.target.value)}
                placeholder="Digite aqui os logins e senhas necessários..."
                rows={5}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-black resize-none"
              />
            </div>

            {/* Redes Adicionadas */}
            {(newEmpresaInstagram || newEmpresaAgendamentos || newEmpresaPagina || newEmpresaTiktok || newEmpresaGoogle) && (
              <div className="flex gap-2 items-center">
                <span className="text-xs text-gray-600">Redes:</span>
                {newEmpresaInstagram && <span className="text-lg">📷</span>}
                {newEmpresaAgendamentos && <span className="text-lg">📅</span>}
                {newEmpresaPagina && <span className="text-lg">🌐</span>}
                {newEmpresaTiktok && <span className="text-lg">🎵</span>}
                {newEmpresaGoogle && <span className="text-lg">🔍</span>}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowAddEmpresa(false)}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-black font-medium py-2 text-xs rounded transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddEmpresa}
                className="flex-1 bg-black hover:bg-gray-800 text-white font-medium py-2 text-xs rounded transition-colors"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
