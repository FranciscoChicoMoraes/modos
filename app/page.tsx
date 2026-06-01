'use client'

import { ApplicationForm } from '@/components/ApplicationForm'

export default function Home() {
  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-semibold text-black">Candidatura</h1>
        <p className="text-sm text-gray-500 mt-2">Preencha o formulário para se candidatar</p>
      </div>

      <ApplicationForm />
    </div>
  )
}
