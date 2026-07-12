'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, Grid3x3, Play, RotateCcw, User, Trash2 } from 'lucide-react'

interface Photo {
  id: string
  src: string
  carouselGroup?: number
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
    try {
      const newPhotos: Photo[] = []
      for (const file of Array.from(files)) {
        try {
          const src = await compress(file)
          const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
          filesRef.current.set(id, file)
          newPhotos.push({ id, src })
        } catch (e) {
          console.error('Erro ao processar arquivo:', file.name, e)
        }
      }
      if (newPhotos.length > 0) {
        setPhotos(prev => [...prev, ...newPhotos])
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (e) {
      console.error('Erro ao adicionar fotos:', e)
    }
  }

  const handleDelete = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const tagName = target.tagName.toLowerCase()
    const isInteractive = tagName === 'button' || tagName === 'input' || tagName === 'a'
    
    if (isInteractive) return
    
    setIsPanning(true)
    setPanStart({ x: e.clientX - panX, y: e.clientY - panY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return
    setPanX(e.clientX - panStart.x)
    setPanY(e.clientY - panStart.y)
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  useEffect(() => {
    const input = fileInputRef.current
    if (!input) return

    const handleChange = (e: Event) => {
      const target = e.target as HTMLInputElement
      handleAddPhotos(target.files)
    }

    input.addEventListener('change', handleChange)
    return () => input.removeEventListener('change', handleChange)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="h-16 bg-gray-100 border-b border-gray-200 flex items-center px-6">
        <div className="w-full h-12 bg-gray-300 rounded-full" />
      </div>

      {/* Main Content - Pan enabled */}
      <div
        ref={canvasRef}
        className="flex-1 overflow-hidden bg-gray-50 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          transform: `translate(${panX}px, ${panY}px)`,
          transition: isPanning ? 'none' : 'transform 0.1s ease-out'
        }}
      >
        <div className="h-full flex items-center justify-center p-8">
          <div className="flex gap-8 w-full max-w-6xl">
            {/* Left: Upload Card */}
            <div className="flex-1 flex flex-col gap-4">
              {/* Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-4 border-blue-500 rounded-xl p-12 bg-gray-200 cursor-pointer hover:bg-gray-300 transition flex flex-col items-center justify-center gap-6 min-h-96"
              >
                <Upload size={48} className="text-gray-600" />
                <div className="flex flex-col gap-2 text-center">
                  <button className="px-6 py-2 bg-gray-400 text-gray-700 rounded hover:bg-gray-500">
                    Carrossel
                  </button>
                  <button className="px-6 py-2 bg-gray-400 text-gray-700 rounded hover:bg-gray-500">
                    Reels
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Company Info & Photos Grid */}
            <div className="w-80 flex flex-col gap-6 bg-white rounded-2xl p-6 shadow-lg">
              {/* Company Header */}
              <div className="flex gap-4 items-start">
                <div className="w-16 h-16 rounded-full border-4 border-blue-400 flex-shrink-0 bg-gradient-to-br from-purple-400 via-pink-400 to-yellow-400" />
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-900">Nome da Empresa</h2>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    Descrição do que a empresa é como a biografia contendo até 150 caracteres
                  </p>
                </div>
              </div>

              {/* Action Icons */}
              <div className="flex gap-3 justify-between">
                <button className="p-3 hover:bg-gray-100 rounded-lg transition">
                  <Grid3x3 size={20} className="text-gray-700" />
                </button>
                <button className="p-3 hover:bg-gray-100 rounded-lg transition">
                  <Play size={20} className="text-gray-700" />
                </button>
                <button className="p-3 hover:bg-gray-100 rounded-lg transition">
                  <RotateCcw size={20} className="text-gray-700" />
                </button>
                <button className="p-3 hover:bg-gray-100 rounded-lg transition">
                  <User size={20} className="text-gray-700" />
                </button>
              </div>

              {/* Photos Grid 2x3 */}
              <div className="grid grid-cols-2 gap-3 flex-1">
                {photos.slice(0, 6).map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-200 group"
                  >
                    <img src={photo.src} alt="feed" className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {/* Empty slots */}
                {Array.from({ length: Math.max(0, 6 - photos.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square rounded-lg bg-gray-200" />
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
