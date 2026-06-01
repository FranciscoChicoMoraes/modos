'use client'

import { useState, useEffect } from 'react'

export interface Tarefa {
  id: string
  descricao: string
  data: string
  periodo: 'manha' | 'tarde'
  concluida: boolean
  empresa_id?: string
}

export interface Empresa {
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

export function useDemandas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch initial data
  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/demandas')
        if (!response.ok) throw new Error('Falha ao carregar demandas')
        const data = await response.json()
        setEmpresas(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchEmpresas()
  }, [])

  const addEmpresa = async (empresaData: Omit<Empresa, 'id' | 'tarefas'>) => {
    try {
      const response = await fetch('/api/demandas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empresaData),
      })
      if (!response.ok) throw new Error('Falha ao criar empresa')
      const novaEmpresa = await response.json()
      setEmpresas([...empresas, novaEmpresa])
      return novaEmpresa
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar empresa'
      setError(message)
      throw err
    }
  }

  const deleteEmpresa = async (empresaId: string) => {
    try {
      const response = await fetch(`/api/demandas/${empresaId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Falha ao deletar empresa')
      setEmpresas(empresas.filter(e => e.id !== empresaId))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar empresa'
      setError(message)
      throw err
    }
  }

  const addTarefa = async (tarefaData: Omit<Tarefa, 'id' | 'concluida'>) => {
    try {
      const response = await fetch('/api/demandas/tarefas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tarefaData),
      })
      if (!response.ok) throw new Error('Falha ao criar tarefa')
      const novaTarefa = await response.json()

      setEmpresas(
        empresas.map(emp => {
          if (emp.id === tarefaData.empresa_id) {
            return {
              ...emp,
              tarefas: [...emp.tarefas, novaTarefa].sort((a, b) => {
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
      return novaTarefa
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar tarefa'
      setError(message)
      throw err
    }
  }

  const toggleTarefa = async (tarefaId: string) => {
    try {
      const response = await fetch(`/api/demandas/tarefas/${tarefaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toggle: true }),
      })
      if (!response.ok) throw new Error('Falha ao atualizar tarefa')
      const tarefaAtualizada = await response.json()

      setEmpresas(
        empresas.map(emp => {
          if (emp.tarefas.some(t => t.id === tarefaId)) {
            return {
              ...emp,
              tarefas: emp.tarefas.map(t =>
                t.id === tarefaId ? { ...t, concluida: !t.concluida } : t
              )
            }
          }
          return emp
        })
      )
      return tarefaAtualizada
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar tarefa'
      setError(message)
      throw err
    }
  }

  const updateTarefa = async (tarefaId: string, updates: Partial<Omit<Tarefa, 'id' | 'empresa_id'>>) => {
    try {
      const response = await fetch(`/api/demandas/tarefas/${tarefaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) throw new Error('Falha ao atualizar tarefa')
      const tarefaAtualizada = await response.json()

      setEmpresas(
        empresas.map(emp => {
          if (emp.tarefas.some(t => t.id === tarefaId)) {
            return {
              ...emp,
              tarefas: emp.tarefas.map(t =>
                t.id === tarefaId ? { ...t, ...updates } : t
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
      return tarefaAtualizada
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar tarefa'
      setError(message)
      throw err
    }
  }

  const deleteTarefa = async (tarefaId: string) => {
    try {
      const response = await fetch(`/api/demandas/tarefas/${tarefaId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Falha ao deletar tarefa')

      setEmpresas(
        empresas.map(emp => {
          if (emp.tarefas.some(t => t.id === tarefaId)) {
            return {
              ...emp,
              tarefas: emp.tarefas.filter(t => t.id !== tarefaId)
            }
          }
          return emp
        })
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar tarefa'
      setError(message)
      throw err
    }
  }

  return {
    empresas,
    loading,
    error,
    addEmpresa,
    deleteEmpresa,
    addTarefa,
    toggleTarefa,
    updateTarefa,
    deleteTarefa,
  }
}
