'use client'

import { KanbanBoard } from '@/components/KanbanBoard'

export default function ProcessoSeletivo() {
  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-semibold text-black">Processo Seletivo</h1>
        <p className="text-sm text-gray-500 mt-2">Funil de recrutamento</p>
      </div>
      
      <KanbanBoard />
    </div>
  )
}
