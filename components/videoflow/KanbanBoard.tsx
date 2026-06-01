'use client'

import { ScriptCard } from './ScriptCard'

interface Script {
  id: string
  title: string
  tier: 'hard' | 'medium' | 'easy'
  script_body?: string
  column_id: 'roteiro' | 'gravando' | 'editando' | 'publicado'
  agent_status: 'idle' | 'running' | 'done' | 'error'
  videos_count?: number
}

interface KanbanBoardProps {
  scripts: Script[]
  onMove: (scriptId: string, toColumn: string) => void
  onView: (scriptId: string) => void
  onDelete: (scriptId: string) => void
}

const columns = [
  { id: 'roteiro', title: 'Roteiro', description: 'Aguardando gravação' },
  { id: 'gravando', title: 'Gravando', description: 'Em gravação' },
  { id: 'editando', title: 'Editando', description: 'Em edição' },
  { id: 'publicado', title: 'Publicado', description: 'Publicado' }
]

export function KanbanBoard({ scripts, onMove, onView, onDelete }: KanbanBoardProps) {
  const getNextColumn = (currentColumn: string): string => {
    const columnIds = columns.map(c => c.id)
    const currentIndex = columnIds.indexOf(currentColumn)
    return currentIndex < columnIds.length - 1 ? columnIds[currentIndex + 1] : currentColumn
  }

  const getPrevColumn = (currentColumn: string): string => {
    const columnIds = columns.map(c => c.id)
    const currentIndex = columnIds.indexOf(currentColumn)
    return currentIndex > 0 ? columnIds[currentIndex - 1] : currentColumn
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-8">
      {columns.map((column) => {
        const columnScripts = scripts.filter(s => s.column_id === column.id)

        return (
          <div key={column.id} className="flex flex-col">
            {/* Column Header */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-black">{column.title}</h2>
              <p className="text-xs text-gray-600">{columnScripts.length} cards</p>
            </div>

            {/* Column Body */}
            <div className="flex-1 space-y-3 bg-gray-50 rounded-lg p-4 min-h-96">
              {columnScripts.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  Vazio
                </div>
              ) : (
                columnScripts.map((script) => (
                  <ScriptCard
                    key={script.id}
                    script={script}
                    onView={() => onView(script.id)}
                    onDelete={() => onDelete(script.id)}
                    onMove={(direction) => {
                      if (direction === 'right') {
                        onMove(script.id, getNextColumn(script.column_id))
                      } else {
                        onMove(script.id, getPrevColumn(script.column_id))
                      }
                    }}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
