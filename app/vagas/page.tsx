'use client'

import { useState } from 'react'
import { Plus, Copy, Trash2, X } from 'lucide-react'
import { Job, Question } from '@/types'

const MOCK_JOBS: Job[] = [
  {
    id: '1',
    title: 'Designer Gráfico',
    description: 'Procuramos um designer gráfico experiente',
    questions: [
      { id: '1', text: 'Conte-nos sobre você', type: 'textarea', required: true },
      { id: '2', text: 'Quais são seus programas preferidos?', type: 'textarea', required: true },
    ],
    created_at: '2026-05-20',
  },
]

export default function Vagas() {
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ title: '', description: '' })
  const [questions, setQuestions] = useState<Question[]>([])

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: '',
      type: 'textarea',
      required: true,
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (id: string, field: string, value: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q))
  }

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  const handleCreateJob = () => {
    if (!formData.title.trim()) return

    const job: Job = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      questions: questions,
      created_at: new Date().toISOString().split('T')[0],
    }

    setJobs([...jobs, job])
    setFormData({ title: '', description: '' })
    setQuestions([])
    setShowForm(false)
  }

  const handleDeleteJob = (id: string) => {
    if (confirm('Tem certeza?')) {
      setJobs(jobs.filter(j => j.id !== id))
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-black">Vagas</h1>
          <p className="text-sm text-gray-500 mt-2">Gerenciar vagas e perguntas</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded text-sm transition-colors"
        >
          <Plus size={18} />
          Nova Vaga
        </button>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {jobs.map(job => (
          <div key={job.id} className="bg-white border border-gray-200 rounded p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-black">{job.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{job.description}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                {job.questions.length} pergunta{job.questions.length !== 1 ? 's' : ''}
              </p>
              <ul className="space-y-1 text-xs text-gray-600">
                {job.questions.slice(0, 3).map(q => (
                  <li key={q.id} className="truncate">• {q.text}</li>
                ))}
                {job.questions.length > 3 && (
                  <li className="text-gray-400">+ {job.questions.length - 3} mais</li>
                )}
              </ul>
            </div>

            <div className="flex items-center gap-2 border-t border-gray-200 pt-4">
              <button
                onClick={() => {
                  const link = `${window.location.origin}/candidatura?vaga=${job.id}`
                  navigator.clipboard.writeText(link)
                  alert('Link copiado!')
                }}
                className="flex items-center gap-2 flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-black rounded text-xs font-medium transition-colors"
              >
                <Copy size={14} />
                Copiar Link
              </button>
              <button
                onClick={() => handleDeleteJob(job.id)}
                className="px-3 py-2 text-gray-600 hover:text-black transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Job Form Modal - Google Forms Style */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-modalSlideIn">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-black">Nova Vaga</h2>
              </div>
              <button
                onClick={() => {
                  setShowForm(false)
                  setFormData({ title: '', description: '' })
                  setQuestions([])
                }}
                className="text-gray-500 hover:text-black transition-colors hover:scale-110 duration-200"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Title & Description */}
              <div className="space-y-4 pb-6 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="Título da vaga"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full text-3xl font-semibold text-black bg-transparent focus:outline-none placeholder-gray-300"
                />

                <textarea
                  placeholder="Descrição da vaga"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={2}
                  className="w-full text-sm text-gray-700 bg-transparent focus:outline-none placeholder-gray-400 resize-none"
                />
              </div>

              {/* Questions */}
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                    Perguntas ({questions.length})
                  </p>
                </div>

                {questions.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <input
                          type="text"
                          placeholder="Digite a pergunta"
                          value={question.text}
                          onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                          className="w-full text-sm font-medium text-black bg-transparent focus:outline-none placeholder-gray-300 border-b border-gray-300 pb-2"
                        />

                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <label className="text-xs text-gray-600 font-medium">Tipo de resposta</label>
                            <select
                              value={question.type}
                              onChange={(e) => updateQuestion(question.id, 'type', e.target.value)}
                              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded text-xs focus:outline-none focus:border-black"
                            >
                              <option value="text">Texto curto</option>
                              <option value="textarea">Parágrafo</option>
                              <option value="select">Múltipla escolha</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2 pt-5">
                            <input
                              type="checkbox"
                              id={`required-${question.id}`}
                              checked={question.required}
                              onChange={(e) => updateQuestion(question.id, 'required', e.target.checked)}
                              className="cursor-pointer"
                            />
                            <label htmlFor={`required-${question.id}`} className="text-xs text-gray-600 cursor-pointer">
                              Obrigatória
                            </label>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteQuestion(question.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add Question Button */}
                <button
                  onClick={addQuestion}
                  className="w-full border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg py-6 text-gray-600 hover:text-gray-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Plus size={18} />
                  Adicionar Pergunta
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowForm(false)
                  setFormData({ title: '', description: '' })
                  setQuestions([])
                }}
                className="px-6 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateJob}
                disabled={!formData.title.trim() || questions.length === 0}
                className="px-6 py-2 bg-black text-white rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Criar Vaga
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
