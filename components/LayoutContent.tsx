'use client'

import { useState, useEffect } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { Sidebar } from './Sidebar'

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode, isDarkModeLoaded] = useLocalStorage('darkMode', false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted || !isDarkModeLoaded) {
    return <>{children}</>
  }

  return (
    <div className={`flex h-screen ${darkMode ? 'dark' : ''}`}>
      <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} />

      <main className={`flex-1 overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="p-12">
          {children}
        </div>
      </main>
    </div>
  )
}
