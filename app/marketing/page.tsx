'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, Zap, Trash2, Plus, Eye, BarChart3, Tag } from 'lucide-react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

interface Photo {
  id: string
  name: string
  data: string
  products: string[] // Produtos nesta foto
  analysis: {
    sharpness: number
    composition: number
    lighting: number
    overall: number
  }
  selected: boolean
}

interface Project {
  id: string
  name: string
  date: string
  photos: Photo[]
  products: string[] // Lista de todos os produtos
  selectedCount: number
}

export default function Marketing() {
  const [projects, setProjects] = useLocalStorage<Project[]>('marketingProjects', [])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [showNewProject, setShowNewProject] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null)
  const [newProduct, setNewProduct] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Análise simples de qualidade da foto
  const analyzePhoto = async (file: File): Promise<Photo['analysis']> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => {
        reject(new Error(`Erro ao ler arquivo: ${file.name}`))
      }
      reader.onload = (e) => {
        const img = new Image()
        img.onerror = () => {
          reject(new Error(`Formato não suportado ou corrompido: ${file.name}`))
        }
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            if (!ctx) throw new Error('Canvas context não disponível')

            ctx.drawImage(img, 0, 0)

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const data = imageData.data

            // Nitidez
            let edgeScore = 0
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i]
              const g = data[i + 1]
              const b = data[i + 2]
              const gray = (r + g + b) / 3
              edgeScore += Math.abs(gray - (data[i - 4] || 0))
            }
            const sharpness = Math.min(100, (edgeScore / data.length) * 10)

            // Iluminação
            let brightness = 0
            for (let i = 0; i < data.length; i += 4) {
              brightness += (data[i] + data[i + 1] + data[i + 2]) / 3
            }
            brightness = brightness / (data.length / 4)
            const lighting = Math.min(100, Math.abs(brightness - 128) * 1.5)

            // Composição
            const composition = Math.min(100, (Math.sqrt(canvas.width * canvas.height) / 1000) * 50 + 50)

            const overall = (sharpness * 0.5 + lighting * 0.3 + composition * 0.2)

            resolve({
              sharpness: Math.round(sharpness),
              lighting: Math.round(lighting),
              composition: Math.round(composition),
              overall: Math.round(overall)
            })
          } catch (error) {
            reject(error)
          }
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(e.type !== 'dragleave')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const convertHeicToBlob = async (file: File): Promise<File> => {
    const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')

    if (!isHeic) return file

    try {
      // Dinâmica import para evitar erro de SSR
      let heic2any
      try {
        heic2any = (await import('heic2any')).default
      } catch (importError) {
        console.error('Falha ao importar heic2any:', importError)
        throw new Error('Biblioteca de conversão não disponível')
      }

      // Converter HEIC para JPEG
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.85
      })

      // heic2any pode retornar um array ou um blob único
      const blobToUse = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob

      if (!blobToUse) {
        throw new Error('Conversão retornou blob vazio')
      }

      const fileName = file.name.replace(/\.(heic|heif)$/i, '.jpg')
      return new File([blobToUse as Blob], fileName, { type: 'image/jpeg' })
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error('Erro ao converter HEIC:', errorMsg)

      // Se não conseguir converter, tenta ao menos aceitar o arquivo como está
      // para que o usuário possa tentar salvar em outro formato
      throw new Error(`HEIC: ${errorMsg}. Por favor, converta a imagem para JPEG antes (Fotos > Exportar como > JPEG)`)
    }
  }

  const handleFiles = async (files: FileList) => {
    if (!currentProject) return

    setAnalyzing(true)
    const photoFiles = Array.from(files).filter(f => {
      const type = f.type
      const name = f.name.toLowerCase()
      return type.startsWith('image/') || name.endsWith('.heic') || name.endsWith('.heif')
    })

    for (let file of photoFiles) {
      try {
        file = await convertHeicToBlob(file)

        const reader = new FileReader()
        reader.onerror = () => {
          throw new Error(`Erro ao ler arquivo: ${file.name}`)
        }
        reader.onload = async (e) => {
          try {
            const analysis = await analyzePhoto(file)
            const newPhoto: Photo = {
              id: Date.now().toString() + Math.random(),
              name: file.name,
              data: e.target?.result as string,
              products: [],
              analysis,
              selected: false
            }

            setCurrentProject(prev => {
              if (!prev) return null
              const updated = {
                ...prev,
                photos: [...prev.photos, newPhoto]
              }
              const allProjects = projects.map(p => p.id === updated.id ? updated : p)
              setProjects(allProjects)
              return updated
            })
          } catch (error) {
            console.error(`Erro ao processar ${file.name}:`, error)
            alert(`Erro ao processar ${file.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
          }
        }
        reader.readAsDataURL(file)
      } catch (error) {
        console.error(`Erro ao converter ${file.name}:`, error)
        alert(`${error instanceof Error ? error.message : 'Erro ao processar arquivo'}`)
      }
    }

    setAnalyzing(false)
  }

  const createProject = () => {
    if (!projectName.trim()) return

    const newProject: Project = {
      id: Date.now().toString(),
      name: projectName,
      date: new Date().toLocaleDateString('pt-BR'),
      photos: [],
      products: [],
      selectedCount: 0
    }

    const updated = [...projects, newProject]
    setProjects(updated)
    setCurrentProject(newProject)
    setProjectName('')
    setShowNewProject(false)
  }

  const addProductToPhoto = (photoId: string, product: string) => {
    if (!currentProject) return

    const updated = {
      ...currentProject,
      photos: currentProject.photos.map(p =>
        p.id === photoId && !p.products.includes(product)
          ? { ...p, products: [...p.products, product] }
          : p
      ),
      products: currentProject.products.includes(product)
        ? currentProject.products
        : [...currentProject.products, product]
    }

    setCurrentProject(updated)
    setProjects(projects.map(p => p.id === updated.id ? updated : p))
  }

  const removeProductFromPhoto = (photoId: string, product: string) => {
    if (!currentProject) return

    const updated = {
      ...currentProject,
      photos: currentProject.photos.map(p =>
        p.id === photoId
          ? { ...p, products: p.products.filter(pr => pr !== product) }
          : p
      )
    }

    setCurrentProject(updated)
    setProjects(projects.map(p => p.id === updated.id ? updated : p))
  }

  // Seleção inteligente: garante que cada produto tenha representação
  const smartSelect = () => {
    if (!currentProject || currentProject.products.length === 0) {
      alert('Adicione produtos às fotos primeiro')
      return
    }

    const productsWithPhotos: Record<string, Photo[]> = {}

    // Agrupar fotos por produto
    currentProject.products.forEach(product => {
      productsWithPhotos[product] = currentProject.photos
        .filter(p => p.products.includes(product))
        .sort((a, b) => b.analysis.overall - a.analysis.overall)
    })

    // Garantir que cada produto tenha pelo menos 1 foto
    const selectedIds = new Set<string>()
    let productsCovered = 0

    Object.values(productsWithPhotos).forEach(photosForProduct => {
      if (photosForProduct.length > 0) {
        selectedIds.add(photosForProduct[0].id)
        productsCovered++
      }
    })

    // Se todos os produtos estão cobertos, adicionar mais fotos de alta qualidade
    if (productsCovered === currentProject.products.length) {
      currentProject.photos
        .sort((a, b) => b.analysis.overall - a.analysis.overall)
        .slice(0, 10)
        .forEach(photo => selectedIds.add(photo.id))
    }

    // Atualizar seleção
    const updated = {
      ...currentProject,
      photos: currentProject.photos.map(p => ({
        ...p,
        selected: selectedIds.has(p.id)
      })),
      selectedCount: selectedIds.size
    }

    setCurrentProject(updated)
    setProjects(projects.map(p => p.id === updated.id ? updated : p))
  }

  const togglePhotoSelection = (photoId: string) => {
    if (!currentProject) return

    const updated = {
      ...currentProject,
      photos: currentProject.photos.map(p =>
        p.id === photoId ? { ...p, selected: !p.selected } : p
      ),
      selectedCount: currentProject.photos.find(p => p.id === photoId)?.selected
        ? currentProject.selectedCount - 1
        : currentProject.selectedCount + 1
    }

    setCurrentProject(updated)
    setProjects(projects.map(p => p.id === updated.id ? updated : p))
  }

  const deleteProject = (id: string) => {
    const updated = projects.filter(p => p.id !== id)
    setProjects(updated)
    if (currentProject?.id === id) {
      setCurrentProject(null)
    }
  }

  const deletePhoto = (photoId: string) => {
    if (!currentProject) return

    const photo = currentProject.photos.find(p => p.id === photoId)
    const updated = {
      ...currentProject,
      photos: currentProject.photos.filter(p => p.id !== photoId),
      selectedCount: photo?.selected ? currentProject.selectedCount - 1 : currentProject.selectedCount
    }

    setCurrentProject(updated)
    setProjects(projects.map(p => p.id === updated.id ? updated : p))
  }

  if (!isMounted) return null

  if (currentProject) {
    // Produtos sem representação
    const productsWithoutPhoto = currentProject.products.filter(product =>
      !currentProject.photos.some(p => p.products.includes(product) && p.selected)
    )

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => setCurrentProject(null)}
              className="text-sm text-gray-600 hover:text-black mb-2 flex items-center gap-1"
            >
              ← Voltar
            </button>
            <h1 className="text-3xl font-semibold text-black">{currentProject.name}</h1>
            <p className="text-sm text-gray-700 mt-1">
              {currentProject.photos.length} fotos • {currentProject.selectedCount} selecionadas • {currentProject.products.length} produtos
            </p>
          </div>
        </div>

        {/* Alerta de Produtos sem Representação */}
        {productsWithoutPhoto.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm font-medium text-amber-900 mb-2">
              ⚠️ Produtos sem representação:
            </p>
            <div className="flex flex-wrap gap-2">
              {productsWithoutPhoto.map(product => (
                <span key={product} className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded">
                  {product}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Upload & Smart Select */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              dragActive ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Upload className="mx-auto mb-2 text-gray-600" size={24} />
            <p className="text-xs font-medium text-black">Adicionar fotos</p>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG, HEIC (convertidos automaticamente)</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.heic,.heif"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
            />
          </div>

          <button
            onClick={smartSelect}
            disabled={currentProject.products.length === 0 || currentProject.photos.length === 0}
            className="bg-black text-white rounded-lg p-4 font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Zap size={18} />
            Seleção Inteligente
          </button>
        </div>

        {/* Photos Grid */}
        {currentProject.photos.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-black">Fotos & Produtos</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {currentProject.photos.map((photo) => (
                <div
                  key={photo.id}
                  className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                    photo.selected
                      ? 'border-black ring-2 ring-black ring-offset-2'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <img
                    src={photo.data}
                    alt={photo.name}
                    className="w-full h-32 object-cover"
                  />

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2">
                    <button
                      onClick={() => togglePhotoSelection(photo.id)}
                      className="p-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title={photo.selected ? 'Desselecionar' : 'Selecionar'}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => deletePhoto(photo.id)}
                      className="p-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>

                  <div className="absolute top-2 right-2 bg-black text-white text-xs font-semibold px-2 py-1 rounded">
                    {photo.analysis.overall}
                  </div>

                  {/* Products Tags */}
                  {editingPhotoId === photo.id ? (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/90 p-2 space-y-2">
                      <div className="flex gap-1 flex-wrap">
                        {photo.products.map(product => (
                          <button
                            key={product}
                            onClick={() => removeProductFromPhoto(photo.id, product)}
                            className="bg-white text-black text-xs px-2 py-1 rounded hover:bg-red-100"
                          >
                            {product} ×
                          </button>
                        ))}
                      </div>
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            addProductToPhoto(photo.id, e.target.value)
                          }
                        }}
                        className="w-full text-xs px-2 py-1 rounded bg-white text-black"
                      >
                        <option value="">+ Adicionar produto</option>
                        {currentProject.products.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setEditingPhotoId(null)}
                        className="w-full text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded"
                      >
                        Feito
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingPhotoId(photo.id)}
                      className="absolute bottom-0 left-0 right-0 bg-black/70 hover:bg-black text-white text-xs py-1 flex items-center justify-center gap-1"
                    >
                      <Tag size={12} />
                      {photo.products.length > 0 ? photo.products.length : 'Marcar'} produtos
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis */}
        {currentProject.photos.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-black">Top 5 Fotos</h2>
            <div className="space-y-3">
              {currentProject.photos
                .sort((a, b) => b.analysis.overall - a.analysis.overall)
                .slice(0, 5)
                .map((photo) => (
                  <div key={photo.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-black truncate">{photo.name}</p>
                      <p className="text-sm font-semibold">{photo.analysis.overall}</p>
                    </div>
                    <div className="flex gap-2 text-xs text-gray-600">
                      {photo.products.length > 0 && (
                        <span className="bg-gray-100 px-2 py-0.5 rounded">
                          {photo.products.join(', ')}
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-black h-1 rounded-full"
                        style={{ width: `${photo.analysis.overall}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-black">Marketing</h1>
        <p className="text-sm text-gray-700 mt-2">Seleção inteligente: nenhum produto fica de fora</p>
      </div>

      {!showNewProject && (
        <button
          onClick={() => setShowNewProject(true)}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-black hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-sm font-medium text-gray-700 hover:text-black"
        >
          <Plus size={18} />
          Novo Projeto
        </button>
      )}

      {showNewProject && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-black">Novo Projeto</h2>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Ex: Dia dos Namorados, Novo Catálogo..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setShowNewProject(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={createProject}
              disabled={!projectName.trim()}
              className="flex-1 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Criar
            </button>
          </div>
        </div>
      )}

      {projects && projects.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
            Seus Projetos
          </h2>
          {projects?.map((project) => (
            <div
              key={project.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => setCurrentProject(project)}
            >
              <div className="space-y-1">
                <h3 className="font-semibold text-black group-hover:text-blue-600 transition-colors">
                  {project.name}
                </h3>
                <p className="text-xs text-gray-600">
                  {project.photos.length} fotos • {project.selectedCount} selecionadas • {project.products.length} produtos
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteProject(project.id)
                }}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
