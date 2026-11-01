import { CalendarDays, Search } from 'lucide-react'

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 bg-white/60 backdrop-blur-md border-b border-white/60">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center gap-4 sm:gap-6">
        {/* Logo */}
        <a href="/calendario" className="flex items-center gap-2 shrink-0">
          <span className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-sm">
            <CalendarDays size={16} />
          </span>
          <span className="text-sm font-bold text-gray-900 hidden sm:inline">
            Central de Conteúdos
          </span>
        </a>

        {/* Abas */}
        <nav className="flex items-center gap-1 text-xs">
          <a href="/calendario" className="px-3 py-1.5 font-semibold text-gray-900 bg-white/80 rounded-full shadow-sm">
            Início
          </a>
          <a href="/configuracoes" className="px-3 py-1.5 text-gray-500 hover:text-gray-900 transition-colors">
            Suporte
          </a>
        </nav>

        <div className="flex-1" />

        {/* Ações */}
        <button
          aria-label="Buscar"
          className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white/80 rounded-full transition-colors"
        >
          <Search size={16} />
        </button>
        <button className="px-4 py-1.5 text-xs font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-sm transition-colors">
          Entrar
        </button>
      </div>
    </header>
  )
}
