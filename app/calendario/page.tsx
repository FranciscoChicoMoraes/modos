import { TopNav } from '@/components/calendario/TopNav'
import { HeroBusca } from '@/components/calendario/HeroBusca'
import { MesSecao } from '@/components/calendario/MesSecao'
import { MESES } from '@/lib/calendario/mock'

export default function CalendarioPage() {
  return (
    // -m-12 anula o padding do layout: a página ocupa a área toda,
    // com o próprio fundo lavanda e o scroll do main
    <div className="-m-12 min-h-screen bg-gradient-to-b from-[#EEEAF7] to-[#E8EEF9]">
      <TopNav />
      <HeroBusca />

      <main className="max-w-6xl mx-auto px-5 sm:px-8 pb-16 flex flex-col gap-6">
        {MESES.map(mes => (
          <MesSecao key={mes.id} mes={mes} />
        ))}
      </main>
    </div>
  )
}
