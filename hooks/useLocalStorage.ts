import { useState, useEffect } from 'react'

// avisa as outras telas quando o mesmo valor muda nesta aba
const EVENTO = 'local-storage'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const ler = () => {
      try {
        const item = window.localStorage.getItem(key)
        if (item) setStoredValue(JSON.parse(item))
      } catch (error) {
        console.error(`Error reading localStorage key "${key}":`, error)
      }
    }
    ler()
    setIsLoaded(true)

    // mantém componentes diferentes em sincronia com a mesma chave
    const aoMudar = (e: Event) => {
      if ((e as CustomEvent<{ key: string }>).detail?.key === key) ler()
    }
    window.addEventListener(EVENTO, aoMudar)
    return () => window.removeEventListener(EVENTO, aoMudar)
  }, [key])

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
      window.dispatchEvent(new CustomEvent(EVENTO, { detail: { key } }))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue, isLoaded] as const
}
