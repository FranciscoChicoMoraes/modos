import { useEffect } from 'react'
import { urlGoogleFonts } from '@/lib/marketing/moodboard'

// carrega as fontes das direções para a prévia sair na tipografia certa
export function useFontesGoogle(nomes: string[]) {
  const url = urlGoogleFonts(nomes)

  useEffect(() => {
    if (!url) return
    if (document.querySelector(`link[data-fontes="${url}"]`)) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = url
    link.dataset.fontes = url
    document.head.appendChild(link)
  }, [url])
}
