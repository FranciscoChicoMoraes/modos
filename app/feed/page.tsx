'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, Trash2, Download } from 'lucide-react'
import JSZip from 'jszip'

interface Photo {
  id: string
  src: string
  carouselGroup?: number
  originalFile?: File
}

export default function FeedPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [ctrlPressed, setCtrlPressed] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [editingCarouselId, setEditingCarouselId] = useState<string | null>(null)
  const [draggedCarouselId, setDraggedCarouselId] = useState<string | null>(null)

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
    selectedPhotos.delete(id)
  }

  const handleClear = () => {
    setPhotos([])
    setSelectedPhotos(new Set())
  }

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return
    const draggedIdx = photos.findIndex(p => p.id === draggedId)
    const targetIdx = photos.findIndex(p => p.id === targetId)
    if (draggedIdx === -1 || targetIdx === -1) return
    const newPhotos = [...photos]
    ;[newPhotos[draggedIdx], newPhotos[targetIdx]] = [newPhotos[targetIdx], newPhotos[draggedIdx]]
    setPhotos(newPhotos)
    setDraggedId(null)
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedPhotos)
    if (newSelected.has(id)) newSelected.delete(id)
    else newSelected.add(id)
    setSelectedPhotos(newSelected)
  }

  const createCarousel = () => {
    if (selectedPhotos.size < 2) return
    const maxGroup = Math.max(...photos.filter(p => p.carouselGroup).map(p => p.carouselGroup || 0), 0)
    const newGroup = maxGroup + 1
    setPhotos(prev => prev.map(p => selectedPhotos.has(p.id) ? { ...p, carouselGroup: newGroup } : p))
    setSelectedPhotos(new Set())
  }

  const handleDownloadZip = async () => {
    setDownloading(true)
    try {
      const zip = new JSZip()
      const groups: { [k: number]: Photo[] } = {}
      let postNum = 1
      photos.forEach(photo => {
        if (photo.carouselGroup) {
          groups[photo.carouselGroup] = groups[photo.carouselGroup] || []
          groups[photo.carouselGroup].push(photo)
        } else {
          groups[postNum] = [photo]
          postNum++
        }
      })
      let idx = 1
      Object.values(groups).forEach(group => {
        group.forEach((p, i) => {
          const name = i === 0 ? `${idx}.jpg` : `${idx}-${i}.jpg`
          if (filesRef.current.has(p.id)) {
            zip.file(name, filesRef.current.get(p.id)!)
          }
        })
        idx++
      })
      const blob = await zip.generateAsync({ type: 'blob' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `fotos_${Date.now()}.zip`
      a.click()
      URL.revokeObjectURL(a.href)
    } finally {
      setDownloading(false)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) setCtrlPressed(true)
    }
    const handleKeyUp = () => setCtrlPressed(false)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

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
    <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: '#666666' }}>
      <div className="px-4 py-3 flex items-center justify-between relative z-30" style={{ backgroundColor: '#666666', borderBottom: '1px solid rgba(0,0,0,0.2)' }}>
        <h1 className="text-white font-light">Feed • {photos.length}</h1>
        <div className="flex gap-2">
          <button onClick={() => fileInputRef.current?.click()} className="px-2 py-1 bg-gray-900 hover:bg-gray-800 text-white text-xs rounded flex items-center gap-1">
            <Upload size={12} /> Upload
          </button>
          {photos.length > 0 && (
            <>
              <button onClick={handleDownloadZip} disabled={downloading} className={`px-2 py-1 bg-gray-900 hover:bg-gray-800 text-white text-xs rounded flex items-center gap-1 ${downloading ? 'opacity-50' : ''}`}>
                <Download size={12} /> Download
              </button>
              {selectedPhotos.size >= 2 && (
                <button onClick={createCarousel} className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded">
                  🎠 Carrossel ({selectedPhotos.size})
                </button>
              )}
              <button onClick={handleClear} className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded">
                Limpar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto" style={{ backgroundColor: '#555555' }}>
        <div className="p-4">
          {photos.length === 0 ? (
            <div className="text-center text-gray-400 text-sm pt-8">
              Nenhuma foto adicionada
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 w-max">
              {photos.map((photo) => {
                const group = photos.filter(p => p.carouselGroup === photo.carouselGroup)
                if (photo.carouselGroup && group[0].id !== photo.id) return null

                return (
                  <div
                    key={photo.id}
                    onClick={() => ctrlPressed && toggleSelect(photo.id)}
                    onDragStart={() => setDraggedId(photo.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(photo.id)}
                    draggable
                    className={`relative aspect-[4/5] overflow-hidden cursor-move border-2 transition-all select-none rounded ${
                      selectedPhotos.has(photo.id) ? 'border-green-400 bg-green-900/30' :
                      draggedId === photo.id ? 'opacity-40 scale-90 border-yellow-400' :
                      'border-gray-600 hover:border-blue-400'
                    } bg-gray-700`}
                  >
                    {photo.carouselGroup && <div className="absolute top-1 right-1 bg-white/90 text-gray-900 w-5 h-5 rounded flex items-center justify-center text-xs z-10">⊞</div>}
                    <img src={photo.src} alt="feed" className="w-full h-full object-cover" draggable={false} />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(photo.id) }} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {editingCarouselId && (() => {
        const carousel = photos.filter(p => p.carouselGroup === photos.find(x => x.id === editingCarouselId)?.carouselGroup)
        return (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full">
              <div className="flex flex-wrap gap-3 mb-6 pb-4 border-b border-gray-700">
                {carousel.map((p, i) => (
                  <div key={p.id} className="relative group" onDragStart={() => setDraggedCarouselId(p.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => {
                    if (draggedCarouselId && draggedCarouselId !== p.id) {
                      const idx1 = photos.indexOf(p)
                      const idx2 = photos.findIndex(x => x.id === draggedCarouselId)
                      const newPhotos = [...photos]
                      ;[newPhotos[idx1], newPhotos[idx2]] = [newPhotos[idx2], newPhotos[idx1]]
                      setPhotos(newPhotos)
                    }
                    setDraggedCarouselId(null)
                  }} draggable>
                    <img src={p.src} alt="" className={`w-28 h-36 object-cover rounded border-2 ${draggedCarouselId === p.id ? 'border-yellow-400 opacity-50' : 'border-gray-600'}`} />
                    <div className="absolute top-1 left-1 bg-black text-white w-5 h-5 rounded flex items-center justify-center text-xs font-bold">{i + 1}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-3">
                <button onClick={() => setEditingCarouselId(null)} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )
      })()}

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
