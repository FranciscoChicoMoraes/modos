'use client'

import type { CorPaleta } from '@/lib/marketing/moodboard'

// Quadro montado com a paleta da direção. Entra onde o banco de imagens
// não tem referência, para a galeria não ficar furada. É declaradamente
// arte de cor, não foto: some sozinho quando o banco devolver imagem.
export function QuadroPaleta({ paleta, texto, indice = 0, fonte }: {
  paleta: CorPaleta[]
  texto: string
  indice?: number
  fonte?: string
}) {
  const cores = paleta.length > 0
    ? paleta.map(c => c.hex)
    : ['#e5e5e5', '#d4d4d4', '#a3a3a3']

  const a = cores[indice % cores.length]
  const b = cores[(indice + 1) % cores.length]
  const c = cores[(indice + 2) % cores.length]
  const angulo = 35 + (indice % 4) * 35

  // alterna entre três composições, para a grade não ficar repetitiva
  const fundo = indice % 3 === 0
    ? `linear-gradient(${angulo}deg, ${a} 0%, ${b} 55%, ${c} 100%)`
    : indice % 3 === 1
      ? `radial-gradient(circle at 30% 25%, ${b} 0%, ${a} 65%)`
      : `linear-gradient(${angulo}deg, ${a} 0% 45%, ${c} 45% 100%)`

  return (
    <div
      className="relative w-full h-full flex items-end p-3 overflow-hidden"
      style={{ background: fundo }}
    >
      {/* textura discreta por cima da cor */}
      <span
        className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, #fff 0 2px, transparent 2px 6px)'
        }}
      />
      <span
        className="relative text-[10px] leading-tight text-white/90 drop-shadow"
        style={fonte ? { fontFamily: `'${fonte}', serif` } : undefined}
      >
        {texto}
      </span>
    </div>
  )
}
