'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BarChart3, FileText, Users, Settings, Menu, X, Moon, Sun, Image, BookOpen, Film } from 'lucide-react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

interface SidebarProps {
  darkMode: boolean
  setDarkMode: (value: boolean) => void
}

const menuItems = [
  { href: '/dashboard', icon: BarChart3, label: 'Dashboard' },
  { href: '/processo-seletivo', icon: FileText, label: 'Processo Seletivo' },
  { href: '/vagas', icon: Users, label: 'Vagas' },
  { href: '/demandas', icon: FileText, label: 'Demandas' },
  { href: '/marketing', icon: Image, label: 'Marketing' },
  { href: '/videoflow', icon: Film, label: 'VideoFlow' },
  { href: '/conteudos', icon: BookOpen, label: 'Conteúdos' },
  { href: '/configuracoes', icon: Settings, label: 'Configurações' },
]

export function Sidebar({ darkMode, setDarkMode }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useLocalStorage('sidebarOpen', true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  return (
    <aside className={`${
      sidebarOpen ? 'w-64' : 'w-16'
    } ${darkMode ? 'bg-gray-800' : 'bg-black'} text-white transition-all duration-300 flex flex-col border-r ${darkMode ? 'border-gray-700' : 'border-gray-900'}`}>
      
      {/* Logo / Menu Button */}
      <div className="p-4 flex items-center justify-between h-16">
        {sidebarOpen ? (
          <>
            <h1 className="text-lg font-semibold truncate">Recruta</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="hover:bg-gray-700 p-1 rounded transition-colors flex-shrink-0"
            >
              <X size={18} />
            </button>
          </>
        ) : (
          <button
            onClick={() => setSidebarOpen(true)}
            className="hover:bg-gray-700 p-2 rounded transition-colors w-full flex items-center justify-center"
          >
            <Menu size={20} />
          </button>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="space-y-2 flex-1 px-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded hover:bg-gray-700 transition-colors text-sm group relative ${
                sidebarOpen ? '' : 'justify-center'
              }`}
              title={!sidebarOpen ? item.label : ''}
            >
              <Icon size={20} className="flex-shrink-0" />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
              
              {!sidebarOpen && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-700 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {item.label}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Theme Toggle */}
      <div className={`p-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-700'}`}>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`w-full flex items-center gap-2 px-3 py-3 rounded hover:bg-gray-700 transition-colors text-sm group relative ${
            sidebarOpen ? '' : 'justify-center'
          }`}
          title={!sidebarOpen ? (darkMode ? 'Claro' : 'Escuro') : ''}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          {sidebarOpen && <span className="text-xs">{darkMode ? 'Claro' : 'Escuro'}</span>}
          
          {!sidebarOpen && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-700 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {darkMode ? 'Claro' : 'Escuro'}
            </div>
          )}
        </button>
      </div>
    </aside>
  )
}
