'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Mail, Phone, User, MessageSquare, Send } from 'lucide-react'
import { Job } from '@/types'

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

interface FormData {
  name: string
  email: string
  phone: string
  whatsapp: string
  company_name: string
  [key: string]: string
}

function FormularioDeCandidatura() {
  const searchParams = useSearchParams()
  const vagaId = searchParams.get('vaga')
  const [job, setJob] = useState<Job | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    company_name: '',
  })
  const [answers, setAnswers] = useState<{ [key: string]: string }>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (vagaId) {
      const foundJob = MOCK_JOBS.find(j => j.id === vagaId)
      setJob(foundJob || null)
    }
  }, [vagaId])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Nome e email são obrigatórios')
      return
    }

    const requiredQuestions = job?.questions.filter(q => q.required) || []
    const allAnswered = requiredQuestions.every(q => answers[q.id]?.trim())

    if (!allAnswered) {
      alert('Preencha todas as perguntas obrigatórias')
      return
    }

    const candidateData = {
      ...formData,
      jobId: vagaId,
      answers: answers,
      submittedAt: new Date().toISOString(),
    }

    localStorage.setItem(`candidatura_${Date.now()}`, JSON.stringify(candidateData))

    setSubmitted(true)
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Carregando vaga...</p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-semibold text-black mb-2">Candidatura Recebida!</h1>
          <p className="text-gray-600">Obrigado por se candidatar para a vaga de {job.title}. Entraremos em contato em breve.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-black">{job.title}</h1>
          <p className="text-sm text-gray-600 mt-1">{job.description}</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info Section */}
          <div className="space-y-6 pb-8 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Informações Pessoais</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <User size={16} />
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Digite seu nome completo"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Mail size={16} />
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Phone size={16} />
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                    placeholder="55 11 99999-9999"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Empresa Atual</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  placeholder="Nome da empresa"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all"
                />
              </div>
            </div>
          </div>

          {/* Questions Section */}
          {job.questions.length > 0 && (
            <div className="space-y-6">
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Perguntas</p>

              {job.questions.map((question, index) => (
                <div key={question.id} className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    {question.text}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {question.type === 'text' && (
                    <input
                      type="text"
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      placeholder="Responda aqui"
                      required={question.required}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all"
                    />
                  )}

                  {question.type === 'textarea' && (
                    <textarea
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      placeholder="Responda aqui"
                      rows={4}
                      required={question.required}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all resize-none"
                    />
                  )}

                  {question.type === 'select' && (
                    <select
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      required={question.required}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all"
                    >
                      <option value="">Selecione uma opção</option>
                      <option value="opcao1">Opção 1</option>
                      <option value="opcao2">Opção 2</option>
                      <option value="opcao3">Opção 3</option>
                    </select>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-8 border-t border-gray-200">
            <button
              type="submit"
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Send size={18} />
              Enviar Candidatura
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// useSearchParams precisa de um limite de suspensão para a página ser gerada
export default function Candidatura() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
          Carregando...
        </div>
      }
    >
      <FormularioDeCandidatura />
    </Suspense>
  )
}
