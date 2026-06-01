'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader } from 'lucide-react'
import { TierBadge } from '@/components/videoflow/TierBadge'
import { AgentPanel } from '@/components/videoflow/AgentPanel'
import { generateScript, extractKeywords, inferDay } from '@/lib/videoflow/agent'

type Tier = 'hard' | 'medium' | 'easy'
type AgentStatus = 'idle' | 'running' | 'done' | 'error'

export default function NovoRoteiro() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [context, setContext] = useState('')
  const [tier, setTier] = useState<Tier>('hard')
  const [script, setScript] = useState('')
  const [loading, setLoading] = useState(false)
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('idle')
  const [keywords, setKeywords] = useState<string[]>([])
  const [searchTerms, setSearchTerms] = useState<string[]>([])
  const [error, setError] = useState<string>('')

  const handleGenerateScript = async () => {
    if (!title.trim()) {
      setError('Título é obrigatório')
      return
    }

    setLoading(true)
    setError('')
    try {
      const generatedScript = await generateScript(title, tier, context)
      setScript(generatedScript)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar roteiro')
    } finally {
      setLoading(false)
    }
  }

  const handleRunAgent = async () => {
    if (!script.trim()) {
      setError('Gere um roteiro primeiro')
      return
    }

    setAgentStatus('running')
    setError('')
    try {
      const result = await extractKeywords(title, script)
      setKeywords(result.keywords)
      setSearchTerms(result.searchTerms)
      setAgentStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao executar agente')
      setAgentStatus('error')
    }
  }

  const handleSave = async () => {
    if (!title.trim() || !script.trim()) {
      setError('Título e roteiro são obrigatórios')
      return
    }

    setLoading(true)
    setError('')
    try {
      const day = inferDay(title, tier)
      // Aqui você integraria com Supabase
      // const { data, error } = await supabase.from('scripts').insert([{
      //   title,
      //   script_body: script,
      //   tier,
      //   day_id: day,
      //   column_id: 'roteiro',
      //   agent_status: 'idle'
      // }])

      // Por enquanto, apenas navegamos de volta
      router.push('/videoflow')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar roteiro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-black">Novo Roteiro</h1>
        <p className="text-gray-600 mt-1">Crie um novo roteiro com assistência de IA</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Título do Vídeo *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Como Estruturar uma Estratégia de Vendas"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
            />
          </div>

          {/* Tier */}
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Intensidade do Conteúdo
            </label>
            <div className="flex gap-3">
              {(['hard', 'medium', 'easy'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={`px-4 py-2 rounded font-medium transition-all ${
                    tier === t
                      ? 'ring-2 ring-offset-2'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <TierBadge tier={t} />
                </button>
              ))}
            </div>
          </div>

          {/* Context */}
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Contexto Adicional (opcional)
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Informações extras que ajudem a personalizar o roteiro..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black resize-none"
            />
          </div>

          {/* Generated Script */}
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Roteiro Gerado
            </label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="O roteiro gerado pela IA aparecerá aqui..."
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black resize-none font-mono text-sm"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleGenerateScript}
              disabled={loading || !title.trim()}
              className="flex-1 bg-black hover:bg-gray-800 disabled:opacity-50 text-white font-semibold py-3 rounded transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader size={16} className="animate-spin" />}
              {loading ? 'Gerando...' : 'Gerar Roteiro'}
            </button>
            <button
              onClick={() => router.back()}
              className="flex-1 border border-gray-300 hover:bg-gray-50 text-black font-semibold py-3 rounded transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>

        {/* Agent Panel */}
        <div className="space-y-4">
          <h3 className="font-semibold text-black">Agente de IA</h3>
          <AgentPanel
            status={agentStatus}
            keywords={keywords}
            searchTerms={searchTerms}
            error={error}
            onRun={handleRunAgent}
          />

          {/* Save Button */}
          {script.trim() && (
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader size={16} className="animate-spin" />}
              {loading ? 'Salvando...' : '✓ Salvar Roteiro'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
