'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, Grid3x3, Play, Settings, Share2, Trash2, Plus } from 'lucide-react'

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
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      {/* Header */}
      <div className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex items-center px-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center">
            <Grid3x3 size={18} className="text-white" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Feed</h1>
        </div>
        <div className="ml-auto text-sm text-slate-500 dark:text-slate-400">
          {photos.length} foto{photos.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Canvas - Pan Area */}
      <div
        ref={canvasRef}
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsPanning(false)}
        onMouseLeave={() => setIsPanning(false)}
        style={{
          transform: `translate(${panX}px, ${panY}px)`,
          transition: isPanning ? 'none' : 'transform 150ms ease-out'
        }}
      >
        <div className="h-full flex items-center justify-center p-12">
          <div className="flex gap-12 w-full max-w-7xl">
            {/* LEFT: Upload Section */}
            <div className="flex-1 flex flex-col gap-8">
              {/* Upload Card */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative group rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-all duration-300 cursor-pointer aspect-video flex flex-col items-center justify-center gap-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-pink-100 dark:from-blue-900 dark:to-pink-900 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload size={28} className="text-blue-600 dark:text-blue-300" />
                  </div>
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-2">
                    Adicione suas fotos
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Arraste ou clique para fazer upload
                  </p>
                </div>

                {/* Type Selector */}
                <div data-no-pan className="flex gap-3">
                  <button className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                    Carrossel
                  </button>
                  <button className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                    Reels
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700 p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Fotos</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{photos.length}</p>
                </div>
                <div className="rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700 p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Publicado</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">0</p>
                </div>
              </div>
            </div>

            {/* RIGHT: Company Preview */}
            <div className="w-96 flex flex-col gap-6">
              {/* Company Card */}
              <div className="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 p-6 shadow-lg">
                {/* Header */}
                <div className="flex gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 via-pink-400 to-purple-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-50 mb-1">
                      Nome da Empresa
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      Descrição do que a empresa é como a biografia contendo até 150 caracteres
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div data-no-pan className="flex gap-2 mb-6">
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <Grid3x3 size={16} />
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <Play size={16} />
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <Settings size={16} />
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <Share2 size={16} />
                  </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-3 gap-2 h-48">
                  {photos.slice(0, 6).map((photo, idx) => (
                    <div
                      key={photo.id}
                      className="relative group rounded-lg overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800"
                    >
                      <img src={photo.src} alt="preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setPhotos(prev => prev.filter(p => p.id !== photo.id))}
                        className="absolute top-1 right-1 p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 6 - photos.length) }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center"
                    >
                      <Plus size={16} className="text-slate-400 dark:text-slate-500" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Info */}
              <div className="rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700 p-4">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Último upload</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">Agora há algumas horas</p>
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
