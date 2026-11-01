import { TopNav } from '@/components/calendario/TopNav'
import { CabecalhoDia } from '@/components/dia/CabecalhoDia'
import { SecaoCanal } from '@/components/dia/SecaoCanal'
import { getDiaDetalhe } from '@/lib/dia/mock'

export default async function DiaPage({ params }: {
  params: Promise<{ dia: string }>
}) {
  const { dia } = await params
  const detalhe = getDiaDetalhe(dia)

  return (
    // mesmo fundo lavanda da página Calendário, anulando o padding do layout
    <div className="-m-12 min-h-screen bg-gradient-to-b from-[#EEEAF7] to-[#E8EEF9]">
      <TopNav />
      <CabecalhoDia dia={detalhe} />

      <main className="max-w-6xl mx-auto px-5 sm:px-8 pb-16 flex flex-col gap-6">
        {detalhe.secoes.map(secao => (
          <SecaoCanal key={secao.canal} secao={secao} />
        ))}
      </main>
    </div>
  )
}
