'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

const QUESTIONS = [
  { id: 'about', label: 'Conte-nos sobre você' },
  { id: 'experience', label: 'Qual é sua experiência principal?' },
  { id: 'goals', label: 'Quais são seus objetivos profissionais?' },
]

export function ApplicationForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    experience_years: 0,
    answers: Object.fromEntries(QUESTIONS.map(q => [q.id, '']))
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      setSuccess(true)
      setForm({
        name: '',
        email: '',
        phone: '',
        experience_years: 0,
        answers: Object.fromEntries(QUESTIONS.map(q => [q.id, '']))
      })

      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      setError('Erro ao enviar candidatura')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded border border-gray-200 p-8">
        {success && (
          <div className="mb-6 p-4 bg-gray-100 rounded text-sm text-black">
            ✓ Candidatura enviada com sucesso
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-gray-100 rounded text-sm text-black">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name & Email */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Nome</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black"
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          {/* Phone & Experience */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Telefone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({...form, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black"
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Anos de Experiência</label>
              <input
                type="number"
                min="0"
                max="50"
                value={form.experience_years}
                onChange={(e) => setForm({...form, experience_years: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black"
              />
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            {QUESTIONS.map((q) => (
              <div key={q.id}>
                <label className="block text-sm font-semibold text-black mb-2">
                  {q.label}
                </label>
                <textarea
                  value={form.answers[q.id]}
                  onChange={(e) => setForm({
                    ...form,
                    answers: {...form.answers, [q.id]: e.target.value}
                  })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black resize-none"
                  placeholder="Sua resposta aqui..."
                />
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 rounded text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Enviando...' : 'Enviar Candidatura'}
          </button>
        </form>
      </div>
    </div>
  )
}
