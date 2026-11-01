'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Plus, X, Edit2, Trash2, ExternalLink, Pause, Play, Filter,
  Camera, Music2, Globe, Search, Calendar, KeyRound, Asterisk, Building2,
  ChevronLeft, ChevronRight
} from 'lucide-react'
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
  created_at?: string
  avatar?: string
  instagram?: string
  agendamentos?: string
  pagina?: string
  tiktok?: string
  google?: string
  claude?: string
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

const converterDataParaDate = (data: string): Date => {
  const [dia, mes, ano] = data.split('/')
  return new Date(`${ano}-${mes}-${dia}`)
}

const abrirLink = (url: string) =>
  window.open(url.startsWith('http') ? url : `https://${url}`, '_blank')

// campo de link com ícone da rede e botão de abrir; fica fora do componente
// da página para o input não perder o foco a cada tecla
function CampoLink({ icone: Icone, valor, aoMudar, placeholder }: {
  icone: React.ComponentType<{ size?: number; className?: string }>
  valor: string
  aoMudar: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="relative flex items-center">
      <Icone size={14} className="absolute left-3 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-black placeholder-gray-400 text-black"
      />
      {valor && (
        <button
          onClick={() => abrirLink(valor)}
          title="Abrir link"
          className="absolute right-2 p-1 text-gray-400 hover:text-black rounded transition-colors"
        >
          <ExternalLink size={13} />
        </button>
      )}
    </div>
  )
}

export default function DemandasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])

  const [showAddEmpresa, setShowAddEmpresa] = useState(false)
  const [selectedEmpresaDetalhes, setSelectedEmpresaDetalhes] = useState<string | null>(null)
  const [showAddTarefaPopup, setShowAddTarefaPopup] = useState<string | null>(null)
  const [showTarefasEmLote, setShowTarefasEmLote] = useState<string | null>(null)
  const [tarefasEmLoteTexto, setTarefasEmLoteTexto] = useState('')
  const [tarefasEmLoteData, setTarefasEmLoteData] = useState(() => {
    const hoje = new Date()
    return `${hoje.getDate()}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`
  })
  const [tarefasAguardando, setTarefasAguardando] = useState<Set<string>>(new Set())
  const [empresaEditando, setEmpresaEditando] = useState<string | null>(null)
  const [newTarefaDescricao, setNewTarefaDescricao] = useState('')
  const [newTarefaDataSeletor, setNewTarefaDataSeletor] = useState('')
  const [newTarefaPeriodo, setNewTarefaPeriodo] = useState<'manha' | 'tarde'>(() => {
    const hora = new Date().getHours()
    return hora < 12 ? 'manha' : 'tarde'
  })
  const [selectedTarefaEdit, setSelectedTarefaEdit] = useState<{empresaId: string, tarefaId: string} | null>(null)
  const [editTarefaDescricao, setEditTarefaDescricao] = useState('')
  const [editTarefaData, setEditTarefaData] = useState('')
  const [editTarefaPeriodo, setEditTarefaPeriodo] = useState<'manha' | 'tarde'>('manha')
  const [editTarefaDataSeletor, setEditTarefaDataSeletor] = useState('')
  const [sugestoesNovasTarefas, setSugestoesNovasTarefas] = useState<string[]>([])
  const [sugestoesEdicaoTarefas, setSugestoesEdicaoTarefas] = useState<string[]>([])
  const [newEmpresaNome, setNewEmpresaNome] = useState('')
  const [newEmpresaAvatar, setNewEmpresaAvatar] = useState<File | string>('')
  const [newEmpresaAvatarPreview, setNewEmpresaAvatarPreview] = useState<string>('')
  const [newEmpresaInstagram, setNewEmpresaInstagram] = useState('')
  const [newEmpresaAgendamentos, setNewEmpresaAgendamentos] = useState('')
  const [newEmpresaPagina, setNewEmpresaPagina] = useState('')
  const [newEmpresaTiktok, setNewEmpresaTiktok] = useState('')
  const [newEmpresaGoogle, setNewEmpresaGoogle] = useState('')
  const [newEmpresaClaude, setNewEmpresaClaude] = useState('')
  const [newEmpresaLogins, setNewEmpresaLogins] = useState('')

  // Pesquisa
  const [busca, setBusca] = useState('')
  const [tarefasExibidas, setTarefasExibidas] = useState(2)
  const [showDemandasDia, setShowDemandasDia] = useState(false)
  const [buscaDia, setBuscaDia] = useState('')
  // dia selecionado no pop-up, em ISO (YYYY-MM-DD) para o seletor nativo
  const [dataDia, setDataDia] = useState(() => {
    const hoje = new Date()
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
  })
  // janela de análise: 1 dia ou 7 dias a partir da data selecionada
  const [periodoDia, setPeriodoDia] = useState<1 | 7>(1)
  const [mostrarFiltroExibicao, setMostrarFiltroExibicao] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

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

  // Ordenação padrão: a empresa com a tarefa pendente mais próxima vem
  // primeiro (por data e, no mesmo dia, manhã antes de tarde). Tarefas
  // concluídas não contam; empresas sem pendências vão para o fim.
  const chaveUrgencia = (emp: Empresa): number | null => {
    const pendentes = emp.tarefas.filter(t => !t.concluida)
    if (pendentes.length === 0) return null
    return Math.min(
      ...pendentes.map(t =>
        converterDataParaDate(t.data).getTime() + (t.periodo === 'tarde' ? 1 : 0)
      )
    )
  }

  const empresasOrdenadas = [...empresas].sort((a, b) => {
    const urgenciaA = chaveUrgencia(a)
    const urgenciaB = chaveUrgencia(b)

    // sem pendências vai para o fim
    if (urgenciaA === null && urgenciaB !== null) return 1
    if (urgenciaA !== null && urgenciaB === null) return -1

    // pendência mais próxima (ou atrasada) primeiro
    if (urgenciaA !== null && urgenciaB !== null && urgenciaA !== urgenciaB) {
      return urgenciaA - urgenciaB
    }

    // empate: empresas criadas mais recentemente primeiro
    const dataA = new Date(a.created_at || '0000-01-01').getTime()
    const dataB = new Date(b.created_at || '0000-01-01').getTime()
    return dataB - dataA
  })

  // Filtrar empresas por pesquisa
  const empresasFiltradas = useMemo(() => {
    if (busca.length < 3) return empresasOrdenadas

    const buscaLower = busca.toLowerCase()
    return empresasOrdenadas.filter(empresa =>
      empresa.nome.toLowerCase().includes(buscaLower) ||
      empresa.tarefas.some(t => t.descricao.toLowerCase().includes(buscaLower))
    )
  }, [busca, empresasOrdenadas])

  // o upload passa pelo servidor (/api/demandas/avatar), que usa a chave de
  // serviço; enviar direto do navegador era barrado pelas regras do Storage
  const uploadAvatar = async (file: File, empresaId: string): Promise<string | null> => {
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('empresaId', empresaId)

      const res = await fetch('/api/demandas/avatar', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) {
        alert('Erro ao enviar a foto: ' + (data.error ?? 'tente novamente'))
        return null
      }
      return data.url as string
    } catch (err) {
      console.error('Erro ao enviar avatar:', err)
      alert('Erro ao enviar a foto: ' + (err as Error).message)
      return null
    }
  }

  const handleAddEmpresa = async () => {
    if (!newEmpresaNome.trim()) return
    const cores: CorEmpresa[] = ['red', 'gray', 'green']
    const novaCor = cores[empresas.length % 3] as CorEmpresa
    const empresaId = uuidv4()

    let avatarUrl = ''
    if (newEmpresaAvatar) {
      // Se for arquivo, fazer upload
      if (newEmpresaAvatar instanceof File) {
        const url = await uploadAvatar(newEmpresaAvatar, empresaId)
        avatarUrl = url || ''
      } else {
        // Se já for URL, manter como está
        avatarUrl = newEmpresaAvatar
      }
    }

    const novaEmpresa: Empresa = {
      id: empresaId,
      nome: newEmpresaNome,
      cor: novaCor,
      avatar: avatarUrl,
      instagram: newEmpresaInstagram,
      agendamentos: newEmpresaAgendamentos,
      pagina: newEmpresaPagina,
      tiktok: newEmpresaTiktok,
      google: newEmpresaGoogle,
      claude: newEmpresaClaude,
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
          avatar: novaEmpresa.avatar || null,
          instagram: novaEmpresa.instagram || null,
          agendamentos: novaEmpresa.agendamentos || null,
          pagina: novaEmpresa.pagina || null,
          tiktok: novaEmpresa.tiktok || null,
          google: novaEmpresa.google || null,
          claude: novaEmpresa.claude || null,
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
    setNewEmpresaClaude('')
    setNewEmpresaLogins('')
    setShowAddEmpresa(false)
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
    if (!texto.trim() || texto.length < 3) return []
    const textoLower = texto.toLowerCase()
    return getTodasAsDescricoes().filter(desc =>
      desc.toLowerCase().includes(textoLower)
    )
  }

  const handleToggleTarefa = async (empresaId: string, tarefaId: string) => {
    // Encontra a tarefa para saber o status atual
    const tarefa = empresas
      .find(e => e.id === empresaId)
      ?.tarefas.find(t => t.id === tarefaId)

    if (!tarefa) return

    const novoStatus = !tarefa.concluida

    // Atualiza localmente
    setEmpresas(
      empresas.map(emp => {
        if (emp.id === empresaId) {
          return {
            ...emp,
            tarefas: emp.tarefas.map(t =>
              t.id === tarefaId ? { ...t, concluida: novoStatus } : t
            ),
          }
        }
        return emp
      })
    )

    // Salva no Supabase
    try {
      const res = await fetch('/api/demandas/tarefas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tarefaId,
          concluida: novoStatus
        })
      })
      if (!res.ok) {
        console.error('Erro ao atualizar tarefa')
      }
    } catch (err) {
      console.error('Erro:', err)
    }
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
          periodo: periodo
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
    setNewTarefaPeriodo(getPeriodoAtual())
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

  const somarDias = (data: string, dias: number): string => {
    const [dia, mes, ano] = data.split('/').map(Number)
    const dataObj = new Date(ano, mes - 1, dia)
    dataObj.setDate(dataObj.getDate() + dias)
    return `${dataObj.getDate()}/${String(dataObj.getMonth() + 1).padStart(2, '0')}/${dataObj.getFullYear()}`
  }

  const distribuirTarefas = (dataInicial: string, quantidade: number): Array<{ data: string; periodo: 'manha' | 'tarde' }> => {
    const resultado = []
    for (let i = 0; i < quantidade; i++) {
      const diaOffset = i % 7
      const data = somarDias(dataInicial, diaOffset)
      const periodo = Math.floor(i / 7) % 2 === 0 ? 'manha' : 'tarde'
      resultado.push({ data, periodo })
    }
    return resultado
  }

  const validarFormatoData = (dataString: string): boolean => {
    const regex = /^\d{1,2}\/\d{1,2}\/\d{4}$/
    if (!regex.test(dataString)) return false
    const [dia, mes, ano] = dataString.split('/').map(Number)
    return dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12 && ano >= 2000
  }

  const getPeriodoAtual = () => {
    const hora = new Date().getHours()
    return hora < 12 ? 'manha' : 'tarde'
  }

  const adicionarTarefasEmLote = async (empresaId: string) => {
    if (!tarefasEmLoteTexto.trim() || !tarefasEmLoteData.trim()) {
      alert('Preencha a lista de tarefas e a data inicial')
      return
    }

    if (!validarFormatoData(tarefasEmLoteData)) {
      alert('Data inválida! Use formato DD/MM/YYYY')
      return
    }

    const linhas = tarefasEmLoteTexto.split('\n').filter(l => l.trim())
    if (linhas.length === 0) {
      alert('Adicione pelo menos uma tarefa')
      return
    }

    // Usar função centralizada para distribuir tarefas
    const distribuicao = distribuirTarefas(tarefasEmLoteData, linhas.length)
    const tarefasParaCriar = linhas.map((descricao, index) => ({
      empresa_id: empresaId,
      descricao: descricao.trim(),
      data: distribuicao[index].data,
      periodo: distribuicao[index].periodo
    }))

    try {
      for (const tarefa of tarefasParaCriar) {
        const res = await fetch('/api/demandas/tarefas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tarefa)
        })

        if (!res.ok) {
          console.error('Erro ao criar tarefa:', tarefa)
        }
      }

      // Recarregar dados
      const res = await fetch('/api/demandas')
      const data = await res.json()
      if (Array.isArray(data)) {
        setEmpresas(data.map((emp: any) => ({
          ...emp,
          tarefas: emp.tarefas || []
        })))
      }

      alert(`✅ ${tarefasParaCriar.length} tarefas criadas com sucesso!`)
      setShowTarefasEmLote(null)
      setTarefasEmLoteTexto('')
    } catch (err) {
      console.error('Erro ao criar tarefas em lote:', err)
      alert('Erro ao criar tarefas')
    }
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
      // Converter data de DD/MM/YYYY para YYYY-MM-DD para o input date
      const [dia, mes, ano] = tarefa.data.split('/')
      setEditTarefaDataSeletor(`${ano}-${mes}-${dia}`)
    }
  }

  const handleSalvarEdicaoTarefa = async () => {
    if (!selectedTarefaEdit || !editTarefaDescricao.trim() || !editTarefaData.trim()) return

    // Atualizar estado local imediatamente
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

    // Salvar no Supabase
    try {
      const res = await fetch('/api/demandas/tarefas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTarefaEdit.tarefaId,
          descricao: editTarefaDescricao,
          data: editTarefaData || selectedTarefaEdit.data,
          periodo: editTarefaPeriodo,
          concluida: selectedTarefaEdit.concluida
        })
      })

      if (!res.ok) {
        const error = await res.json()
        console.error('Erro ao salvar tarefa:', error)
        alert('Erro ao salvar tarefa: ' + (error.error || 'Desconhecido'))
      }
    } catch (err) {
      console.error('Erro ao salvar tarefa:', err)
      alert('Erro ao salvar tarefa: ' + (err as Error).message)
    }

    setSelectedTarefaEdit(null)
    setEditTarefaDescricao('')
    setEditTarefaData('')
    setEditTarefaPeriodo('manha')
    setEditTarefaDataSeletor('')
    setSugestoesEdicaoTarefas([])
  }

  const handleSalvarEdicaoEmpresa = async () => {
    if (!empresaEditando || !newEmpresaNome.trim()) return

    // Guardar estado anterior para rollback
    const empresaAnterior = empresas.find(e => e.id === empresaEditando)

    let avatarUrl = empresaAnterior?.avatar || ''

    // Se arquivo foi selecionado, fazer upload
    if (newEmpresaAvatar instanceof File) {
      const url = await uploadAvatar(newEmpresaAvatar, empresaEditando)
      avatarUrl = url || empresaAnterior?.avatar || ''
    } else if (newEmpresaAvatar && typeof newEmpresaAvatar === 'string') {
      // Se já for URL, manter
      avatarUrl = newEmpresaAvatar
    }

    // Atualizar estado local imediatamente (otimista)
    setEmpresas(
      empresas.map(emp =>
        emp.id === empresaEditando
          ? {
              ...emp,
              nome: newEmpresaNome,
              avatar: avatarUrl,
              instagram: newEmpresaInstagram,
              agendamentos: newEmpresaAgendamentos,
              pagina: newEmpresaPagina,
              tiktok: newEmpresaTiktok,
              google: newEmpresaGoogle,
              claude: newEmpresaClaude,
              loginssenhas: newEmpresaLogins
            }
          : emp
      )
    )

    try {
      const res = await fetch('/api/demandas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: empresaEditando,
          nome: newEmpresaNome,
          avatar: avatarUrl || null,
          instagram: newEmpresaInstagram,
          agendamentos: newEmpresaAgendamentos,
          pagina: newEmpresaPagina,
          tiktok: newEmpresaTiktok,
          google: newEmpresaGoogle,
          claude: newEmpresaClaude,
          loginssenhas: newEmpresaLogins
        })
      })

      if (!res.ok) {
        // Rollback se falhar
        if (empresaAnterior) {
          setEmpresas(empresas.map(e => e.id === empresaEditando ? empresaAnterior : e))
        }
        alert('Erro ao salvar empresa')
        return
      }

      // Sucesso - fechar modal e limpar
      setEmpresaEditando(null)
      setNewEmpresaNome('')
      setNewEmpresaAvatar('')
      setNewEmpresaAvatarPreview('')
      setNewEmpresaInstagram('')
      setNewEmpresaAgendamentos('')
      setNewEmpresaPagina('')
      setNewEmpresaTiktok('')
      setNewEmpresaGoogle('')
      setNewEmpresaClaude('')
      setNewEmpresaLogins('')
    } catch (err) {
      console.error('Erro ao salvar empresa:', err)
      // Rollback se falhar
      if (empresaAnterior) {
        setEmpresas(empresas.map(e => e.id === empresaEditando ? empresaAnterior : e))
      }
      alert('Erro ao salvar empresa')
    }
  }

  const fecharEdicaoEmpresa = () => {
    setEmpresaEditando(null)
    setNewEmpresaNome('')
    setNewEmpresaAvatar('')
    setNewEmpresaAvatarPreview('')
    setNewEmpresaInstagram('')
    setNewEmpresaAgendamentos('')
    setNewEmpresaPagina('')
    setNewEmpresaTiktok('')
    setNewEmpresaGoogle('')
    setNewEmpresaClaude('')
    setNewEmpresaLogins('')
  }

  const handleDeletarTarefa = async (empresaId: string, tarefaId: string) => {
    // Atualizar estado local imediatamente
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

    // Deletar do Supabase
    try {
      const res = await fetch('/api/demandas/tarefas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tarefaId })
      })

      if (!res.ok) {
        console.error('Erro ao deletar tarefa')
      }
    } catch (err) {
      console.error('Erro ao deletar tarefa:', err)
    }
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

  // "DD/MM/AAAA" (formato das tarefas) <-> "AAAA-MM-DD" (seletor de data)
  const isoParaBr = (iso: string) => {
    const [ano, mes, dia] = iso.split('-')
    return `${Number(dia)}/${mes}/${ano}`
  }

  const dataDiaBr = isoParaBr(dataDia)

  // desloca o dia selecionado sem depender de fuso
  const mudarDia = (passos: number) => {
    const [ano, mes, dia] = dataDia.split('-').map(Number)
    const d = new Date(ano, mes - 1, dia + passos)
    setDataDia(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }

  const mesmaData = (data: string, alvoBr: string) => {
    const [dia, mes, ano] = data.split('/').map(Number)
    const [diaAlvo, mesAlvo, anoAlvo] = alvoBr.split('/').map(Number)
    return dia === diaAlvo && mes === mesAlvo && ano === anoAlvo
  }

  // ordena por turno (manhã antes de tarde), concluídas ao final
  const ordenarPorTurno = (
    a: { empresa: Empresa; tarefa: Tarefa },
    b: { empresa: Empresa; tarefa: Tarefa }
  ) => {
    const ordemPeriodo = { manha: 0, tarde: 1 }
    if (a.tarefa.periodo !== b.tarefa.periodo) {
      return ordemPeriodo[a.tarefa.periodo] - ordemPeriodo[b.tarefa.periodo]
    }
    if (a.tarefa.concluida !== b.tarefa.concluida) return a.tarefa.concluida ? 1 : -1
    return a.empresa.nome.localeCompare(b.empresa.nome)
  }

  const todasAsDemandas = empresas.flatMap(emp =>
    emp.tarefas.map(tarefa => ({ empresa: emp, tarefa }))
  )

  const UM_DIA = 24 * 60 * 60 * 1000
  const inicioJanela = converterDataParaDate(dataDiaBr).getTime()
  const fimJanela = inicioJanela + (periodoDia - 1) * UM_DIA

  // rótulo do intervalo: um dia ou "25 Ago a 31 Ago".
  // converterDataParaDate cria a data em UTC, então lê-se em UTC para
  // não perder um dia em fusos negativos
  const fimJanelaBr = (() => {
    const d = new Date(fimJanela)
    return `${d.getUTCDate()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`
  })()
  const rotuloJanela = periodoDia === 1
    ? formatarData(dataDiaBr)
    : `${formatarData(dataDiaBr)} a ${formatarData(fimJanelaBr)}`

  const demandasDoDia = todasAsDemandas
    .filter(({ tarefa }) => {
      const t = converterDataParaDate(tarefa.data).getTime()
      return t >= inicioJanela && t <= fimJanela
    })
    .sort((a, b) => {
      const dataA = converterDataParaDate(a.tarefa.data).getTime()
      const dataB = converterDataParaDate(b.tarefa.data).getTime()
      if (dataA !== dataB) return dataA - dataB
      return ordenarPorTurno(a, b)
    })

  // atrasadas: pendentes anteriores ao início da janela, mais antigas primeiro.
  // Com 7 dias selecionado, só as que venceram nos 7 dias anteriores.
  const inicioAtraso = periodoDia === 1 ? -Infinity : inicioJanela - 7 * UM_DIA
  const demandasAtrasadas = todasAsDemandas
    .filter(({ tarefa }) => {
      if (tarefa.concluida) return false
      const t = converterDataParaDate(tarefa.data).getTime()
      return t < inicioJanela && t >= inicioAtraso
    })
    .sort((a, b) => {
      const dataA = converterDataParaDate(a.tarefa.data).getTime()
      const dataB = converterDataParaDate(b.tarefa.data).getTime()
      if (dataA !== dataB) return dataA - dataB
      return ordenarPorTurno(a, b)
    })

  // busca do pop-up: a partir de 3 letras, filtra por tarefa ou empresa
  const buscaDiaLower = buscaDia.trim().toLowerCase()
  const filtrarPorBusca = (lista: { empresa: Empresa; tarefa: Tarefa }[]) =>
    buscaDiaLower.length < 3
      ? lista
      : lista.filter(({ empresa, tarefa }) =>
          tarefa.descricao.toLowerCase().includes(buscaDiaLower) ||
          empresa.nome.toLowerCase().includes(buscaDiaLower)
        )

  const demandasDoDiaFiltradas = filtrarPorBusca(demandasDoDia)
  const demandasAtrasadasFiltradas = filtrarPorBusca(demandasAtrasadas)

  // linha de tarefa do pop-up, no mesmo layout do cartão da empresa
  const linhaDemanda = (empresa: Empresa, tarefa: Tarefa, atrasada: boolean) => (
    <div
      key={tarefa.id}
      className={`group flex items-center gap-2 border-l-4 transition-colors ${
        tarefasAguardando.has(tarefa.id)
          ? 'border-l-red-500 bg-red-50'
          : atrasada ? 'border-l-red-300' : 'border-l-transparent'
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        onDoubleClick={() => handleToggleTarefa(empresa.id, tarefa.id)}
        className="w-full text-left py-2 px-3 transition-colors flex items-center justify-between gap-3 text-xs cursor-pointer hover:bg-gray-50"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={`opacity-30 ${tarefa.periodo === 'manha' ? 'text-orange-400' : 'text-blue-400'}`}>
            ☀
          </span>
          <div className="flex-1 min-w-0">
            <p className={`truncate leading-tight ${tarefa.concluida ? 'line-through text-gray-400' : 'text-gray-700'}`}>
              {tarefa.descricao}
            </p>
            <p className="text-[10px] leading-tight text-gray-400 truncate">{empresa.nome}</p>
          </div>
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
        {(atrasada || periodoDia === 7) && (
          <span className={`flex-shrink-0 whitespace-nowrap text-[10px] ${atrasada ? 'text-red-500' : 'text-gray-400'}`}>
            {formatarData(tarefa.data)}
          </span>
        )}
      </div>
    </div>
  )

  return (
    <div className={`space-y-4 min-h-screen transition-colors ${darkMode ? 'bg-black' : 'bg-white'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between pb-3 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <h1 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>Demandas</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setBuscaDia('')
              const hoje = new Date()
              setDataDia(`${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`)
              setShowDemandasDia(true)
            }}
            className="border border-gray-300 hover:bg-gray-50 text-black text-xs font-medium py-1.5 px-3 rounded flex items-center gap-1.5 transition-colors"
          >
            <Calendar size={14} />
            Demandas do Dia
          </button>
          <button
            onClick={() => setShowAddEmpresa(true)}
            className="bg-black hover:bg-gray-800 text-white text-xs font-medium py-1.5 px-3 rounded flex items-center gap-1.5 transition-colors"
          >
            <Plus size={14} />
            Nova Empresa
          </button>
        </div>
      </div>

      {/* Barra de Pesquisa com Filtro */}
      <div className="mb-4 flex items-center gap-2 relative">
        <div className="flex-1">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar empresa ou tarefa..."
            className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:border-black transition-colors ${
              darkMode
                ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400 placeholder:opacity-40'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-900 placeholder:opacity-40'
            }`}
          />
        </div>

        {/* Ícone de Filtro */}
        <button
          onClick={() => setMostrarFiltroExibicao(!mostrarFiltroExibicao)}
          className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-900 text-gray-300 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}
          title="Filtrar exibição"
        >
          <Filter size={18} />
        </button>

        {/* Dropdown do Filtro */}
        {mostrarFiltroExibicao && (
          <div className={`absolute top-full right-0 mt-2 rounded-lg p-3 z-10 shadow-lg border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex flex-col gap-2">
              <span className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Exibir:</span>
              {[2, 3, 4, 5, 6].map(num => (
                <button
                  key={num}
                  onClick={() => {
                    setTarefasExibidas(num)
                    setMostrarFiltroExibicao(false)
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors w-full text-left ${
                    tarefasExibidas === num
                      ? 'bg-black text-white'
                      : darkMode
                      ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {num} tarefas
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grid 3 colunas */}
      <div className="grid grid-cols-3 gap-3">
        {empresasFiltradas.map(empresa => (
          <div
            key={empresa.id}
            className={`rounded p-3 border transition-colors ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}
          >
            {/* Header da Empresa */}
            <div
              className={`flex items-center gap-2.5 mb-2.5 pb-2.5 border-b cursor-pointer hover:opacity-80 transition-opacity ${darkMode ? 'border-gray-800' : 'border-gray-150'}`}
              onDoubleClick={() => {
                setEmpresaEditando(empresa.id)
                setNewEmpresaNome(empresa.nome)
                setNewEmpresaAvatar(empresa.avatar || '')
                setNewEmpresaAvatarPreview(empresa.avatar || '')
                setNewEmpresaInstagram(empresa.instagram || '')
                setNewEmpresaAgendamentos(empresa.agendamentos || '')
                setNewEmpresaPagina(empresa.pagina || '')
                setNewEmpresaTiktok(empresa.tiktok || '')
                setNewEmpresaGoogle(empresa.google || '')
                setNewEmpresaClaude(empresa.claude || '')
                setNewEmpresaLogins(empresa.loginssenhas || '')
              }}
            >
              {empresa.avatar ? (
                <img src={empresa.avatar} alt={empresa.nome} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className={`w-10 h-10 rounded-full ${CORES[empresa.cor as CorEmpresa]} flex-shrink-0`} />
              )}
              <div className="flex-1 min-w-0">
                <h3 className={`font-medium text-xs ${darkMode ? 'text-white' : 'text-black'}`}>{empresa.nome}</h3>
              </div>
            </div>

            {/* Lista de Tarefas em formato tabela */}
            <div
              data-task-list
              className="divide-y divide-gray-150 overflow-y-auto"
              style={{
                maxHeight: `${tarefasExibidas * 36}px`,
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              <style>{`
                [data-task-list]::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              {empresa.tarefas.sort((a, b) => {
                if (a.concluida !== b.concluida) return a.concluida ? 1 : -1
                const dataA = converterDataParaDate(a.data).getTime()
                const dataB = converterDataParaDate(b.data).getTime()
                if (dataA !== dataB) return dataA - dataB
                const periodoOrder = { manha: 0, tarde: 1 }
                return periodoOrder[a.periodo] - periodoOrder[b.periodo]
              }).map(tarefa => (
                <div
                  key={tarefa.id}
                  className={`group flex items-center gap-2 border-l-4 transition-colors ${tarefasAguardando.has(tarefa.id) ? 'border-l-red-500 bg-red-50' : 'border-l-transparent'}`}
                >
                  <button
                    onDoubleClick={() => handleToggleTarefa(empresa.id, tarefa.id)}
                    className={`w-full text-left py-2 px-3 transition-colors flex items-center justify-between gap-3 text-xs ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className={`opacity-30 ${tarefa.periodo === 'manha' ? 'text-orange-400' : 'text-blue-400'}`}>
                        ☀
                      </span>
                      <span className={`flex-1 truncate ${tarefa.concluida ? `line-through ${darkMode ? 'text-gray-600' : 'text-gray-400'}` : darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
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
                    <span className={`flex-shrink-0 whitespace-nowrap text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatarData(tarefa.data)}
                    </span>
                  </button>
                </div>
              ))}
            </div>

            {/* Footer com botão Nova Tarefa */}
            <div className="border-t border-gray-150 pt-2 mt-2">
              <div className="space-y-1.5">
                <button
                  onClick={() => setShowAddTarefaPopup(empresa.id)}
                  className={`w-full text-center text-xs font-medium transition-colors py-1 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  + Nova Tarefa
                </button>
                <button
                  onClick={() => {
                    setShowTarefasEmLote(empresa.id)
                    const hoje = new Date()
                    setTarefasEmLoteData(`${hoje.getDate()}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`)
                    setTarefasEmLoteTexto('')
                  }}
                  className={`w-full text-center text-xs font-medium transition-colors py-1 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  📋 Tarefas em Lote
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pop-up Demandas do Dia */}
      {showDemandasDia && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowDemandasDia(false)
          }}
        >
          {/* tamanho de agenda: 120 x 146 mm (454 x 552 px) */}
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-xl w-[454px] h-[552px] max-w-[92vw] max-h-[88vh] flex flex-col">
            {/* Header no padrão do cartão da empresa */}
            <div className="flex items-center gap-2.5 mb-2.5 pb-2.5 border-b border-gray-150">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm leading-tight text-black">Demandas do Dia</h3>
                <p className="text-[10px] leading-tight text-gray-400 mt-0.5">
                  {rotuloJanela} · {demandasDoDiaFiltradas.length} {demandasDoDiaFiltradas.length === 1 ? 'tarefa' : 'tarefas'}
                  {demandasAtrasadasFiltradas.length > 0 && (
                    <span className="text-red-500">
                      {' '}· {demandasAtrasadasFiltradas.length} em atraso
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setShowDemandasDia(false)}
                aria-label="Fechar"
                className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Seletor de data */}
            <div className="flex items-center gap-1.5 mb-2">
              <button
                onClick={() => mudarDia(-1)}
                aria-label="Dia anterior"
                className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <div className="relative flex-1 flex items-center">
                <Calendar size={13} className="absolute left-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={dataDia}
                  onChange={(e) => e.target.value && setDataDia(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-full focus:outline-none focus:border-black text-black"
                />
              </div>
              <button
                onClick={() => mudarDia(1)}
                aria-label="Próximo dia"
                className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Período da análise */}
            <div className="flex items-center gap-1.5 mb-2">
              {([1, 7] as const).map(dias => (
                <button
                  key={dias}
                  onClick={() => setPeriodoDia(dias)}
                  className={`px-4 py-1.5 text-xs rounded-full border transition-colors ${
                    periodoDia === dias
                      ? 'bg-black text-white border-black'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {dias === 1 ? 'Dia' : '7 dias'}
                </button>
              ))}
            </div>

            {/* Busca por tarefa ou empresa */}
            <div className="relative flex items-center mb-2.5">
              <Search size={13} className="absolute left-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={buscaDia}
                onChange={(e) => setBuscaDia(e.target.value)}
                placeholder="Buscar tarefa ou empresa..."
                autoFocus
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-full focus:outline-none focus:border-black placeholder-gray-400 text-black"
              />
            </div>

            {/* Lista no mesmo layout das linhas do cartão */}
            <div className="flex-1 overflow-y-auto scrollbar-none">
              {/* Pendentes de dias anteriores: o que pode atrasar o dia */}
              {demandasAtrasadasFiltradas.length > 0 && (
                <>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-red-500 px-3 pt-1 pb-1.5">
                    Em atraso{periodoDia === 7 && ' · 7 dias anteriores'}
                  </p>
                  <div className="divide-y divide-gray-150">
                    {demandasAtrasadasFiltradas.map(({ empresa, tarefa }) =>
                      linhaDemanda(empresa, tarefa, true)
                    )}
                  </div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 px-3 pt-3 pb-1.5 border-t border-gray-150">
                    {rotuloJanela}
                  </p>
                </>
              )}

              <div className="divide-y divide-gray-150">
                {demandasDoDiaFiltradas.map(({ empresa, tarefa }) =>
                  linhaDemanda(empresa, tarefa, false)
                )}
              </div>

              {demandasDoDiaFiltradas.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-8">
                  {demandasDoDia.length === 0
                    ? periodoDia === 1
                      ? 'Nenhuma demanda para este dia.'
                      : 'Nenhuma demanda para este período.'
                    : `Nada encontrado para "${buscaDia}".`}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

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
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-black text-gray-900 placeholder-gray-900 placeholder:opacity-40"
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
                      className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium px-2.5 py-1 rounded-full transition-colors"
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
          <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4 space-y-4 relative">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-black">Nova Tarefa</h2>
              <button
                onClick={() => setShowAddTarefaPopup(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={newTarefaDescricao}
                onChange={(e) => {
                  setNewTarefaDescricao(e.target.value)
                  setSugestoesNovasTarefas(filtrarSugestoes(e.target.value))
                }}
                placeholder="Descrição da tarefa"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-black text-gray-900 placeholder-gray-900 placeholder:opacity-40"
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
                      className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium px-2.5 py-1 rounded-full transition-colors"
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
                  onClick={() => adicionarTarefa(showAddTarefaPopup as string, getDataHoje(), newTarefaPeriodo)}
                  disabled={!newTarefaDescricao.trim()}
                  className="bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white font-medium py-2 text-xs rounded-full transition-colors"
                >
                  Hoje
                </button>
                <button
                  onClick={() => adicionarTarefa(showAddTarefaPopup as string, getDataAmanha(), newTarefaPeriodo)}
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
                    adicionarTarefa(showAddTarefaPopup as string, `${dia}/${mes}/${ano}`, newTarefaPeriodo)
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
                setNewTarefaPeriodo(getPeriodoAtual())
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
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 my-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-black">Nova Empresa</h2>
              <button
                onClick={() => setShowAddEmpresa(false)}
                aria-label="Fechar"
                className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nome */}
            <div className="relative flex items-center">
              <Building2 size={14} className="absolute left-3 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={newEmpresaNome}
                onChange={(e) => setNewEmpresaNome(e.target.value)}
                placeholder="Nome da empresa"
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-black placeholder-gray-400 text-black"
                autoFocus
              />
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-3">
              {newEmpresaAvatarPreview && (
                <img src={newEmpresaAvatarPreview} alt="Avatar" className="w-14 h-14 rounded-full object-cover" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setNewEmpresaAvatar(file)
                    const reader = new FileReader()
                    reader.onload = (evt) => {
                      setNewEmpresaAvatarPreview(evt.target?.result as string)
                    }
                    reader.readAsDataURL(file)
                  }
                }}
                className="flex-1 text-xs text-gray-500 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 file:text-xs hover:file:bg-gray-200 file:cursor-pointer file:transition-colors"
              />
            </div>

            {/* Redes e links */}
            <div className="grid grid-cols-2 gap-3">
              <CampoLink icone={Camera} valor={newEmpresaInstagram} aoMudar={setNewEmpresaInstagram} placeholder="Instagram" />
              <CampoLink icone={Music2} valor={newEmpresaTiktok} aoMudar={setNewEmpresaTiktok} placeholder="TikTok" />
              <CampoLink icone={Globe} valor={newEmpresaPagina} aoMudar={setNewEmpresaPagina} placeholder="Página/Site" />
              <CampoLink icone={Search} valor={newEmpresaGoogle} aoMudar={setNewEmpresaGoogle} placeholder="Google" />
              <CampoLink icone={Asterisk} valor={newEmpresaClaude} aoMudar={setNewEmpresaClaude} placeholder="Claude (link do projeto)" />
              <CampoLink icone={Calendar} valor={newEmpresaAgendamentos} aoMudar={setNewEmpresaAgendamentos} placeholder="Agendamentos" />
            </div>

            {/* Logins e Senhas */}
            <div className="relative">
              <KeyRound size={14} className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
              <textarea
                value={newEmpresaLogins}
                onChange={(e) => setNewEmpresaLogins(e.target.value)}
                placeholder="Logins e Senhas"
                rows={4}
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-black resize-none placeholder-gray-400 text-black"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowAddEmpresa(false)}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-black font-medium py-2 text-xs rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddEmpresa}
                className="flex-1 bg-black hover:bg-gray-800 text-white font-medium py-2 text-xs rounded-lg transition-colors"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Empresa */}
      {empresaEditando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 my-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-black">Editar Empresa</h2>
              <button
                onClick={fecharEdicaoEmpresa}
                aria-label="Fechar"
                className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nome */}
            <div className="relative flex items-center">
              <Building2 size={14} className="absolute left-3 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={newEmpresaNome}
                onChange={(e) => setNewEmpresaNome(e.target.value)}
                placeholder="Nome da empresa"
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-black placeholder-gray-400 text-black"
              />
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-3">
              {newEmpresaAvatarPreview && (
                <img src={newEmpresaAvatarPreview} alt="Avatar" className="w-14 h-14 rounded-full object-cover" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setNewEmpresaAvatar(file)
                    const reader = new FileReader()
                    reader.onload = (evt) => {
                      setNewEmpresaAvatarPreview(evt.target?.result as string)
                    }
                    reader.readAsDataURL(file)
                  }
                }}
                className="flex-1 text-xs text-gray-500 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 file:text-xs hover:file:bg-gray-200 file:cursor-pointer file:transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <CampoLink icone={Camera} valor={newEmpresaInstagram} aoMudar={setNewEmpresaInstagram} placeholder="Instagram" />
              <CampoLink icone={Music2} valor={newEmpresaTiktok} aoMudar={setNewEmpresaTiktok} placeholder="TikTok" />
              <CampoLink icone={Globe} valor={newEmpresaPagina} aoMudar={setNewEmpresaPagina} placeholder="Página/Site" />
              <CampoLink icone={Search} valor={newEmpresaGoogle} aoMudar={setNewEmpresaGoogle} placeholder="Google" />
              <CampoLink icone={Asterisk} valor={newEmpresaClaude} aoMudar={setNewEmpresaClaude} placeholder="Claude (link do projeto)" />
              <CampoLink icone={Calendar} valor={newEmpresaAgendamentos} aoMudar={setNewEmpresaAgendamentos} placeholder="Agendamentos" />
            </div>

            {/* Logins e Senhas */}
            <div className="relative">
              <KeyRound size={14} className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
              <textarea
                value={newEmpresaLogins}
                onChange={(e) => setNewEmpresaLogins(e.target.value)}
                placeholder="Logins e Senhas"
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-black placeholder-gray-400 text-black resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={fecharEdicaoEmpresa}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-black font-medium py-2 text-xs rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarEdicaoEmpresa}
                className="flex-1 bg-black hover:bg-gray-800 text-white font-medium py-2 text-xs rounded-lg transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tarefas em Lote */}
      {showTarefasEmLote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 my-8 space-y-4">
            <h2 className="text-lg font-semibold text-black">📋 Criar Tarefas em Lote</h2>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Cole cada tarefa em uma linha:</label>
              <textarea
                value={tarefasEmLoteTexto}
                onChange={(e) => setTarefasEmLoteTexto(e.target.value)}
                placeholder="Nome do Evento&#10;Logo do Evento&#10;Comunicação e convite&#10;Arte do convite digital"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-black placeholder-gray-600"
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Data inicial (padrão: próximos 7 dias):</label>
              <input
                type="text"
                value={tarefasEmLoteData}
                onChange={(e) => setTarefasEmLoteData(e.target.value)}
                placeholder="DD/MM/AAAA"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-black placeholder-gray-600"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-xs text-blue-900">
                ℹ️ <strong>Como funciona:</strong> As tarefas serão distribuídas nos próximos 7 dias, alternando entre manhã e tarde.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setShowTarefasEmLote(null)
                  setTarefasEmLoteTexto('')
                }}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-black font-medium py-2 text-xs rounded transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => adicionarTarefasEmLote(showTarefasEmLote as string)}
                className="flex-1 bg-black hover:bg-gray-800 text-white font-medium py-2 text-xs rounded transition-colors"
              >
                Criar Tarefas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
