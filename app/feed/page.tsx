'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, Settings, Share2, Trash2 } from 'lucide-react'

interface Photo {
  id: string
  src: string
  originalFile?: File
}

export default function FeedPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const filesRef = useRef<Map<string, File>>(new Map())

  const compress = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          let w = img.width, h = img.height
          const max = 500
          if (w > max || h > max) {
            if (w > h) {
              h = Math.round((h * max) / w)
              w = max
            } else {
              w = Math.round((w * max) / h)
              h = max
            }
          }
          const canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          canvas.getContext('2d')?.drawImage(img, 0, 0, w, h)
          resolve(canvas.toDataURL('image/jpeg', 0.72))
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  const handleAddPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const newPhotos: Photo[] = []
    for (const file of Array.from(files)) {
      try {
        const src = await compress(file)
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
        filesRef.current.set(id, file)
        newPhotos.push({ id, src })
      } catch (e) {
        console.error('Erro ao processar:', file.name)
      }
    }
    if (newPhotos.length > 0) setPhotos(prev => [...prev, ...newPhotos])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const tagName = target.tagName.toLowerCase()
    const isInteractive = ['button', 'input', 'a'].includes(tagName)
    if (isInteractive || target.closest('[data-no-pan]')) return
    
    setIsPanning(true)
    setPanStart({ x: e.clientX - panX, y: e.clientY - panY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return
    setPanX(e.clientX - panStart.x)
    setPanY(e.clientY - panStart.y)
  }

  useEffect(() => {
    const input = fileInputRef.current
    if (!input) return
    const handleChange = (e: Event) => handleAddPhotos((e.target as HTMLInputElement).files)
    input.addEventListener('change', handleChange)
    return () => input.removeEventListener('change', handleChange)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-zinc-950">
      {/* Header */}
      <div className="h-14 border-b border-gray-200 dark:border-zinc-800 flex items-center px-8 justify-between">
        <h1 className="text-sm font-medium text-gray-900 dark:text-gray-50">Feed</h1>
        <span className="text-xs text-gray-500 dark:text-gray-400">{photos.length} fotos</span>
      </div>

      {/* Canvas - Pan Area */}
      <div
        ref={canvasRef}
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing bg-gray-50 dark:bg-zinc-900"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsPanning(false)}
        onMouseLeave={() => setIsPanning(false)}
        style={{
          transform: `translate(${panX}px, ${panY}px)`,
          transition: isPanning ? 'none' : 'transform 100ms ease-out'
        }}
      >
        <div className="h-full flex items-center justify-center p-16">
          <div className="flex gap-16 w-full max-w-6xl">
            {/* LEFT: Upload Section */}
            <div className="flex-1 flex flex-col gap-12">
              {/* Upload Card */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-gray-300 dark:border-zinc-700 rounded-lg p-16 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer flex flex-col items-center justify-center gap-8"
              >
                <div className="text-center">
                  <Upload size={32} className="text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-medium mb-1">
                    Adicionar fotos
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Clique ou arraste para upload
                  </p>
                </div>

                {/* Type Buttons */}
                <div data-no-pan className="flex gap-2">
                  <button className="px-3 py-1.5 text-xs border border-gray-300 dark:border-zinc-600 rounded text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-zinc-900 transition-colors">
                    Carrossel
                  </button>
                  <button className="px-3 py-1.5 text-xs border border-gray-300 dark:border-zinc-600 rounded text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-zinc-900 transition-colors">
                    Reels
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Fotos</p>
                  <p className="text-2xl font-light text-gray-900 dark:text-gray-50">{photos.length}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Publicado</p>
                  <p className="text-2xl font-light text-gray-900 dark:text-gray-50">0</p>
                </div>
              </div>
            </div>

            {/* RIGHT: Company Preview */}
            <div className="w-80 flex flex-col gap-8">
              {/* Company Info */}
              <div className="border-b border-gray-200 dark:border-zinc-800 pb-8">
                <div className="flex gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-zinc-700 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">
                      Nome da Empresa
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      Descrição do que a empresa é como a biografia contendo até 150 caracteres
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div data-no-pan className="flex gap-2">
                <button className="flex-1 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors">
                  <Settings size={16} />
                </button>
                <button className="flex-1 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors">
                  <Share2 size={16} />
                </button>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-3 gap-3">
                {photos.slice(0, 6).map((photo) => (
                  <div
                    key={photo.id}
                    className="relative group aspect-square rounded bg-gray-200 dark:bg-zinc-800 overflow-hidden"
                  >
                    <img src={photo.src} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setPhotos(prev => prev.filter(p => p.id !== photo.id))}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 6 - photos.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square rounded bg-gray-200 dark:bg-zinc-800 border border-dashed border-gray-300 dark:border-zinc-700" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
      />
    </div>
  )
}
