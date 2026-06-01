import type { Metadata } from 'next'
import './globals.css'
import { LayoutContent } from '@/components/LayoutContent'

export const metadata: Metadata = {
  title: 'Modos Operandi',
  description: 'Platform para gerenciar demandas e tarefas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <LayoutContent>{children}</LayoutContent>
      </body>
    </html>
  )
}
