'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Building2, Cake, Camera, ChevronLeft, Plus, Tag, Layers, Package, X } from 'lucide-react'
import { Pilula } from '@/components/marketing/Pilula'
import { BlocosDeSugestao, filtrarBlocos, marcarVarios } from '@/components/marketing/BlocosDeSugestao'
import {
  SEGMENTOS, gruposSugeridos, marcasSugeridas, produtosSugeridos, tituloCurto,
  gruposPorCategoria, marcasPorCategoria, produtosPorGrupo, type BlocoSugestao
} from '@/lib/marketing/segmentos'

export interface CadastroMarketing {
  nome: string
  aniversario: string        // dia e mês, no formato DD/MM
  categoriaIds: string[]     // a empresa pode ter várias categorias
  categoriaNomes: string[]
  logo: string               // dataURL da imagem
  grupos: string[]
  produtos: string[]
  marcas: string[]
  // os mesmos grupos e marcas, agrupados pelas categorias da loja,
  // para as telas seguintes mostrarem a escolha do jeito que foi feita
  blocosGrupos: BlocoSugestao[]
  blocosMarcas: BlocoSugestao[]
}

const TOTAL_ETAPAS = 4

const TITULOS: Record<number, string> = {
  1: 'Cadastro da empresa',
  2: 'Grupos de produtos',
  3: 'Marcas',
  4: 'Produtos'
}

// aceita só números e monta o formato DD/MM enquanto o cliente digita
const formatarDiaMes = (texto: string) => {
  const digitos = texto.replace(/\D/g, '').slice(0, 4)
  return digitos.length <= 2 ? digitos : `${digitos.slice(0, 2)}/${digitos.slice(2)}`
}

const DIA_MES = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])$/

// reduz a logo para não carregar uma imagem gigante na memória
const comprimirImagem = (file: File, max = 300): Promise<string> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      let w = img.width, h = img.height
      if (w > max || h > max) {
        if (w > h) { h = Math.round((h * max) / w); w = max }
        else { w = Math.round((w * max) / h); h = max }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')?.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Não foi possível ler a imagem'))
    }
    img.src = url
  })

export function OnboardingTrilha({ aberta, aoFechar, aoConcluir }: {
  aberta: boolean
  aoFechar: () => void
  aoConcluir: (cadastro: CadastroMarketing) => void
}) {
  const [etapa, setEtapa] = useState(1)

  // ao trocar de etapa a leitura recomeça do topo
  const conteudoRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    conteudoRef.current?.scrollTo({ top: 0 })
  }, [etapa, aberta])

  // etapa 1
  const [nome, setNome] = useState('')
  const [aniversario, setAniversario] = useState('')
  const [categoriaIds, setCategoriaIds] = useState<string[]>([])
  const [logo, setLogo] = useState('')
  const [erroLogo, setErroLogo] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // etapas 2, 3 e 4
  const [grupos, setGrupos] = useState<string[]>([])
  const [gruposExtras, setGruposExtras] = useState<string[]>([])
  const [novoGrupo, setNovoGrupo] = useState('')
  const [produtos, setProdutos] = useState<string[]>([])
  const [produtosExtras, setProdutosExtras] = useState<string[]>([])
  const [novoProduto, setNovoProduto] = useState('')
  const [marcas, setMarcas] = useState<string[]>([])
  // marca digitada guarda em quais categorias do cliente ela entra
  const [marcasExtras, setMarcasExtras] = useState<{ nome: string; categorias: string[] }[]>([])
  const [novaMarca, setNovaMarca] = useState('')
  // pop-up que pergunta a categoria da marca digitada
  const [marcaPendente, setMarcaPendente] = useState<string | null>(null)
  const [categoriasDaMarca, setCategoriasDaMarca] = useState<string[]>([])

  const categoriasNomes = categoriaIds
    .map(id => SEGMENTOS.find(s => s.id === id)?.nome)
    .filter((n): n is string => Boolean(n))

  // a etapa seguinte só libera quando a anterior está preenchida
  // o aniversário é opcional, mas se preenchido precisa ser um dia e mês válidos
  const aniversarioValido = aniversario === '' || DIA_MES.test(aniversario)
  const etapa1Ok =
    nome.trim().length > 0 && categoriaIds.length > 0 && logo !== '' && aniversarioValido
  const etapa2Ok = grupos.length > 0
  const etapa3Ok = marcas.length > 0
  const etapa4Ok = produtos.length > 0
  const podeAvancar = [etapa1Ok, etapa2Ok, etapa3Ok, etapa4Ok][etapa - 1]

  // sugestões separadas por categoria, mais o bloco do que foi digitado
  const blocosGrupos = useMemo<BlocoSugestao[]>(() => {
    const blocos = gruposPorCategoria(categoriaIds)
    return gruposExtras.length > 0
      ? [...blocos, { id: 'extras', titulo: 'Adicionados por você', itens: gruposExtras }]
      : blocos
  }, [categoriaIds, gruposExtras])

  const blocosProdutos = useMemo<BlocoSugestao[]>(() => {
    const blocos = produtosPorGrupo(grupos)
    return produtosExtras.length > 0
      ? [...blocos, { id: 'extras', titulo: 'Adicionados por você', itens: produtosExtras }]
      : blocos
  }, [grupos, produtosExtras])

  // as marcas digitadas entram no bloco da categoria escolhida pelo cliente
  const blocosMarcas = useMemo<BlocoSugestao[]>(() => {
    const porCategoria = new Map<string, string[]>()
    marcasPorCategoria(categoriaIds, grupos).forEach(b => porCategoria.set(b.id, [...b.itens]))

    marcasExtras.forEach(extra => {
      extra.categorias.forEach(catId => {
        const lista = porCategoria.get(catId) ?? []
        if (!lista.includes(extra.nome)) lista.push(extra.nome)
        porCategoria.set(catId, lista)
      })
    })

    return categoriaIds
      .filter(id => (porCategoria.get(id)?.length ?? 0) > 0)
      .map(id => ({ id, titulo: tituloCurto(id), itens: porCategoria.get(id)! }))
  }, [categoriaIds, grupos, marcasExtras])

  const opcoesGrupos = useMemo(
    () => blocosGrupos.flatMap(b => b.itens),
    [blocosGrupos]
  )
  const opcoesProdutos = useMemo(
    () => blocosProdutos.flatMap(b => b.itens),
    [blocosProdutos]
  )
  const opcoesMarcas = useMemo(
    () => blocosMarcas.flatMap(b => b.itens),
    [blocosMarcas]
  )

  // descarta o que deixou de existir depois de uma mudança nas escolhas
  const podarDependentes = (
    idsCategorias: string[],
    gruposMantidos: string[]
  ) => {
    const produtosValidos = [...produtosSugeridos(gruposMantidos), ...produtosExtras]
    setProdutos(prev => prev.filter(p => produtosValidos.includes(p)))

    const marcasValidas = [
      ...marcasSugeridas(idsCategorias, gruposMantidos),
      ...marcasExtras.filter(e => e.categorias.some(c => idsCategorias.includes(c))).map(e => e.nome)
    ]
    setMarcas(prev => prev.filter(m => marcasValidas.includes(m)))
  }

  // ao mexer nas categorias, mantém só o que ainda faz sentido
  const alternarCategoria = (id: string) => {
    const novas = categoriaIds.includes(id)
      ? categoriaIds.filter(c => c !== id)
      : [...categoriaIds, id]
    setCategoriaIds(novas)

    const gruposValidos = [...gruposSugeridos(novas), ...gruposExtras]
    const gruposMantidos = grupos.filter(g => gruposValidos.includes(g))
    setGrupos(gruposMantidos)
    podarDependentes(novas, gruposMantidos)
  }

  // marcar ou limpar um bloco inteiro de grupos
  const marcarGrupos = (itens: string[], marcar: boolean) => {
    const novos = marcarVarios(itens, marcar, grupos)
    setGrupos(novos)
    podarDependentes(categoriaIds, novos)
  }

  // desmarcar um grupo também tira os produtos que vinham dele
  const alternarGrupo = (grupo: string) => {
    const novos = grupos.includes(grupo)
      ? grupos.filter(g => g !== grupo)
      : [...grupos, grupo]
    setGrupos(novos)
    podarDependentes(categoriaIds, novos)
  }

  const alternar = (
    valor: string,
    lista: string[],
    definir: (l: string[]) => void
  ) => definir(lista.includes(valor) ? lista.filter(v => v !== valor) : [...lista, valor])

  const adicionarGrupo = () => {
    const valor = novoGrupo.trim()
    if (!valor || opcoesGrupos.includes(valor)) return setNovoGrupo('')
    setGruposExtras(prev => [...prev, valor])
    setGrupos(prev => [...prev, valor])
    setNovoGrupo('')
  }

  const adicionarProduto = () => {
    const valor = novoProduto.trim()
    if (!valor || opcoesProdutos.includes(valor)) return setNovoProduto('')
    setProdutosExtras(prev => [...prev, valor])
    setProdutos(prev => [...prev, valor])
    setNovoProduto('')
  }

  // salvar abre o pop-up para dizer em qual categoria a marca entra
  const abrirCategoriasDaMarca = () => {
    const valor = novaMarca.trim()
    if (!valor || opcoesMarcas.includes(valor)) return setNovaMarca('')
    setCategoriasDaMarca(categoriaIds.length === 1 ? [...categoriaIds] : [])
    setMarcaPendente(valor)
  }

  const confirmarMarca = () => {
    if (!marcaPendente || categoriasDaMarca.length === 0) return
    setMarcasExtras(prev => [...prev, { nome: marcaPendente, categorias: categoriasDaMarca }])
    setMarcas(prev => [...prev, marcaPendente])
    setNovaMarca('')
    setMarcaPendente(null)
    setCategoriasDaMarca([])
  }

  const cancelarMarca = () => {
    setMarcaPendente(null)
    setCategoriasDaMarca([])
  }

  const escolherLogo = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    try {
      setLogo(await comprimirImagem(file))
      setErroLogo(null)
    } catch {
      setErroLogo('Não foi possível ler esta imagem. Tente outra.')
    }
  }

  const concluir = () => {
    aoConcluir({
      nome: nome.trim(),
      aniversario,
      categoriaIds,
      categoriaNomes: categoriasNomes,
      logo,
      grupos,
      produtos,
      marcas,
      blocosGrupos: filtrarBlocos(blocosGrupos, grupos),
      blocosMarcas: filtrarBlocos(blocosMarcas, marcas)
    })
  }

  // fechado apenas deixa de aparecer: o componente segue montado,
  // então tudo que já foi preenchido continua salvo
  if (!aberta) return null

  // pop-up menor: em qual categoria a marca digitada entra
  const popupCategorias = marcaPendente && (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) cancelarMarca()
      }}
    >
      <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl border border-gray-100 text-left">
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-black truncate">{marcaPendente}</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Em qual categoria entra esta marca?
            </p>
          </div>
          <button
            type="button"
            onClick={cancelarMarca}
            aria-label="Cancelar"
            className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded transition-colors shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-5 pb-4 flex flex-wrap gap-2 max-h-56 overflow-y-auto scrollbar-thin">
          {categoriaIds.map(id => (
            <Pilula
              key={id}
              texto={SEGMENTOS.find(s => s.id === id)?.nome ?? id}
              ativo={categoriasDaMarca.includes(id)}
              aoClicar={() => alternar(id, categoriasDaMarca, setCategoriasDaMarca)}
            />
          ))}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={confirmarMarca}
            disabled={categoriasDaMarca.length === 0}
            className="px-5 py-2 text-xs font-medium bg-black hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {/* text-left: a página de Marketing centraliza o conteúdo e isso
          vazava para dentro do pop-up */}
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-xl border border-gray-100 text-left">

        {/* Cabeçalho com o progresso da trilha */}
        <div className="px-6 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-end gap-3 mb-2">
            <span className="text-[10px] text-gray-400">
              Etapa {etapa} de {TOTAL_ETAPAS}
            </span>
            <button
              type="button"
              onClick={aoFechar}
              aria-label="Fechar"
              title="Fechar. O que você preencheu fica salvo."
              className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_ETAPAS }).map((_, i) => (
              <span
                key={i}
                className={`h-[3px] flex-1 rounded-full transition-colors ${
                  i + 1 <= etapa ? 'bg-black' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* nas etapas seguintes, a empresa preenchida fica visível */}
          {etapa > 1 && (
            <div className="flex items-center gap-2 mt-2.5">
              {logo && <img src={logo} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />}
              <span className="text-xs font-medium text-black shrink-0">{nome}</span>
              <span className="text-[10px] text-gray-400 truncate">{categoriasNomes.join(', ')}</span>
            </div>
          )}
        </div>

        <div ref={conteudoRef} className="px-6 pt-4 pb-5 overflow-y-auto scrollbar-thin flex-1">

          {/* nome da etapa, logo abaixo da linha do cabeçalho */}
          <h2 className="text-[26px] leading-tight font-semibold text-black mb-4">{TITULOS[etapa]}</h2>

          {/* Etapa 1: dados da empresa */}
          {etapa === 1 && (
            <div className="space-y-4">
              {/* logo ao lado do nome, como um perfil */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  title="Escolher a logo"
                  className="group relative w-14 h-14 rounded-full bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center"
                >
                  {logo
                    ? <img src={logo} alt="" className="w-full h-full object-cover" />
                    : <Camera size={16} className="text-gray-400" />}
                  <span className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera size={14} />
                  </span>
                </button>

                <div className="flex-1 min-w-0">
                  {/* nome e aniversário dividem a mesma linha */}
                  <div className="flex gap-2">
                    <div className="relative flex items-center flex-1 min-w-0">
                      <Building2 size={14} className="absolute left-3 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Nome da empresa"
                        autoFocus
                        className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-black placeholder-gray-400 text-black"
                      />
                    </div>
                    <div className="relative flex items-center w-52 shrink-0">
                      <Cake size={14} className="absolute left-3 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={aniversario}
                        onChange={(e) => setAniversario(formatarDiaMes(e.target.value))}
                        placeholder="Dia e mês do aniversário"
                        title="Data de aniversário da empresa"
                        className={`w-full pl-9 pr-3 py-2 text-xs border rounded-lg focus:outline-none placeholder-gray-400 text-black ${
                          aniversarioValido
                            ? 'border-gray-200 focus:border-black'
                            : 'border-red-300 focus:border-red-500'
                        }`}
                      />
                    </div>
                  </div>
                  <p className={`text-[10px] mt-1 ${erroLogo || !aniversarioValido ? 'text-red-600' : 'text-gray-400'}`}>
                    {erroLogo
                      ?? (!aniversarioValido
                        ? 'Aniversário no formato dia/mês, como 05/11.'
                        : logo ? 'Logo carregada. Clique nela para trocar.' : 'Adicione a logo para foto do perfil')}
                  </p>
                </div>

                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    escolherLogo(e.target.files)
                    e.target.value = ''
                  }}
                />
              </div>

              <div>
                <label className="flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">
                  Categorias
                  <span className="normal-case tracking-normal text-gray-400">
                    {categoriaIds.length > 0
                      ? `${categoriaIds.length} selecionada${categoriaIds.length > 1 ? 's' : ''}`
                      : 'Escolha quantas precisar'}
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {SEGMENTOS.map(seg => (
                    <Pilula
                      key={seg.id}
                      texto={seg.nome}
                      ativo={categoriaIds.includes(seg.id)}
                      aoClicar={() => alternarCategoria(seg.id)}
                    />
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Etapa 2: grupos de produtos */}
          {etapa === 2 && (
            <div className="space-y-5">
              {/* os blocos começam logo abaixo da linha do cabeçalho */}
              <BlocosDeSugestao
                blocos={blocosGrupos}
                selecionados={grupos}
                aoAlternar={alternarGrupo}
                aoMarcarBloco={marcarGrupos}
              />

              <div className="flex gap-2">
                <div className="relative flex items-center flex-1">
                  <Layers size={13} className="absolute left-3 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={novoGrupo}
                    onChange={(e) => setNovoGrupo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        adicionarGrupo()
                      }
                    }}
                    placeholder="Adicionar outro grupo..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-full focus:outline-none focus:border-black placeholder-gray-400 text-black"
                  />
                </div>
                <button
                  type="button"
                  onClick={adicionarGrupo}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1"
                >
                  <Plus size={13} />
                  Adicionar
                </button>
              </div>
            </div>
          )}

          {/* Etapa 4: produtos de cada grupo */}
          {etapa === 4 && (
            <div className="space-y-5">
              {opcoesProdutos.length === 0 ? (
                <p className="text-xs text-gray-400">
                  Nenhuma sugestão para estes grupos. Adicione os produtos abaixo.
                </p>
              ) : (
                <BlocosDeSugestao
                  blocos={blocosProdutos}
                  selecionados={produtos}
                  aoAlternar={(produto) => alternar(produto, produtos, setProdutos)}
                  aoMarcarBloco={(itens, marcar) => setProdutos(marcarVarios(itens, marcar, produtos))}
                />
              )}

              <div className="flex gap-2">
                <div className="relative flex items-center flex-1">
                  <Package size={13} className="absolute left-3 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={novoProduto}
                    onChange={(e) => setNovoProduto(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        adicionarProduto()
                      }
                    }}
                    placeholder="Adicionar outro produto..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-full focus:outline-none focus:border-black placeholder-gray-400 text-black"
                  />
                </div>
                <button
                  type="button"
                  onClick={adicionarProduto}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1"
                >
                  <Plus size={13} />
                  Adicionar
                </button>
              </div>
            </div>
          )}

          {/* Etapa 3: marcas */}
          {etapa === 3 && (
            <div className="space-y-5">
              {opcoesMarcas.length === 0 ? (
                <p className="text-xs text-gray-400">
                  Nenhuma sugestão para estes grupos. Adicione as marcas abaixo.
                </p>
              ) : (
                <BlocosDeSugestao
                  blocos={blocosMarcas}
                  selecionados={marcas}
                  aoAlternar={(marca) => alternar(marca, marcas, setMarcas)}
                  aoMarcarBloco={(itens, marcar) => setMarcas(marcarVarios(itens, marcar, marcas))}
                />
              )}

              <div className="flex gap-2">
                <div className="relative flex items-center flex-1">
                  <Tag size={13} className="absolute left-3 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={novaMarca}
                    onChange={(e) => setNovaMarca(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        abrirCategoriasDaMarca()
                      }
                    }}
                    placeholder="Digite uma marca específica..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-full focus:outline-none focus:border-black placeholder-gray-400 text-black"
                  />
                </div>
                <button
                  type="button"
                  onClick={abrirCategoriasDaMarca}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1"
                >
                  <Plus size={13} />
                  Salvar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
          {etapa > 1 && (
            <button
              type="button"
              onClick={() => setEtapa(e => e - 1)}
              className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={14} />
              Voltar
            </button>
          )}
          <div className="flex-1" />
          {etapa < TOTAL_ETAPAS ? (
            <button
              type="button"
              onClick={() => setEtapa(e => e + 1)}
              disabled={!podeAvancar}
              className="px-5 py-2 text-xs font-medium bg-black hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Continuar
            </button>
          ) : (
            <button
              type="button"
              onClick={concluir}
              disabled={!etapa4Ok}
              className="px-5 py-2 text-xs font-medium bg-black hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Concluir
            </button>
          )}
        </div>
      </div>

      {popupCategorias}
    </div>
  )
}
