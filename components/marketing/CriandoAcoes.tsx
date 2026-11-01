'use client'

import { useEffect, useState } from 'react'

// Tela de espera enquanto a IA monta as direções e as referências chegam.
// Os quadros piscam em sequência, como um feed sendo montado.
export function CriandoAcoes({ titulo, passos }: {
  titulo: string
  passos: string[]
}) {
  const [passo, setPasso] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setPasso(p => (p + 1 < passos.length ? p + 1 : p))
    }, 2600)
    return () => clearInterval(id)
  }, [passos.length])

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="grid grid-cols-3 gap-2 mb-8">
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className="w-12 h-12 rounded-lg bg-gray-200 animate-pulse"
            style={{ animationDelay: `${(i % 3) * 120 + Math.floor(i / 3) * 90}ms` }}
          />
        ))}
      </div>

      <p className="text-sm font-semibold text-black">{titulo}</p>

      <p key={passo} className="text-xs text-gray-400 mt-2 animate-pulse">
        {passos[passo]}
      </p>
    </div>
  )
}
