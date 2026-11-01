import { ArrowRight, Clock3 } from 'lucide-react'
import type { DiaConteudo } from '@/lib/calendario/types'

const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// "2026-08-17" vira "17 Ago" sem depender de fuso horário
const formatarData = (iso: string) => {
  const [, mes, dia] = iso.split('-')
  return `${dia} ${MESES_CURTOS[parseInt(mes, 10) - 1]}`
}

export function DiaCard({ dia }: { dia: DiaConteudo }) {
  return (
    <a
      href={dia.href}
      className="group relative block w-[180px] sm:w-[210px] lg:w-[230px] shrink-0 aspect-[2/3] rounded-2xl overflow-hidden bg-gradient-to-br from-[#D8D0EE] to-[#C4CFEA] shadow-sm hover:shadow-xl hover:scale-[1.03] hover:-translate-y-1 transition-all duration-200 cursor-pointer"
    >
      {/* Ilustração: se o placeholder não carregar, o gradiente lavanda de fundo aparece */}
      <img
        src={dia.imagem}
        alt=""
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Gradiente escuro na base para o texto */}
      <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Data no topo */}
      <span className="absolute top-3 left-3 px-2 py-0.5 text-[10px] font-medium bg-white/85 text-gray-800 rounded-full backdrop-blur-sm">
        {formatarData(dia.data)}
      </span>

      {/* Texto sobreposto na base */}
      <div className="absolute inset-x-0 bottom-0 p-3.5 flex flex-col gap-1.5">
        <h4 className="text-sm font-bold text-white leading-snug">{dia.titulo}</h4>
        {dia.descricao && (
          <p className="text-[11px] text-white/75 leading-snug line-clamp-2">{dia.descricao}</p>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          {dia.badges?.map(badge => (
            <span
              key={badge}
              className="px-2 py-0.5 text-[10px] font-medium bg-white/85 text-gray-800 rounded-full"
            >
              {badge}
            </span>
          ))}
          {dia.duracao && (
            <span className="flex items-center gap-1 text-[10px] text-white/80">
              <Clock3 size={10} />
              {dia.duracao}
            </span>
          )}
        </div>
      </div>

      {/* Botão que aparece no hover */}
      <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-500 text-white rounded-full shadow-lg translate-y-1 group-hover:translate-y-0 transition-transform">
          Acessar
          <ArrowRight size={13} />
        </span>
      </span>
    </a>
  )
}
