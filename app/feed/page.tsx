'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Settings, Share2, Trash2, Plus, Minus, Maximize2,
  Play, Images, Check, Camera, Pencil, X, Download, Loader2, ImageDown,
  ChevronLeft, ChevronRight, ChevronDown, Sparkles, Upload, RefreshCw,
  LayoutGrid, ImagePlus, Building2, CalendarClock
} from 'lucide-react'
import { converterSePreciso, ehImagemAceita, EXTENSOES_EXTRAS } from '@/lib/imagens'

type PostType = 'single' | 'carousel' | 'reels'

interface PostImg {
  id: string     // identifica a imagem no banco
  src: string    // preview para exibição (dataURL local ou URL pública)
  url?: string   // arquivo no Storage, quando já persistido
  file?: File    // original em memória, quando recém-enviado
}

type StatusPost = 'rascunho' | 'agendado' | 'publicado'

interface Post {
  id: string
  type: PostType
  imgs: PostImg[]
  legenda?: string
  agendadoEm?: string | null   // ISO com data e hora
  status?: StatusPost
}

interface EmpresaResumo {
  id: string
  nome: string
  avatar?: string
}

interface Profile {
  name: string
  bio: string
  avatar: string
}

interface OrgProposal {
  carrosseis: { ids: string[]; produto: string }[]
  ordem: string[]
  resumo: string
}

interface AgentResult {
  imgs: PostImg[]        // fotos escolhidas pelo agente
  categorias: string[]   // produtos identificados nas imagens
}

const CATEGORIAS_KEY = 'feed:categorias'

const DEFAULT_PROFILE: Profile = {
  name: 'Nome da Empresa',
  bio: 'Descrição do que a empresa é como a biografia contendo até 150 caracteres',
  avatar: ''
}

const PROFILE_KEY = 'feed:profile'
const EMPRESA_KEY = 'feed:empresa'

const STATUS_ROTULO: Record<StatusPost, string> = {
  rascunho: 'Rascunho',
  agendado: 'Agendado',
  publicado: 'Publicado'
}

// "2026-08-30T14:30" (input datetime-local) <-> ISO guardado no banco
const paraCampoDataHora = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

// nome dos arquivos exportados: Feed + empresa + data + Modos Operandi
const nomeExport = (empresa: string | undefined, extensao: string) => {
  const hoje = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  const data = `${p(hoje.getDate())}-${p(hoje.getMonth() + 1)}-${hoje.getFullYear()}`
  // tira o que o sistema de arquivos não aceita e espaços repetidos
  const nomeLimpo = (empresa ?? '').replace(/[\\/:*?"<>|]/g, '').trim()
  return ['Feed', nomeLimpo, data, 'Modos Operandi']
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ') + extensao
}

const formatarDataHora = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getDate()} ${meses[d.getMonth()]} ${p(d.getHours())}:${p(d.getMinutes())}`
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 9)

const compress = (file: File, max = 500): Promise<string> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      let w = img.width, h = img.height
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
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.72))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Falha ao carregar ${file.name}`))
    }
    img.src = url
  })

// HEIC e DNG são convertidos para JPEG antes de tudo; o arquivo guardado
// já é o convertido, então a exportação também sai utilizável
const toPostImg = async (original: File): Promise<PostImg> => {
  const file = await converterSePreciso(original)
  return { id: uid(), src: await compress(file), file }
}

// sobe a imagem para o Storage e devolve a URL pública
const subirImagem = async (img: PostImg): Promise<string | null> => {
  if (!img.file) return img.url ?? null
  const form = new FormData()
  form.append('file', img.file)
  form.append('id', img.id)
  const res = await fetch('/api/feed/imagens', { method: 'POST', body: form })
  if (!res.ok) return null
  const { url } = await res.json()
  return url as string
}

// devolve os bytes originais: da memória, ou baixando do Storage
const obterArquivo = async (img: PostImg): Promise<Blob> => {
  if (img.file) return img.file
  if (!img.url) throw new Error('Imagem sem arquivo')
  const res = await fetch(img.url)
  if (!res.ok) throw new Error('Falha ao baixar a imagem salva')
  return await res.blob()
}

// processa cada arquivo isoladamente: uma foto problemática não derruba o lote
const processarArquivos = async (files: File[]) => {
  const resultados = await Promise.allSettled(files.map(toPostImg))
  const imgs: PostImg[] = []
  const falhas: string[] = []
  resultados.forEach((r, i) => {
    if (r.status === 'fulfilled') imgs.push(r.value)
    else falhas.push(files[i].name)
  })
  return { imgs, falhas }
}

const mensagemDeFalha = (falhas: string[]) => {
  const uma = falhas.length === 1
  const quantidade = `${falhas.length} ${uma ? 'foto' : 'fotos'}`
  const naoLida = uma ? 'não pôde ser lida' : 'não puderam ser lidas'
  return `${quantidade} ${naoLida}: ${falhas.slice(0, 3).join(', ')}${falhas.length > 3 ? '...' : ''}`
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [fileDragging, setFileDragging] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ id: string; idx: number } | null>(null)
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [exporting, setExporting] = useState(false)
  const [exportingPreview, setExportingPreview] = useState(false)
  const [organizing, setOrganizing] = useState(false)
  const [orgProposal, setOrgProposal] = useState<OrgProposal | null>(null)
  const [orgError, setOrgError] = useState<string | null>(null)
  const [modalDragOverIdx, setModalDragOverIdx] = useState<number | null>(null)
  // ordenado pela sequência de cliques: o primeiro clicado abre o carrossel
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // ---- seleção de fotos pelo agente ----
  const [agentImgs, setAgentImgs] = useState<PostImg[] | null>(null)
  const [agentRunning, setAgentRunning] = useState(false)
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null)
  const [chosenCats, setChosenCats] = useState<string[]>([])
  const [agentDownloading, setAgentDownloading] = useState(false)
  const [agentError, setAgentError] = useState<string | null>(null)

  // menus suspensos do header
  const [addOpen, setAddOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  // aviso visível quando alguma foto não pôde ser lida
  const [avisoFotos, setAvisoFotos] = useState<string | null>(null)

  // limpar o feed: o botão fica apagado até o atalho chamá-lo
  const [limparEmDestaque, setLimparEmDestaque] = useState(false)
  const [confirmarLimpeza, setConfirmarLimpeza] = useState(false)
  // estado da persistência do feed
  const [feedCarregado, setFeedCarregado] = useState(false)
  const [salvando, setSalvando] = useState(false)
  // empresa dona deste feed
  const [empresas, setEmpresas] = useState<EmpresaResumo[]>([])
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [empresaPronta, setEmpresaPronta] = useState(false)
  const [empresaOpen, setEmpresaOpen] = useState(false)
  const [agendaOpen, setAgendaOpen] = useState(false)

  const wrapRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const selectInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const carrInputRef = useRef<HTMLInputElement>(null)
  const pendingTypeRef = useRef<PostType>('single')
  const dragIdRef = useRef<string | null>(null)
  const replaceIdRef = useRef<string | null>(null)
  const modalDragIdxRef = useRef<number | null>(null)
  const panRef = useRef<{ sx: number; sy: number; tx: number; ty: number } | null>(null)

  // ---- perfil (localStorage) ----

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY)
      if (raw) setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(raw) })
    } catch { /* perfil corrompido: usa o padrão */ }
    setProfileLoaded(true)
  }, [])

  useEffect(() => {
    if (!profileLoaded) return
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    } catch { /* quota excedida: segue sem persistir */ }
  }, [profile, profileLoaded])

  // ---- empresas ----

  // lista de empresas e a última selecionada
  useEffect(() => {
    const carregar = async () => {
      try {
        const res = await fetch('/api/demandas')
        const data = await res.json()
        if (Array.isArray(data)) {
          setEmpresas(data.map((e: any) => ({ id: e.id, nome: e.nome, avatar: e.avatar })))
        }
      } catch (e) {
        console.error('Erro ao carregar empresas:', e)
      }
      try {
        const salva = localStorage.getItem(EMPRESA_KEY)
        if (salva) setEmpresaId(salva)
      } catch { /* segue sem empresa */ }
      setEmpresaPronta(true)
    }
    carregar()
  }, [])

  useEffect(() => {
    if (!empresaPronta) return
    try {
      if (empresaId) localStorage.setItem(EMPRESA_KEY, empresaId)
      else localStorage.removeItem(EMPRESA_KEY)
    } catch { /* quota excedida */ }
  }, [empresaId, empresaPronta])

  const empresaAtual = empresas.find(e => e.id === empresaId) ?? null

  // ---- feed (Supabase) ----

  // recarrega o feed sempre que a empresa muda
  useEffect(() => {
    if (!empresaPronta) return
    let cancelado = false
    setFeedCarregado(false)
    const carregar = async () => {
      try {
        const url = empresaId ? `/api/feed/posts?empresa_id=${empresaId}` : '/api/feed/posts'
        const res = await fetch(url)
        const data = await res.json()
        if (cancelado) return
        if (data.aviso) setAvisoFotos(data.aviso)
        if (Array.isArray(data.posts)) {
          setPosts(data.posts.map((p: any): Post => ({
            id: p.id,
            type: p.tipo,
            legenda: p.legenda ?? '',
            agendadoEm: p.agendadoEm ?? null,
            status: (p.status ?? 'rascunho') as StatusPost,
            imgs: p.imagens.map((i: any): PostImg => ({ id: i.id, src: i.url, url: i.url }))
          })))
        }
      } catch (e) {
        console.error('Erro ao carregar o feed:', e)
      } finally {
        if (!cancelado) setFeedCarregado(true)
      }
    }
    carregar()
    return () => { cancelado = true }
  }, [empresaId, empresaPronta])

  // salva sozinho pouco depois de cada mudança
  useEffect(() => {
    if (!feedCarregado) return
    setSalvando(true)
    const timer = setTimeout(async () => {
      try {
        // garante que toda imagem nova já esteja no Storage
        const pendentes = posts.flatMap(p => p.imgs).filter(img => img.file && !img.url)
        if (pendentes.length > 0) {
          const urls = await Promise.all(pendentes.map(subirImagem))
          const mapa = new Map(pendentes.map((img, i) => [img.id, urls[i]]))
          setPosts(prev => prev.map(p => ({
            ...p,
            imgs: p.imgs.map(img => {
              const url = mapa.get(img.id)
              return url ? { ...img, url } : img
            })
          })))
          return // o próprio setPosts dispara o salvamento de novo, já com as URLs
        }

        const corpo = {
          empresaId,
          posts: posts.map(p => ({
            id: p.id,
            tipo: p.type,
            legenda: p.legenda ?? '',
            agendadoEm: p.agendadoEm ?? null,
            status: p.status ?? 'rascunho',
            imagens: p.imgs
              .filter(img => img.url)
              .map(img => ({ id: img.id, url: img.url as string }))
          }))
        }
        const res = await fetch('/api/feed/posts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(corpo)
        })
        const data = await res.json()
        if (data.aviso) setAvisoFotos(data.aviso)
      } catch (e) {
        console.error('Erro ao salvar o feed:', e)
      } finally {
        setSalvando(false)
      }
    }, 1200)
    return () => clearTimeout(timer)
  }, [posts, feedCarregado])

  // ---- canvas: pan + zoom ----

  const fitView = useCallback(() => {
    const wrap = wrapRef.current
    const grid = gridRef.current
    if (!wrap || !grid) return
    const scale = Math.min(
      wrap.clientWidth / (grid.offsetWidth + 96),
      wrap.clientHeight / (grid.offsetHeight + 96),
      1
    )
    setView({
      scale,
      tx: (wrap.clientWidth - grid.offsetWidth * scale) / 2,
      ty: 48
    })
  }, [])

  useEffect(() => {
    fitView()
  }, [fitView])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      const mx = e.clientX - r.left
      const my = e.clientY - r.top
      setView(v => {
        const ns = Math.min(3, Math.max(0.2, v.scale * (e.deltaY < 0 ? 1.1 : 0.9)))
        return {
          scale: ns,
          tx: mx - (mx - v.tx) * (ns / v.scale),
          ty: my - (my - v.ty) * (ns / v.scale)
        }
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const p = panRef.current
      if (!p) return
      setView(v => ({ ...v, tx: p.tx + e.clientX - p.sx, ty: p.ty + e.clientY - p.sy }))
    }
    const up = () => {
      panRef.current = null
      setIsPanning(false)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
  }, [])

  const handlePanStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-no-pan]')) return
    panRef.current = { sx: e.clientX, sy: e.clientY, tx: view.tx, ty: view.ty }
    setIsPanning(true)
  }

  const zoomBy = (dir: 1 | -1) => {
    const wrap = wrapRef.current
    if (!wrap) return
    const mx = wrap.clientWidth / 2
    const my = wrap.clientHeight / 2
    setView(v => {
      const ns = Math.min(3, Math.max(0.2, v.scale * (dir > 0 ? 1.15 : 0.87)))
      return {
        scale: ns,
        tx: mx - (mx - v.tx) * (ns / v.scale),
        ty: my - (my - v.ty) * (ns / v.scale)
      }
    })
  }

  // ---- posts ----

  // separa imagens (inclusive HEIC e DNG) do que não é imagem
  const separarImagens = (list: FileList | File[] | null) => {
    const todos = Array.from(list ?? [])
    return {
      aceitos: todos.filter(ehImagemAceita),
      recusados: todos.filter(f => !ehImagemAceita(f)).map(f => f.name)
    }
  }

  const addFiles = async (list: FileList | File[] | null, type: PostType) => {
    const { aceitos, recusados } = separarImagens(list)
    if (aceitos.length === 0 && recusados.length === 0) return

    const alvo = type === 'carousel' ? aceitos.slice(0, 10) : aceitos
    const { imgs, falhas } = await processarArquivos(alvo)
    const problemas = [...falhas, ...recusados]

    if (imgs.length > 0) {
      if (type === 'carousel') {
        setPosts(prev => [
          { id: uid(), type: imgs.length > 1 ? 'carousel' : 'single', imgs },
          ...prev
        ])
      } else {
        setPosts(prev => [
          ...imgs.map(img => ({ id: uid(), type, imgs: [img] })),
          ...prev
        ])
      }
    }
    setAvisoFotos(problemas.length > 0 ? mensagemDeFalha(problemas) : null)
  }

  const openUpload = (type: PostType) => {
    pendingTypeRef.current = type
    fileInputRef.current?.click()
  }

  // fecha os menus do header ao clicar fora ou apertar Escape
  useEffect(() => {
    if (!addOpen && !exportOpen && !empresaOpen) return
    const close = () => {
      setAddOpen(false)
      setExportOpen(false)
      setEmpresaOpen(false)
    }
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-menu]')) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [addOpen, exportOpen, empresaOpen])

  const removePost = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  const limparFeed = () => {
    setPosts([])
    setSelectedIds([])
    setPreview(null)
    setEditId(null)
    setConfirmarLimpeza(false)
    setLimparEmDestaque(false)
  }

  // Ctrl A (ou Cmd A) acende o botão de limpar e já abre a confirmação
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null
      const digitando = alvo?.tagName === 'INPUT' || alvo?.tagName === 'TEXTAREA' || alvo?.isContentEditable
      if (digitando) return
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'a') return

      e.preventDefault()
      setLimparEmDestaque(true)
      if (posts.length > 0) setConfirmarLimpeza(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [posts.length])

  // troca direta de lugares: a foto arrastada e a foto de destino trocam entre si
  const movePost = (fromId: string, toId: string) => {
    setPosts(prev => {
      const from = prev.findIndex(p => p.id === fromId)
      const to = prev.findIndex(p => p.id === toId)
      if (from < 0 || to < 0 || from === to) return prev
      const next = [...prev]
      ;[next[from], next[to]] = [next[to], next[from]]
      return next
    })
  }

  // ---- seleção múltipla (⌘/Ctrl + clique) → tornar carrossel ----

  const toggleSelect = (e: React.MouseEvent, post: Post) => {
    if (!e.metaKey && !e.ctrlKey) return
    if (post.type !== 'single') return
    if ((e.target as HTMLElement).closest('button')) return
    e.preventDefault()
    setSelectedIds(prev =>
      prev.includes(post.id) ? prev.filter(id => id !== post.id) : [...prev, post.id]
    )
  }

  const clearSelection = () => setSelectedIds([])

  const makeCarousel = () => {
    setPosts(prev => {
      const byId = new Map(prev.map(p => [p.id, p]))
      const selected = selectedIds
        .map(id => byId.get(id))
        .filter((p): p is Post => p !== undefined)
      if (selected.length < 2) return prev
      const merged: Post = {
        id: uid(),
        type: 'carousel',
        // as imagens seguem a ordem dos cliques: a 1ª clicada é a capa
        imgs: selected.flatMap(p => p.imgs).slice(0, 10)
      }
      // o carrossel assume a posição da primeira foto clicada
      return prev.flatMap(p => {
        if (p.id === selectedIds[0]) return [merged]
        if (selectedIds.includes(p.id)) return []
        return [p]
      })
    })
    clearSelection()
  }

  useEffect(() => {
    if (selectedIds.length === 0) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedIds([])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedIds.length])

  // descarta seleções de posts que deixaram de existir
  useEffect(() => {
    setSelectedIds(prev => {
      const next = prev.filter(id => posts.some(p => p.id === id))
      return next.length === prev.length ? prev : next
    })
  }, [posts])

  // ---- prévia de carrossel (clique no badge) ----

  const previewPost = preview ? posts.find(p => p.id === preview.id) ?? null : null

  // URLs dos arquivos originais para a prévia em alta qualidade
  useEffect(() => {
    if (!previewPost) {
      setPreviewUrls([])
      return
    }
    // fotos em memória viram blob URL; as já salvas usam a URL pública
    const criadas: string[] = []
    const urls = previewPost.imgs.map(img => {
      if (img.file) {
        const u = URL.createObjectURL(img.file)
        criadas.push(u)
        return u
      }
      return img.url ?? img.src
    })
    setPreviewUrls(urls)
    return () => criadas.forEach(u => URL.revokeObjectURL(u))
  }, [previewPost])

  const stepPreview = useCallback((dir: 1 | -1) => {
    setPreview(prev => {
      if (!prev) return prev
      const post = posts.find(p => p.id === prev.id)
      if (!post) return prev
      const idx = Math.min(Math.max(prev.idx + dir, 0), post.imgs.length - 1)
      return { ...prev, idx }
    })
  }, [posts])

  useEffect(() => {
    if (!preview) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreview(null)
      if (e.key === 'ArrowRight') stepPreview(1)
      if (e.key === 'ArrowLeft') stepPreview(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [preview, stepPreview])

  // ---- edição de carrossel ----

  const editingPost = editId ? posts.find(p => p.id === editId) ?? null : null

  const openEdit = (post: Post) => {
    if (post.type === 'reels') {
      replaceIdRef.current = post.id
      carrInputRef.current?.click()
    } else {
      setEditId(post.id)
    }
  }

  const closeEdit = () => setEditId(null)

  const atualizarLegenda = (id: string, legenda: string) => {
    setPosts(prev => prev.map(p => (p.id === id ? { ...p, legenda } : p)))
  }

  // ---- agendamento ----

  // ao marcar data e hora, a publicação vira "agendado" sozinha
  const atualizarAgendamento = (id: string, valorDoCampo: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== id) return p
      if (!valorDoCampo) {
        return { ...p, agendadoEm: null, status: p.status === 'publicado' ? p.status : 'rascunho' }
      }
      const iso = new Date(valorDoCampo).toISOString()
      return { ...p, agendadoEm: iso, status: p.status === 'publicado' ? p.status : 'agendado' }
    }))
  }

  const atualizarStatus = (id: string, status: StatusPost) => {
    setPosts(prev => prev.map(p => (p.id === id ? { ...p, status } : p)))
  }

  // publicações com data marcada, da mais próxima para a mais distante
  const agenda = posts
    .filter(p => p.agendadoEm)
    .sort((a, b) => new Date(a.agendadoEm!).getTime() - new Date(b.agendadoEm!).getTime())

  useEffect(() => {
    if (!editId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editId])

  const addImgsToPost = async (id: string, list: FileList | null) => {
    const { aceitos, recusados } = separarImagens(list)
    if (aceitos.length === 0 && recusados.length === 0) return

    const { imgs, falhas } = await processarArquivos(aceitos)
    if (imgs.length > 0) {
      setPosts(prev => prev.map(p => {
        if (p.id !== id) return p
        const merged = [...p.imgs, ...imgs].slice(0, 10)
        return { ...p, imgs: merged, type: merged.length > 1 ? 'carousel' : 'single' }
      }))
    }
    const problemas = [...falhas, ...recusados]
    setAvisoFotos(problemas.length > 0 ? mensagemDeFalha(problemas) : null)
  }

  const replaceThumb = async (id: string, list: FileList | null) => {
    if (!list?.[0]) return
    try {
      const img = await toPostImg(list[0])
      setPosts(prev => prev.map(p => (p.id === id ? { ...p, imgs: [img] } : p)))
      setAvisoFotos(null)
    } catch {
      setAvisoFotos(mensagemDeFalha([list[0].name]))
    }
  }

  const removeImgFromPost = (id: string, idx: number) => {
    setPosts(prev => prev.flatMap(p => {
      if (p.id !== id) return [p]
      const imgs = p.imgs.filter((_, i) => i !== idx)
      if (imgs.length === 0) return []
      return [{ ...p, imgs, type: imgs.length > 1 ? 'carousel' as const : 'single' as const }]
    }))
  }

  const moveImgInPost = (id: string, from: number, to: number) => {
    if (from === to) return
    setPosts(prev => prev.map(p => {
      if (p.id !== id) return p
      const imgs = [...p.imgs]
      const [moved] = imgs.splice(from, 1)
      imgs.splice(to, 0, moved)
      return { ...p, imgs }
    }))
  }

  // fecha o modal se o post editado deixar de existir (última imagem removida)
  useEffect(() => {
    if (editId && !posts.some(p => p.id === editId)) setEditId(null)
  }, [posts, editId])

  // ---- exportação ZIP com renomeação automática ----

  const EXT_BY_MIME: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/heic': 'heic',
    'image/avif': 'avif'
  }

  const exportZip = async () => {
    if (posts.length === 0 || exporting) return
    setExporting(true)
    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      for (const [idx, post] of posts.entries()) {
        // numeração cronológica: a 1ª postagem (canto inferior direito) = 1
        const num = posts.length - idx
        for (const [page, img] of post.imgs.entries()) {
          // arquivo original intacto, sem recompressão
          const arquivo = await obterArquivo(img)
          const ext = EXT_BY_MIME[arquivo.type] ?? 'jpg'
          const name = page === 0 ? `${num}.${ext}` : `${num}-${page}.${ext}`
          zip.file(name, arquivo)
        }
      }
      const blob = await zip.generateAsync({ type: 'blob' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = nomeExport(empresaAtual?.nome, '.zip')
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e) {
      console.error('Erro ao exportar ZIP:', e)
    } finally {
      setExporting(false)
    }
  }

  // ---- exportação da prévia do grid (JPEG) ----

  const exportPreview = async () => {
    if (posts.length === 0 || exportingPreview) return
    setExportingPreview(true)
    try {
      const COLS = 3
      const CW = 1080
      const CH = 1350
      const GAP = 20
      const rows = Math.max(Math.ceil(posts.length / COLS), 3)
      const total = rows * COLS
      const gridW = COLS * CW + (COLS - 1) * GAP
      const gridH = rows * CH + (rows - 1) * GAP

      // seção de detalhamento: uma faixa de slides por carrossel, em ordem cronológica
      const SLW = 500
      const SLH = 625
      const SGAP = 16
      const LABEL_H = 110
      const BLOCK_GAP = 60
      const perRow = Math.floor((gridW + SGAP) / (SLW + SGAP))
      const carouselList = posts
        .map((post, idx) => ({ post, num: posts.length - idx }))
        .filter(({ post }) => post.type === 'carousel')
        .sort((a, b) => a.num - b.num)
      const blockH = ({ post }: { post: Post }) => {
        const slideRows = Math.ceil(post.imgs.length / perRow)
        return LABEL_H + slideRows * SLH + (slideRows - 1) * SGAP + BLOCK_GAP
      }
      const sectionH = carouselList.length
        ? 80 + carouselList.reduce((acc, c) => acc + blockH(c), 0)
        : 0

      const canvas = document.createElement('canvas')
      canvas.width = gridW
      canvas.height = gridH + sectionH
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('canvas 2d indisponível')
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const drawCover = async (img: PostImg, x: number, y: number, w: number, h: number) => {
        const file = await obterArquivo(img)
        const bmp = await createImageBitmap(file)
        const scale = Math.max(w / bmp.width, h / bmp.height)
        const sw = w / scale
        const sh = h / scale
        ctx.drawImage(bmp, (bmp.width - sw) / 2, (bmp.height - sh) / 2, sw, sh, x, y, w, h)
        bmp.close()
      }

      // ícone de carrossel (quadrados sobrepostos, estilo Instagram)
      const drawCarouselIcon = (x: number, y: number, s: number) => {
        ctx.save()
        ctx.shadowColor = 'rgba(0,0,0,0.55)'
        ctx.shadowBlur = s * 0.2
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = s * 0.11
        ctx.beginPath()
        ctx.roundRect(x, y + s * 0.28, s * 0.72, s * 0.72, s * 0.14)
        ctx.stroke()
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.roundRect(x + s * 0.28, y, s * 0.72, s * 0.72, s * 0.14)
        ctx.fill()
        ctx.restore()
      }

      // ícone de reels (triângulo de play)
      const drawPlayIcon = (x: number, y: number, s: number) => {
        ctx.save()
        ctx.shadowColor = 'rgba(0,0,0,0.55)'
        ctx.shadowBlur = s * 0.2
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + s * 0.9, y + s * 0.5)
        ctx.lineTo(x, y + s)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }

      // grid principal: mesma ordem da tela, vazios no topo
      for (let i = 0; i < total; i++) {
        const x = (i % COLS) * (CW + GAP)
        const y = Math.floor(i / COLS) * (CH + GAP)
        const postIdx = i - (total - posts.length)
        if (postIdx < 0) {
          ctx.fillStyle = '#111'
          ctx.fillRect(x, y, CW, CH)
          continue
        }
        const post = posts[postIdx]
        await drawCover(post.imgs[0], x, y, CW, CH)
        if (post.type === 'carousel') drawCarouselIcon(x + CW - 140, y + 45, 90)
        if (post.type === 'reels') drawPlayIcon(x + CW - 125, y + 45, 85)
      }

      // detalhamento dos carrosséis
      let cursorY = gridH + 80
      for (const { post, num } of carouselList) {
        ctx.fillStyle = '#fff'
        ctx.font = '600 52px system-ui, -apple-system, sans-serif'
        ctx.textBaseline = 'top'
        ctx.fillText(`Publicação ${num} (carrossel com ${post.imgs.length} fotos)`, 8, cursorY)
        cursorY += LABEL_H
        for (let i = 0; i < post.imgs.length; i++) {
          const x = (i % perRow) * (SLW + SGAP)
          const y = cursorY + Math.floor(i / perRow) * (SLH + SGAP)
          await drawCover(post.imgs[i], x, y, SLW, SLH)
          // número da ordem do slide
          ctx.fillStyle = 'rgba(0,0,0,0.65)'
          ctx.beginPath()
          ctx.arc(x + 62, y + 62, 42, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#fff'
          ctx.font = '600 46px system-ui, -apple-system, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(String(i + 1), x + 62, y + 65)
          ctx.textAlign = 'left'
          ctx.textBaseline = 'alphabetic'
        }
        const slideRows = Math.ceil(post.imgs.length / perRow)
        cursorY += slideRows * SLH + (slideRows - 1) * SGAP + BLOCK_GAP
      }

      const blob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(resolve, 'image/jpeg', 0.95)
      )
      if (!blob) throw new Error('falha ao gerar JPEG')
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = nomeExport(empresaAtual?.nome, '.jpg')
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e) {
      console.error('Erro ao exportar prévia:', e)
    } finally {
      setExportingPreview(false)
    }
  }

  // ---- seleção de fotos pelo agente ----

  const handleAgentUpload = async (list: FileList | null) => {
    const { aceitos, recusados } = separarImagens(list)
    if (aceitos.length === 0 && recusados.length === 0) return

    const { imgs, falhas } = await processarArquivos(aceitos)
    const problemas = [...falhas, ...recusados]

    if (imgs.length > 0) {
      setAgentImgs(imgs)
      setAgentResult(null)
      setChosenCats([])
    }
    // no fluxo do agente o aviso aparece dentro do próprio pop-up
    setAgentError(problemas.length > 0 ? mensagemDeFalha(problemas) : null)
    if (imgs.length === 0 && problemas.length > 0) setAvisoFotos(mensagemDeFalha(problemas))
  }

  const runAgent = async () => {
    if (!agentImgs || agentImgs.length === 0 || agentRunning) return
    setAgentRunning(true)
    setAgentError(null)
    try {
      // agente de categorias: identifica os produtos presentes nas fotos.
      // TODO: seleção e otimização das melhores fotos (próxima etapa);
      // por enquanto todas as fotos enviadas são mantidas.
      const res = await fetch('/api/feed/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fotos: agentImgs.map(img => ({ src: img.src })) })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao analisar as fotos.')
      setAgentResult({ imgs: agentImgs, categorias: data.categorias ?? [] })
      setChosenCats([])
    } catch (e) {
      setAgentError(e instanceof Error ? e.message : 'Erro ao analisar as fotos.')
    } finally {
      setAgentRunning(false)
    }
  }

  const toggleCategory = (cat: string) => {
    setChosenCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const removeAgentImg = (idx: number) => {
    if (!agentResult) return
    const imgs = agentResult.imgs.filter((_, i) => i !== idx)
    if (imgs.length === 0) {
      closeAgent()
      return
    }
    setAgentResult({ ...agentResult, imgs })
  }

  const closeAgent = () => {
    setAgentImgs(null)
    setAgentResult(null)
    setChosenCats([])
    setAgentError(null)
  }

  const downloadAgentImgs = async () => {
    if (!agentResult || agentDownloading) return
    setAgentDownloading(true)
    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      for (const [i, img] of agentResult.imgs.entries()) {
        const arquivo = await obterArquivo(img)
        const ext = EXT_BY_MIME[arquivo.type] ?? 'jpg'
        zip.file(`foto-${i + 1}.${ext}`, arquivo)
      }
      const blob = await zip.generateAsync({ type: 'blob' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'fotos-otimizadas.zip'
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e) {
      console.error('Erro ao baixar imagens:', e)
    } finally {
      setAgentDownloading(false)
    }
  }

  const buildFeedFromAgent = () => {
    if (!agentResult) return
    // guarda as categorias marcadas para a etapa de legendas
    try {
      localStorage.setItem(CATEGORIAS_KEY, JSON.stringify(chosenCats))
    } catch { /* quota excedida: segue sem persistir */ }
    setPosts(prev => [
      ...agentResult.imgs.map(img => ({ id: uid(), type: 'single' as const, imgs: [img] })),
      ...prev
    ])
    closeAgent()
  }

  useEffect(() => {
    if (!agentImgs && !agentResult) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAgent()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [agentImgs, agentResult])

  // ---- organizar com IA ----

  const handleOrganize = async () => {
    if (posts.length < 2 || organizing) return
    setOrganizing(true)
    setOrgError(null)
    try {
      // ids curtos (f1, f2...) para o modelo: os uids longos e aleatórios
      // eram transcritos com erro e os grupos voltavam vazios
      const idMap = new Map(posts.map((p, i) => [`f${i + 1}`, p.id]))
      const res = await fetch('/api/feed/organizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fotos: posts.map((p, i) => ({ id: `f${i + 1}`, src: p.imgs[0].src, tipo: p.type }))
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao organizar o feed.')
      const real = (id: string) => idMap.get(id) ?? id
      const proposta: OrgProposal = data.proposta
      setOrgProposal({
        carrosseis: proposta.carrosseis.map(g => ({ ...g, ids: g.ids.map(real) })),
        ordem: proposta.ordem.map(real),
        resumo: proposta.resumo
      })
    } catch (e) {
      setOrgError(e instanceof Error ? e.message : 'Erro ao organizar o feed.')
    } finally {
      setOrganizing(false)
    }
  }

  // descarta um carrossel proposto: as fotos continuam na grade,
  // apenas deixam de ser agrupadas (voltam à ordem como posts individuais)
  const removeProposalGroup = (gi: number) => {
    setOrgProposal(prev => {
      if (!prev) return prev
      const grupo = prev.carrosseis[gi]
      if (!grupo) return prev
      const carrosseis = prev.carrosseis.filter((_, i) => i !== gi)
      const ordem = prev.ordem.flatMap(id => (id === grupo.ids[0] ? grupo.ids : [id]))
      return { ...prev, carrosseis, ordem }
    })
  }

  const applyProposal = () => {
    if (!orgProposal) return
    setPosts(prev => {
      const byId = new Map(prev.map(p => [p.id, p]))

      // valida os grupos: só fotos simples existentes, 2 a 10 por grupo
      const validGroups = orgProposal.carrosseis
        .map(g => g.ids.filter(id => byId.get(id)?.type === 'single'))
        .filter(ids => ids.length >= 2)
        .map(ids => ids.slice(0, 10))

      const representative = new Map(validGroups.map(ids => [ids[0], ids]))
      const consumed = new Set(validGroups.flatMap(ids => ids.slice(1)))

      const mergedFor = (ids: string[]): Post => ({
        id: uid(),
        type: 'carousel',
        imgs: ids.flatMap(id => byId.get(id)?.imgs ?? []).slice(0, 10)
      })

      const next: Post[] = []
      const placed = new Set<string>()
      for (const id of orgProposal.ordem) {
        if (placed.has(id) || consumed.has(id)) continue
        const group = representative.get(id)
        if (group) {
          next.push(mergedFor(group))
          group.forEach(gid => placed.add(gid))
        } else if (byId.has(id)) {
          next.push(byId.get(id)!)
          placed.add(id)
        }
      }
      // segurança: qualquer post que a proposta não citou permanece no fim
      for (const p of prev) {
        if (!placed.has(p.id) && !consumed.has(p.id)) next.push(p)
      }
      return next
    })
    setOrgProposal(null)
  }

  // ---- ações ----

  const handleShare = async () => {
    const text = `${profile.name}: ${posts.length} publicações planejadas no feed`
    try {
      if (navigator.share) {
        await navigator.share({ title: profile.name, text })
      } else {
        await navigator.clipboard.writeText(text)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* usuário cancelou o share */ }
  }

  const handleAvatar = async (files: FileList | null) => {
    if (!files?.[0]) return
    try {
      const src = await compress(await converterSePreciso(files[0]), 200)
      setProfile(p => ({ ...p, avatar: src }))
    } catch {
      setAvisoFotos(mensagemDeFalha([files[0].name]))
    }
    if (avatarInputRef.current) avatarInputRef.current.value = ''
  }

  // ---- render ----

  const carousels = posts.filter(p => p.type === 'carousel').length
  const reels = posts.filter(p => p.type === 'reels').length
  const totalCells = Math.max(Math.ceil((posts.length + 1) / 3) * 3, 9)

  // posição que cada foto selecionada terá dentro do carrossel (ordem de clique)
  const selectionOrder = new Map(selectedIds.map((id, i) => [id, i + 1]))

  return (
    <div className="-m-12 h-screen flex flex-col bg-white dark:bg-zinc-950">
      {/* Header */}
      <div className="h-14 border-b border-gray-200 dark:border-zinc-800 flex items-center px-6 gap-4 shrink-0">
        <h1 className="text-sm font-medium text-gray-900 dark:text-gray-50">Feed</h1>

        {/* Empresa dona do feed */}
        <div className="relative" data-menu>
          <button
            onClick={() => {
              setAddOpen(false)
              setExportOpen(false)
              setEmpresaOpen(o => !o)
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-gray-300 dark:border-zinc-700 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors max-w-[200px]"
          >
            {empresaAtual?.avatar
              ? <img src={empresaAtual.avatar} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" />
              : <Building2 size={13} className="shrink-0" />}
            <span className="truncate">{empresaAtual?.nome ?? 'Sem empresa'}</span>
            <ChevronDown size={12} className={`shrink-0 transition-transform ${empresaOpen ? 'rotate-180' : ''}`} />
          </button>
          {empresaOpen && (
            <div className="absolute left-0 top-full mt-1 w-56 max-h-72 overflow-y-auto scrollbar-thin py-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg z-50">
              <button
                onClick={() => {
                  setEmpresaId(null)
                  setEmpresaOpen(false)
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${empresaId === null ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
              >
                <Building2 size={13} />
                Sem empresa
              </button>
              {empresas.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => {
                    setEmpresaId(emp.id)
                    setEmpresaOpen(false)
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${empresaId === emp.id ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                >
                  {emp.avatar
                    ? <img src={emp.avatar} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" />
                    : <span className="w-4 h-4 rounded-full bg-gray-300 dark:bg-zinc-700 shrink-0" />}
                  <span className="truncate">{emp.nome}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="text-xs text-gray-500 dark:text-gray-400">
          {posts.length} {posts.length === 1 ? 'publicação' : 'publicações'}
        </span>
        <span className="text-xs text-gray-400 dark:text-zinc-600 flex items-center gap-1">
          {salvando
            ? <><Loader2 size={11} className="animate-spin" /> Salvando</>
            : feedCarregado ? <><Check size={11} /> Salvo</> : null}
        </span>

        <div className="w-px h-5 bg-gray-200 dark:bg-zinc-800 mx-2" />

        {/* Etapa 1: entrada de fotos */}
        <div className="flex gap-2">
          <button
            onClick={() => selectInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded hover:opacity-90 transition-opacity"
          >
            <Upload size={13} />
            Selecionar fotos
          </button>

          <div className="relative" data-menu>
            <button
              onClick={() => {
                setExportOpen(false)
                setAddOpen(o => !o)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 dark:border-zinc-700 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Plus size={13} />
              Adicionar
              <ChevronDown size={12} className={`transition-transform ${addOpen ? 'rotate-180' : ''}`} />
            </button>
            {addOpen && (
              <div className="absolute left-0 top-full mt-1 w-40 py-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg z-50">
                <button
                  onClick={() => {
                    setAddOpen(false)
                    openUpload('single')
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <ImagePlus size={13} />
                  Foto
                </button>
                <button
                  onClick={() => {
                    setAddOpen(false)
                    openUpload('carousel')
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Images size={13} />
                  Carrossel
                </button>
                <button
                  onClick={() => {
                    setAddOpen(false)
                    openUpload('reels')
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Play size={13} />
                  Reels
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1" />

        {/* fica apagado no canto e acende com Ctrl A */}
        <button
          onClick={() => {
            setLimparEmDestaque(true)
            setConfirmarLimpeza(true)
          }}
          disabled={posts.length === 0}
          title="Remover todas as fotos (Ctrl A)"
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded transition-all disabled:cursor-not-allowed ${
            limparEmDestaque
              ? 'border-red-300 dark:border-red-500/60 text-red-600 dark:text-red-400 opacity-100 disabled:opacity-40'
              : 'border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 opacity-20 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-10'
          }`}
        >
          <Trash2 size={13} />
          Limpar feed
        </button>

        {/* Etapas 2 e 3: montar e exportar */}
        <button
          onClick={handleOrganize}
          disabled={posts.length < 2 || organizing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 dark:border-zinc-700 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {organizing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {organizing ? 'Analisando...' : 'Organizar com IA'}
        </button>

        <div className="relative" data-menu>
          <button
            onClick={() => {
              setAddOpen(false)
              setExportOpen(o => !o)
            }}
            disabled={posts.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 dark:border-zinc-700 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {(exporting || exportingPreview)
              ? <Loader2 size={13} className="animate-spin" />
              : <Download size={13} />}
            Exportar
            <ChevronDown size={12} className={`transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 py-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg z-50">
              <button
                onClick={() => {
                  setExportOpen(false)
                  exportPreview()
                }}
                disabled={exportingPreview}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
              >
                <ImageDown size={13} />
                Prévia em imagem
              </button>
              <button
                onClick={() => {
                  setExportOpen(false)
                  exportZip()
                }}
                disabled={exporting}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
              >
                <Download size={13} />
                ZIP das fotos
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div
          ref={wrapRef}
          className={`flex-1 relative overflow-hidden bg-gray-50 dark:bg-zinc-900 select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handlePanStart}
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes('Files')) {
              e.preventDefault()
              setFileDragging(true)
            }
          }}
          onDragLeave={(e) => {
            if (e.target === wrapRef.current) setFileDragging(false)
          }}
          onDrop={(e) => {
            if (e.dataTransfer.types.includes('Files')) {
              e.preventDefault()
              setFileDragging(false)
              addFiles(e.dataTransfer.files, 'single')
            }
          }}
        >
          <div
            className="absolute left-0 top-0 will-change-transform"
            style={{ transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})`, transformOrigin: '0 0' }}
          >
            <p className="text-[10px] text-gray-400 dark:text-zinc-600 text-center mb-2">↑ Mais recente</p>
            <div ref={gridRef} data-no-pan className="grid grid-cols-3 gap-[3px] w-max">
              {/* vazios primeiro: o grid é ancorado embaixo, como no Instagram —
                  a 1ª publicação fica no canto inferior direito e as novas
                  preenchem da direita para a esquerda, subindo de linha */}
              {Array.from({ length: totalCells - posts.length }).map((_, i) => (
                <button
                  key={`empty-${i}`}
                  onClick={() => openUpload('single')}
                  className="w-[140px] h-[175px] border border-dashed border-gray-300 dark:border-zinc-700 bg-gray-100/50 dark:bg-zinc-800/50 flex items-center justify-center text-gray-300 dark:text-zinc-600 hover:text-gray-400 dark:hover:text-zinc-500 hover:border-gray-400 dark:hover:border-zinc-600 transition-colors"
                >
                  <Plus size={18} />
                </button>
              ))}
              {posts.map((post) => (
                <div
                  key={post.id}
                  draggable={!selectedIds.includes(post.id)}
                  onClick={(e) => toggleSelect(e, post)}
                  onDragStart={(e) => {
                    dragIdRef.current = post.id
                    e.dataTransfer.effectAllowed = 'move'
                    e.dataTransfer.setData('text/plain', post.id)
                  }}
                  onDragEnd={() => {
                    dragIdRef.current = null
                    setDragOverId(null)
                  }}
                  onDragOver={(e) => {
                    if (!dragIdRef.current) return
                    e.preventDefault()
                    setDragOverId(post.id)
                  }}
                  onDragLeave={() => setDragOverId(prev => (prev === post.id ? null : prev))}
                  onDrop={(e) => {
                    if (!dragIdRef.current) return
                    e.preventDefault()
                    e.stopPropagation()
                    movePost(dragIdRef.current, post.id)
                    dragIdRef.current = null
                    setDragOverId(null)
                  }}
                  className={`group relative w-[140px] h-[175px] bg-gray-200 dark:bg-zinc-800 overflow-hidden cursor-grab active:cursor-grabbing ${dragOverId === post.id ? 'ring-2 ring-gray-900 dark:ring-gray-100 ring-inset' : selectedIds.includes(post.id) ? 'ring-2 ring-white/80 ring-inset' : ''}`}
                >
                  <img src={post.imgs[0].src} alt="" draggable={false} className="w-full h-full object-cover" />

                  {/* Selo de agendamento */}
                  {post.agendadoEm && (
                    <span
                      className={`absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] text-white ${post.status === 'publicado' ? 'bg-green-600/80' : 'bg-black/60'}`}
                      title={`${STATUS_ROTULO[post.status ?? 'rascunho']}: ${formatarDataHora(post.agendadoEm)}`}
                    >
                      {post.status === 'publicado' ? <Check size={9} /> : <CalendarClock size={9} />}
                      {formatarDataHora(post.agendadoEm)}
                    </span>
                  )}

                  {selectedIds.includes(post.id) && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                      <span className="w-7 h-7 rounded-full bg-white text-gray-900 text-xs font-semibold flex items-center justify-center shadow-md">
                        {selectionOrder.get(post.id)}
                      </span>
                    </div>
                  )}

                  {post.type === 'carousel' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreview({ id: post.id, idx: 0 })
                      }}
                      aria-label="Ver fotos do carrossel"
                      className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 hover:bg-black/80 rounded text-white text-[9px] transition-colors"
                    >
                      <Images size={10} />
                      {post.imgs.length}
                    </button>
                  )}
                  {post.type === 'reels' && (
                    <div className="absolute top-1.5 right-1.5 p-1 bg-black/60 rounded text-white">
                      <Play size={10} fill="currentColor" />
                    </div>
                  )}

                  <button
                    onClick={() => openEdit(post)}
                    aria-label={post.type === 'reels' ? 'Trocar capa do reels' : 'Editar publicação'}
                    className="absolute bottom-1.5 left-1.5 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Pencil size={11} />
                  </button>
                  <button
                    onClick={() => removePost(post.id)}
                    aria-label="Remover publicação"
                    className="absolute bottom-1.5 right-1.5 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 dark:text-zinc-600 text-center mt-2">↓ Primeira postagem</p>
          </div>

          {/* Zoom flutuante */}
          <div
            data-no-pan
            className="absolute bottom-4 right-4 flex items-center gap-0.5 px-1 py-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-md"
          >
            <button
              onClick={() => zoomBy(-1)}
              aria-label="Diminuir zoom"
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors"
            >
              <Minus size={14} />
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-center tabular-nums">
              {Math.round(view.scale * 100)}%
            </span>
            <button
              onClick={() => zoomBy(1)}
              aria-label="Aumentar zoom"
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={fitView}
              aria-label="Ajustar à tela"
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors"
            >
              <Maximize2 size={14} />
            </button>
          </div>

          {fileDragging && (
            <div className="absolute inset-3 border-2 border-dashed border-gray-400 dark:border-zinc-500 rounded-lg bg-white/70 dark:bg-zinc-950/70 flex items-center justify-center pointer-events-none">
              <p className="text-sm text-gray-600 dark:text-gray-300">Solte as imagens para adicionar</p>
            </div>
          )}

          {selectedIds.length > 0 && (
            <div
              data-no-pan
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 pl-4 pr-2 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-full shadow-lg"
            >
              <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                {selectedIds.length} {selectedIds.length === 1 ? 'foto selecionada' : 'fotos selecionadas'}
              </span>
              <button
                onClick={makeCarousel}
                disabled={selectedIds.length < 2}
                className="px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full transition-colors whitespace-nowrap"
              >
                Tornar carrossel
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Painel do perfil */}
        <div className="w-72 border-l border-gray-200 dark:border-zinc-800 flex flex-col gap-6 p-6 overflow-y-auto shrink-0">
          <div className="flex gap-3">
            <button
              onClick={() => avatarInputRef.current?.click()}
              aria-label="Trocar foto de perfil"
              className="group relative w-12 h-12 rounded-full bg-gray-300 dark:bg-zinc-700 shrink-0 overflow-hidden"
            >
              {profile.avatar && (
                <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={14} />
              </span>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-1 truncate">
                {profile.name}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 whitespace-pre-wrap">
                {profile.bio}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setEditOpen(o => !o)}
              aria-label="Editar perfil"
              className={`flex-1 p-2 rounded transition-colors flex items-center justify-center ${editOpen ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
            >
              <Settings size={16} />
            </button>
            <button
              onClick={handleShare}
              aria-label="Compartilhar"
              className="flex-1 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors flex items-center justify-center"
            >
              {copied ? <Check size={16} className="text-green-600 dark:text-green-500" /> : <Share2 size={16} />}
            </button>
          </div>

          {editOpen && (
            <div className="flex flex-col gap-3 border border-gray-200 dark:border-zinc-800 rounded-lg p-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Nome
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-transparent border border-gray-300 dark:border-zinc-700 rounded text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-500 dark:focus:border-zinc-500"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Bio
                </label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value.slice(0, 150) }))}
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-transparent border border-gray-300 dark:border-zinc-700 rounded text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-500 dark:focus:border-zinc-500 resize-none"
                />
                <p className="text-[10px] text-gray-400 dark:text-zinc-600 mt-1 text-right">
                  {profile.bio.length}/150
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 border-t border-gray-200 dark:border-zinc-800 pt-6">
            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Posts</p>
              <p className="text-xl font-light text-gray-900 dark:text-gray-50">{posts.length}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Carrosséis</p>
              <p className="text-xl font-light text-gray-900 dark:text-gray-50">{carousels}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Reels</p>
              <p className="text-xl font-light text-gray-900 dark:text-gray-50">{reels}</p>
            </div>
          </div>

          {/* Agenda do feed */}
          <div className="border-t border-gray-200 dark:border-zinc-800 pt-6">
            <button
              onClick={() => setAgendaOpen(o => !o)}
              className="w-full flex items-center justify-between text-left mb-3"
            >
              <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarClock size={12} />
                Agenda
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-zinc-600">
                {agenda.length}
                <ChevronDown size={13} className={`transition-transform ${agendaOpen ? 'rotate-180' : ''}`} />
              </span>
            </button>

            {agendaOpen && (
              <div className="flex flex-col gap-1.5">
                {agenda.length === 0 && (
                  <p className="text-[11px] text-gray-400 dark:text-zinc-600 leading-relaxed">
                    Nenhuma publicação agendada. Abra uma publicação no lápis e marque data e hora.
                  </p>
                )}
                {agenda.map(post => (
                  <button
                    key={post.id}
                    onClick={() => setEditId(post.id)}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-left"
                  >
                    <img src={post.imgs[0].src} alt="" className="w-8 h-10 rounded object-cover shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] text-gray-700 dark:text-gray-300">
                        {formatarDataHora(post.agendadoEm)}
                      </span>
                      <span className="block text-[10px] text-gray-400 dark:text-zinc-600 truncate">
                        {post.legenda?.trim() || 'Sem legenda'}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9px] ${
                        post.status === 'publicado'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                          : post.status === 'agendado'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {STATUS_ROTULO[post.status ?? 'rascunho']}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="text-[11px] text-gray-400 dark:text-zinc-600 leading-relaxed mt-auto">
            Arraste as fotos no grid para reordenar. Scroll no canvas para zoom, arraste o fundo para mover. Passe o mouse numa publicação e clique no lápis para editar o carrossel. ⌘/Ctrl + clique seleciona fotos para juntá-las num carrossel.
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={`image/*,${EXTENSOES_EXTRAS.join(",")}`}
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files, pendingTypeRef.current)
          e.target.value = ''
        }}
      />
      <input
        ref={selectInputRef}
        type="file"
        multiple
        accept={`image/*,${EXTENSOES_EXTRAS.join(",")}`}
        className="hidden"
        onChange={(e) => {
          handleAgentUpload(e.target.files)
          e.target.value = ''
        }}
      />
      <input
        ref={avatarInputRef}
        type="file"
        accept={`image/*,${EXTENSOES_EXTRAS.join(",")}`}
        className="hidden"
        onChange={(e) => handleAvatar(e.target.files)}
      />
      <input
        ref={carrInputRef}
        type="file"
        multiple
        accept={`image/*,${EXTENSOES_EXTRAS.join(",")}`}
        className="hidden"
        onChange={(e) => {
          if (replaceIdRef.current) {
            replaceThumb(replaceIdRef.current, e.target.files)
            replaceIdRef.current = null
          } else if (editId) {
            addImgsToPost(editId, e.target.files)
          }
          e.target.value = ''
        }}
      />

      {/* Pop-up pequeno: fotos carregadas, aguardando otimização */}
      {agentImgs && !agentResult && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !agentRunning) closeAgent()
          }}
        >
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6 w-[320px] max-w-full flex flex-col items-center gap-4 text-center">
            <div className="flex items-center justify-between w-full">
              <h2 className="text-sm font-medium text-gray-900 dark:text-gray-50">
                Selecionar fotos
              </h2>
              <button
                onClick={closeAgent}
                disabled={agentRunning}
                aria-label="Fechar"
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors disabled:opacity-40"
              >
                <X size={16} />
              </button>
            </div>

            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <Images size={20} />
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300">
              {agentImgs.length} {agentImgs.length === 1 ? 'foto carregada' : 'fotos carregadas'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              O agente vai analisar as imagens e escolher as melhores para o feed.
            </p>

            <button
              onClick={runAgent}
              disabled={agentRunning}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
            >
              {agentRunning ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {agentRunning ? 'Otimizando...' : 'Iniciar Otimização'}
            </button>

            {agentError && (
              <p className="text-xs text-red-600 dark:text-red-400">{agentError}</p>
            )}
          </div>
        </div>
      )}

      {/* Pop-up grande: resultado da seleção do agente */}
      {agentResult && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeAgent()
          }}
        >
          <div
            className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6 w-full flex flex-col gap-5"
            style={{ maxWidth: 760, maxHeight: '90vh' }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-900 dark:text-gray-50 flex items-center gap-2">
                <Sparkles size={14} />
                Fotos selecionadas pelo agente
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                  {agentResult.imgs.length} {agentResult.imgs.length === 1 ? 'foto' : 'fotos'}
                </span>
              </h2>
              <button
                onClick={closeAgent}
                aria-label="Fechar"
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Grade das fotos escolhidas: o scroll fica no wrapper,
                a grade cresce livre com miniaturas de altura fixa */}
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none">
              <div className="grid grid-cols-4 gap-3">
                {agentResult.imgs.map((img, i) => (
                  <div
                    key={i}
                    style={{ height: 190 }}
                    className="group relative rounded-lg overflow-hidden bg-gray-200 dark:bg-zinc-800"
                  >
                    <img src={img.src} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeAgentImg(i)}
                      aria-label="Remover foto"
                      className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Categorias de produtos identificadas */}
            <div className="flex flex-col gap-2 shrink-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Marque os produtos que terão legendas trabalhadas:
              </p>
              {agentError && (
                <p className="text-xs text-red-600 dark:text-red-400">{agentError}</p>
              )}
              {agentResult.categorias.length === 0 && (
                <p className="text-xs text-gray-400 dark:text-zinc-600">
                  Nenhum produto identificado nas fotos.
                </p>
              )}
              <div className="flex gap-2 flex-wrap">
                {agentResult.categorias.map(cat => {
                  const active = chosenCats.includes(cat)
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-colors ${
                        active
                          ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100'
                          : 'border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {active && <Check size={12} />}
                      {cat}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-2 shrink-0">
              <button
                onClick={downloadAgentImgs}
                disabled={agentDownloading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs border border-gray-300 dark:border-zinc-700 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {agentDownloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                Baixar
              </button>
              <button
                onClick={runAgent}
                disabled={agentRunning}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs border border-gray-300 dark:border-zinc-700 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {agentRunning ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                Refazer
              </button>
              <button
                onClick={buildFeedFromAgent}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded hover:opacity-90 transition-opacity"
              >
                <LayoutGrid size={13} />
                Montar feed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aviso de fotos que não puderam ser lidas */}
      {avisoFotos && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 pl-4 pr-2 py-2 bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-900 rounded-lg shadow-lg max-w-md">
          <p className="text-xs text-amber-700 dark:text-amber-400">{avisoFotos}</p>
          <button
            onClick={() => setAvisoFotos(null)}
            aria-label="Fechar aviso"
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Erro da organização com IA */}
      {orgError && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 pl-4 pr-2 py-2 bg-white dark:bg-zinc-900 border border-red-300 dark:border-red-900 rounded-lg shadow-lg max-w-md">
          <p className="text-xs text-red-600 dark:text-red-400">{orgError}</p>
          <button
            onClick={() => setOrgError(null)}
            aria-label="Fechar aviso"
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Proposta da organização com IA */}
      {orgProposal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOrgProposal(null)
          }}
        >
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-5 w-[480px] max-w-full max-h-[85vh] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-900 dark:text-gray-50 flex items-center gap-2">
                <Sparkles size={14} />
                Proposta de organização
              </h2>
              <button
                onClick={() => setOrgProposal(null)}
                aria-label="Fechar proposta"
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400">{orgProposal.resumo}</p>

            <div className="flex flex-col gap-3 overflow-y-auto scrollbar-thin pr-3">
              {orgProposal.carrosseis.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Nenhum carrossel novo proposto, apenas reordenação do grid.
                </p>
              )}
              {orgProposal.carrosseis.map((grupo, gi) => {
                const fotos = grupo.ids
                  .map(id => posts.find(p => p.id === id))
                  .filter((p): p is Post => p !== undefined)
                if (fotos.length === 0) return null
                return (
                  <div key={gi} className="border border-gray-200 dark:border-zinc-800 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                        Carrossel: {grupo.produto} ({fotos.length} fotos)
                      </p>
                      <button
                        onClick={() => removeProposalGroup(gi)}
                        aria-label="Descartar este carrossel"
                        title="Descartar este carrossel: as fotos continuam na grade, apenas separadas"
                        className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-white hover:bg-red-500 rounded transition-colors shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {fotos.map((p, i) => (
                        <div key={p.id} className="relative w-12 h-15 rounded overflow-hidden bg-gray-200 dark:bg-zinc-800">
                          <img src={p.imgs[0].src} alt="" className="w-full h-full object-cover" />
                          <span className="absolute top-0.5 left-0.5 px-1 bg-black/60 text-white text-[8px] rounded">
                            {i + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setOrgProposal(null)}
                className="flex-1 py-2 text-xs border border-gray-300 dark:border-zinc-700 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={applyProposal}
                className="flex-1 py-2 text-xs bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded hover:opacity-90 transition-opacity"
              >
                Aplicar organização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prévia de carrossel */}
      {previewPost && preview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPreview(null)
          }}
        >
          <div className="flex flex-col items-center gap-4 max-w-[520px] w-full">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-white/70">
                {preview.idx + 1}/{previewPost.imgs.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setPreview(null)
                    setEditId(previewPost.id)
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
                >
                  <Pencil size={11} />
                  Editar
                </button>
                <button
                  onClick={() => setPreview(null)}
                  aria-label="Fechar prévia"
                  className="p-1.5 text-white/70 hover:bg-white/10 rounded transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* largura limitada por 56vh para a proporção 4:5 nunca passar de ~70% da altura da tela */}
            <div className="relative mx-auto" style={{ width: 'min(100%, 56vh)' }}>
              <div className="w-full aspect-[4/5] bg-zinc-900 rounded overflow-hidden">
                {/* esteira horizontal: desliza como o carrossel real do Instagram */}
                <div
                  className="w-full h-full flex transition-transform duration-300 ease-out"
                  style={{ transform: `translateX(-${preview.idx * 100}%)` }}
                >
                  {previewUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt=""
                      draggable={false}
                      className="w-full h-full object-cover shrink-0"
                    />
                  ))}
                </div>
              </div>

              {preview.idx > 0 && (
                <button
                  onClick={() => stepPreview(-1)}
                  aria-label="Foto anterior"
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              {preview.idx < previewPost.imgs.length - 1 && (
                <button
                  onClick={() => stepPreview(1)}
                  aria-label="Próxima foto"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              )}
            </div>

            <div className="flex gap-1.5">
              {previewPost.imgs.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPreview(prev => (prev ? { ...prev, idx: i } : prev))}
                  aria-label={`Ir para foto ${i + 1}`}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === preview.idx ? 'bg-white' : 'bg-white/30 hover:bg-white/50'}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirmação para esvaziar o feed */}
      {confirmarLimpeza && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setConfirmarLimpeza(false)
          }}
        >
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-5 w-[360px] max-w-full flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-medium text-gray-900 dark:text-gray-50">
                Deseja remover todas as fotos?
              </h2>
              <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400">
                O feed fica vazio com {posts.length} {posts.length === 1 ? 'publicação' : 'publicações'} a menos. Não dá para desfazer.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setConfirmarLimpeza(false)}
                className="flex-1 py-2 text-xs border border-gray-300 dark:border-zinc-700 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Não
              </button>
              <button
                onClick={limparFeed}
                className="flex-1 py-2 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Sim, remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição de carrossel */}
      {editingPost && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeEdit()
          }}
        >
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-5 w-[420px] max-w-full max-h-[85vh] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-900 dark:text-gray-50">
                {editingPost.type === 'carousel'
                  ? `Carrossel ${editingPost.imgs.length}/10`
                  : 'Publicação'}
              </h2>
              <button
                onClick={closeEdit}
                aria-label="Fechar"
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Arraste para reordenar. A primeira imagem é a capa.
              {editingPost.type === 'single' && ' Adicione mais imagens para virar carrossel.'}
            </p>

            <div className="grid grid-cols-4 gap-2 overflow-y-auto">
              {editingPost.imgs.map((img, i) => (
                <div
                  key={`${editingPost.id}-${i}`}
                  draggable
                  onDragStart={(e) => {
                    modalDragIdxRef.current = i
                    e.dataTransfer.effectAllowed = 'move'
                    e.dataTransfer.setData('text/plain', String(i))
                  }}
                  onDragEnd={() => {
                    modalDragIdxRef.current = null
                    setModalDragOverIdx(null)
                  }}
                  onDragOver={(e) => {
                    if (modalDragIdxRef.current === null) return
                    e.preventDefault()
                    setModalDragOverIdx(i)
                  }}
                  onDragLeave={() => setModalDragOverIdx(prev => (prev === i ? null : prev))}
                  onDrop={(e) => {
                    if (modalDragIdxRef.current === null) return
                    e.preventDefault()
                    moveImgInPost(editingPost.id, modalDragIdxRef.current, i)
                    modalDragIdxRef.current = null
                    setModalDragOverIdx(null)
                  }}
                  className={`group relative aspect-square rounded overflow-hidden bg-gray-200 dark:bg-zinc-800 cursor-grab active:cursor-grabbing ${modalDragOverIdx === i ? 'ring-2 ring-gray-900 dark:ring-gray-100 ring-inset' : ''}`}
                >
                  <img src={img.src} alt="" draggable={false} className="w-full h-full object-cover" />
                  <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[9px] rounded">
                    {i + 1}
                  </span>
                  <button
                    onClick={() => removeImgFromPost(editingPost.id, i)}
                    aria-label="Remover imagem"
                    className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}

              {editingPost.imgs.length < 10 && (
                <button
                  onClick={() => carrInputRef.current?.click()}
                  aria-label="Adicionar imagens"
                  className="aspect-square rounded border border-dashed border-gray-300 dark:border-zinc-700 flex items-center justify-center text-gray-400 dark:text-zinc-600 hover:text-gray-500 dark:hover:text-zinc-500 hover:border-gray-400 dark:hover:border-zinc-600 transition-colors"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>

            {/* Agendamento */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Data e hora
                </label>
                <input
                  type="datetime-local"
                  value={paraCampoDataHora(editingPost.agendadoEm)}
                  onChange={(e) => atualizarAgendamento(editingPost.id, e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-transparent border border-gray-300 dark:border-zinc-700 rounded text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-500 dark:focus:border-zinc-500"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Status
                </label>
                <select
                  value={editingPost.status ?? 'rascunho'}
                  onChange={(e) => atualizarStatus(editingPost.id, e.target.value as StatusPost)}
                  className="w-full px-3 py-2 text-xs bg-transparent border border-gray-300 dark:border-zinc-700 rounded text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-500 dark:focus:border-zinc-500"
                >
                  {(Object.keys(STATUS_ROTULO) as StatusPost[]).map(s => (
                    <option key={s} value={s} className="text-gray-900">
                      {STATUS_ROTULO[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Legenda da publicação */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Legenda
              </label>
              <textarea
                value={editingPost.legenda ?? ''}
                onChange={(e) => atualizarLegenda(editingPost.id, e.target.value)}
                placeholder="Escreva a legenda desta publicação..."
                rows={4}
                className="w-full px-3 py-2 text-xs bg-transparent border border-gray-300 dark:border-zinc-700 rounded text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-500 dark:focus:border-zinc-500 resize-none"
              />
              <p className="text-[10px] text-gray-400 dark:text-zinc-600 mt-1 text-right">
                {(editingPost.legenda ?? '').length} caracteres
              </p>
            </div>

            <button
              onClick={closeEdit}
              className="w-full py-2 text-xs border border-gray-300 dark:border-zinc-700 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Concluir
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
