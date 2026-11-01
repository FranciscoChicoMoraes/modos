'use client'

import { useEffect, useRef, useState } from 'react'
import { Building2 } from 'lucide-react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { OnboardingTrilha, type CadastroMarketing } from '@/components/marketing/OnboardingTrilha'
import { MarketingWorkspace } from '@/components/marketing/MarketingWorkspace'
import { EMPRESA_DEMO } from '@/lib/marketing/empresaDemo'

export default function Marketing() {
  // temporário: a loja fictícia já entra cadastrada, para testar os recursos
  // sem refazer a trilha a cada recarregamento. Para voltar ao cadastro em
  // branco, troque EMPRESA_DEMO por null e o false por true abaixo.
  const [cadastro, setCadastro] = useState<CadastroMarketing | null>(EMPRESA_DEMO)
  const [trilhaAberta, setTrilhaAberta] = useState(false)

  // durante o cadastro a barra lateral fica recolhida, para dar espaço
  const [sidebarOpen, setSidebarOpen, sidebarCarregado] = useLocalStorage('sidebarOpen', true)
  const preferenciaRef = useRef<boolean | null>(null)

  useEffect(() => {
    if (!sidebarCarregado) return
    if (trilhaAberta) {
      // guarda a preferência do usuário só na primeira vez que recolhe
      if (preferenciaRef.current === null) {
        preferenciaRef.current = sidebarOpen
        if (sidebarOpen) setSidebarOpen(false)
      }
    } else if (preferenciaRef.current !== null) {
      if (preferenciaRef.current) setSidebarOpen(true)
      preferenciaRef.current = null
    }
  }, [trilhaAberta, sidebarCarregado, sidebarOpen, setSidebarOpen])

  const concluir = (dados: CadastroMarketing) => {
    setCadastro(dados)
    setTrilhaAberta(false)
  }

  return (
    // fundo próprio para o texto acompanhar o tema, como na página do Feed:
    // as variantes dark seguem o sistema, e o fundo do layout segue o app
    <div className="-m-12 min-h-screen bg-white dark:bg-zinc-950">
      {cadastro ? (
        <MarketingWorkspace cadastro={cadastro} />
      ) : (
        <div className="min-h-screen flex flex-col items-center justify-center text-center">
          {!trilhaAberta && (
            <button
              onClick={() => setTrilhaAberta(true)}
              className="flex items-center gap-2 mb-6 px-4 py-2 text-xs font-medium bg-black hover:bg-gray-800 text-white rounded-lg transition-colors"
            >
              <Building2 size={14} />
              Continuar cadastro
            </button>
          )}
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-2">Marketing</h1>
          <p className="text-sm text-gray-400 dark:text-zinc-600">
            Preencha o cadastro para abrir as campanhas.
          </p>
        </div>
      )}

      {/* fica sempre montada: fechar não apaga o que já foi preenchido */}
      <OnboardingTrilha
        aberta={trilhaAberta && !cadastro}
        aoFechar={() => setTrilhaAberta(false)}
        aoConcluir={concluir}
      />
    </div>
  )
}
