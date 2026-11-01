'use client'

import { ChangeEvent, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

const LIMITE_IMAGENS = 15
const TAMANHO_DO_LOTE = 4

const CAMPOS = ['Material', 'Acabamento', 'Cor', 'Trama', 'Aplicação'] as const
type Campo = (typeof CAMPOS)[number]

const HEX = /^#[0-9a-fA-F]{6}$/

type TagMaterial = {
  id: string
  campo: Campo
  valor: string
  hex?: string
  imagemIndex?: number
}

export type Material = {
  id: string
  nome: string
  descricao?: string
  imagens: string[]
  tags: TagMaterial[]
  criadoEm: string
}

const gerarId = () => Math.random().toString(36).slice(2, 10)

export const formatarDataHoraMaterial = (iso: string) => {
  if (!iso) return ''
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return ''
  return data.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

// imagem grande estoura o limite da requisição: entra redimensionada
const comprimir = (dataUrl: string, maximo: number, qualidade: number): Promise<string> =>
  new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      let { width: l, height: a } = img
      if (l > maximo || a > maximo) {
        if (l > a) { a = Math.round((a * maximo) / l); l = maximo }
        else { l = Math.round((l * maximo) / a); a = maximo }
      }
      const canvas = document.createElement('canvas')
      canvas.width = l
      canvas.height = a
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(dataUrl)
      ctx.drawImage(img, 0, 0, l, a)
      resolve(canvas.toDataURL('image/jpeg', qualidade))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })

// a análise recebe base64; imagem já salva chega como URL
const paraDataUrl = async (src: string): Promise<string> => {
  if (src.startsWith('data:')) return src
  try {
    const resposta = await fetch(src)
    const blob = await resposta.blob()
    return await new Promise<string>((resolve, reject) => {
      const leitor = new FileReader()
      leitor.onload = () => resolve(String(leitor.result ?? ''))
      leitor.onerror = () => reject(new Error('falha ao ler'))
      leitor.readAsDataURL(blob)
    })
  } catch {
    return src
  }
}

export function CadastroMaterial({ material: emEdicao, naNuvem, aoFechar, aoSalvar }: {
  // quando vem preenchido, a tela edita em vez de cadastrar
  material?: Material | null
  naNuvem: boolean
  aoFechar: () => void
  aoSalvar: (material: Material) => void
}) {
  const arquivoRef = useRef<HTMLInputElement>(null)

  const [nome, setNome] = useState(emEdicao?.nome ?? '')
  const [imagens, setImagens] = useState<string[]>(emEdicao?.imagens ?? [])
  const [tagsPorImagem, setTagsPorImagem] = useState<Map<number, TagMaterial[]>>(() => {
    const mapa = new Map<number, TagMaterial[]>()
    emEdicao?.imagens.forEach((_, i) => {
      mapa.set(i, (emEdicao.tags ?? []).filter(t => (t.imagemIndex ?? 0) === i))
    })
    return mapa
  })
  const [descricao, setDescricao] = useState(emEdicao?.descricao ?? '')
  const [analisando, setAnalisando] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [imagemComTags, setImagemComTags] = useState<number | null>(null)

  const anexar = (evento: ChangeEvent<HTMLInputElement>) => {
    const arquivos = Array.from(evento.target.files ?? [])
    if (arquivos.length === 0) return

    const restantes = LIMITE_IMAGENS - imagens.length
    const escolhidos = arquivos.slice(0, Math.max(0, restantes))

    Promise.all(escolhidos.map(file => new Promise<string>((resolve, reject) => {
      const leitor = new FileReader()
      leitor.onload = () => resolve(String(leitor.result ?? ''))
      leitor.onerror = () => reject(new Error('falha ao ler'))
      leitor.readAsDataURL(file)
    })))
      .then(lidas => Promise.all(lidas.map(src => comprimir(src, 1600, 0.85))))
      .then(novas => {
        setImagens(prev => [...prev, ...novas].slice(0, LIMITE_IMAGENS))
        setTagsPorImagem(new Map())
        setDescricao('')
      })
      .catch(() => setErro('Não foi possível carregar todas as imagens.'))

    if (arquivoRef.current) arquivoRef.current.value = ''
  }

  const analisar = async () => {
    if (!nome.trim()) return setErro('Dê um nome ao material antes de analisar.')
    if (imagens.length === 0) return setErro('Anexe pelo menos uma imagem.')

    setAnalisando(true)
    setProgresso(0)
    setErro('')

    try {
      const originais = await Promise.all(imagens.map(paraDataUrl))
      const previas = await Promise.all(originais.map(src => comprimir(src, 1000, 0.7)))
      const mapa = new Map<number, TagMaterial[]>()
      let resumo = ''

      for (let inicio = 0; inicio < previas.length; inicio += TAMANHO_DO_LOTE) {
        const lote = previas.slice(inicio, inicio + TAMANHO_DO_LOTE)

        const r = await fetch('/api/materiais/analise', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: nome.trim(), fotos: lote.map(src => ({ src })) })
        })
        const dados = await r.json()
        if (!r.ok) throw new Error(dados?.error || 'Erro ao analisar o material.')

        if (!resumo && dados.descricao) resumo = String(dados.descricao)

        ;(dados.imagens ?? []).forEach((item: { imagemIndex?: number; tags?: TagMaterial[] }, i: number) => {
          // o índice pode voltar começando em 1: fora da faixa, vale a ordem
          const devolvido = item.imagemIndex
          const dentroDaFaixa = typeof devolvido === 'number' && devolvido >= 0 && devolvido < lote.length
          const posicao = inicio + (dentroDaFaixa ? (devolvido as number) : i)
          const tags = (item.tags ?? [])
            .filter(t => t?.campo && t?.valor)
            .map((t, j) => ({
              id: `${t.campo}-${j}-${gerarId()}`,
              campo: t.campo,
              valor: t.valor,
              hex: t.hex && HEX.test(t.hex) ? t.hex.toUpperCase() : undefined,
              imagemIndex: posicao
            }))
          mapa.set(posicao, tags)
        })

        setProgresso(Math.min(inicio + lote.length, previas.length))
      }

      setTagsPorImagem(mapa)
      setDescricao(resumo)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao analisar as imagens.')
    } finally {
      setAnalisando(false)
    }
  }

  const analisado = tagsPorImagem.size > 0

  const salvar = async () => {
    if (!analisado) return
    setSalvando(true)
    setErro('')

    const tags = [...tagsPorImagem.values()].flat()
    const novo: Material = {
      id: emEdicao?.id ?? gerarId(),
      nome: nome.trim(),
      descricao,
      imagens,
      tags,
      criadoEm: new Date().toISOString()
    }

    try {
      const r = await fetch('/api/materiais', {
        method: emEdicao ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          emEdicao
            ? { id: emEdicao.id, nome: novo.nome, descricao, imagens, tags }
            : { nome: novo.nome, descricao, imagens, tags }
        )
      })
      const salvo = await r.json()
      if (!r.ok) throw new Error(salvo?.error || 'Falha ao salvar no Supabase.')

      aoSalvar({
        ...novo,
        ...salvo.item,
        id: emEdicao?.id ?? salvo.item?.id ?? novo.id,
        criadoEm: salvo.item?.criado_em ?? emEdicao?.criadoEm ?? novo.criadoEm
      })
      aoFechar()
    } catch (e) {
      aoSalvar(novo)
      setErro(e instanceof Error ? `Salvo só nesta tela: ${e.message}` : 'Salvo só nesta tela.')
    } finally {
      setSalvando(false)
    }
  }

  const paleta = useMemo(() => {
    const cores = new Map<string, string>()
    ;[...tagsPorImagem.values()].flat().forEach(tag => {
      if (tag.hex && !cores.has(tag.hex)) cores.set(tag.hex, tag.valor)
    })
    return [...cores.entries()]
  }, [tagsPorImagem])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) aoFechar() }}
    >
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-xl border border-gray-100 bg-white text-left shadow-xl">
        <div className="flex items-center justify-end gap-3 border-b border-gray-100 px-6 pt-4 pb-3">
          {!naNuvem && (
            <span
              title="Rode migrations_materiais.sql no Supabase para guardar na nuvem."
              className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[10px] text-amber-700"
            >
              Salvo só nesta tela
            </span>
          )}
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto scrollbar-thin px-6 pt-4 pb-6">
          <h2 className="text-[26px] font-semibold leading-tight text-black">
            {emEdicao ? 'Editar material' : 'Materiais'}
          </h2>

          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-gray-500">
              Nome do material <span className="text-red-600">*</span>
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Veludo canelado verde"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-black outline-none focus:border-black placeholder-gray-400"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500">
              Imagens
              <span className="normal-case tracking-normal text-gray-400">
                {imagens.length}/{LIMITE_IMAGENS}
              </span>
            </label>

            <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 px-4 py-5 text-center transition-colors hover:bg-gray-50">
              <span className="text-xs font-medium text-gray-700">
                Clique para anexar até {LIMITE_IMAGENS} imagens
              </span>
              <span className="text-[10px] text-gray-400">JPG, PNG, WEBP</span>
              <input
                ref={arquivoRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={anexar}
              />
            </label>

            {imagens.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {imagens.map((imagem, i) => {
                  const tags = tagsPorImagem.get(i) ?? []
                  return (
                    <div key={`${i}-${imagem.slice(-10)}`} className="relative overflow-hidden rounded-lg border border-gray-200">
                      <img src={imagem} alt="" className="aspect-square w-full object-cover" />

                      <button
                        type="button"
                        onClick={() => {
                          setImagens(prev => prev.filter((_, j) => j !== i))
                          // as tags acompanham: some a da removida e as seguintes sobem
                          setTagsPorImagem(prev => {
                            const mapa = new Map<number, TagMaterial[]>()
                            let destino = 0
                            for (let origem = 0; origem < imagens.length; origem++) {
                              if (origem === i) continue
                              const tags = prev.get(origem) ?? []
                              mapa.set(destino, tags.map(t => ({ ...t, imagemIndex: destino })))
                              destino++
                            }
                            return mapa
                          })
                          setImagemComTags(null)
                        }}
                        aria-label="Remover imagem"
                        className="absolute right-1.5 top-1.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white transition-colors hover:bg-black"
                      >
                        ×
                      </button>

                      {tags.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setImagemComTags(i)}
                          aria-label="Ver tags da imagem"
                          className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-black"
                        >
                          <Search size={11} />
                          {tags.length}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {descricao && (
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-700">{descricao}</p>
              {paleta.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {paleta.map(([hex, nomeCor]) => (
                    <span key={hex} className="flex items-center gap-1 text-[10px] text-gray-600">
                      <span className="h-3 w-3 rounded-full border border-gray-200" style={{ backgroundColor: hex }} />
                      {nomeCor}
                      <span className="font-mono text-gray-400">{hex}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {erro && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
              {erro}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={analisar}
              disabled={analisando || imagens.length === 0 || !nome.trim()}
              className="rounded-lg bg-black px-5 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {analisando
                ? `Analisando ${progresso}/${imagens.length}...`
                : emEdicao ? 'Analisar de novo' : 'Analisar'}
            </button>

            <button
              type="button"
              onClick={salvar}
              disabled={!analisado || salvando}
              className="rounded-lg border border-gray-300 px-5 py-2 text-xs font-medium text-gray-800 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {salvando ? 'Salvando...' : emEdicao ? 'Salvar alterações' : 'Salvar material'}
            </button>
          </div>

        </div>
      </div>

      {/* tags de uma imagem */}
      {imagemComTags !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setImagemComTags(null) }}
        >
          <div className="w-full max-w-lg rounded-xl border border-gray-100 bg-white shadow-2xl">
            <div className="flex items-start justify-between px-6 pt-5 pb-4">
              <div>
                <h3 className="text-sm font-semibold text-black">Tags do material</h3>
                <p className="mt-0.5 text-[10px] text-gray-400">
                  Imagem {imagemComTags + 1} de {imagens.length}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setImagemComTags(null)}
                aria-label="Fechar"
                className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex gap-5 px-6 pb-6">
              <img src={imagens[imagemComTags]} alt="" className="aspect-square w-32 shrink-0 rounded-lg object-cover" />

              <div className="min-w-0 flex-1 space-y-2">
                {CAMPOS.map(campo => {
                  const doCampo = (tagsPorImagem.get(imagemComTags) ?? []).filter(t => t.campo === campo)
                  if (doCampo.length === 0) return null
                  return (
                    <div key={campo} className="flex gap-2 text-xs">
                      <span className="w-24 shrink-0 text-gray-400">{campo}</span>
                      <span className="flex min-w-0 flex-wrap items-center gap-1.5 text-gray-800">
                        {doCampo.map(tag => (
                          <span key={tag.id} className="flex items-center gap-1">
                            {tag.hex && (
                              <span className="h-3 w-3 rounded-full border border-gray-200" style={{ backgroundColor: tag.hex }} />
                            )}
                            {tag.valor}
                          </span>
                        ))}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
