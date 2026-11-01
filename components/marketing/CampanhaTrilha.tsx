'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Camera, ChevronDown, ChevronLeft, Megaphone, MessageCircle, Music2,
  Percent, Users, X, type LucideIcon
} from 'lucide-react'
import { Pilula } from '@/components/marketing/Pilula'
import { BlocosDeSugestao, filtrarBlocos, marcarVarios } from '@/components/marketing/BlocosDeSugestao'
import { produtosPorGrupo, type BlocoSugestao } from '@/lib/marketing/segmentos'
import {
  ACOES_COLECAO, CANAIS, CANAIS_PADRAO, CATEGORIAS_ROUPAS, FORMATOS_PROMOCAO,
  OBJETIVOS, OBJETIVOS_ROUPAS, PERCENTUAIS, formatosDoCanal, formatosPadrao,
  idFormato, sugerirCampanhas, type Campanha, type DescontoCampanha
} from '@/lib/marketing/campanhas'
import type { CadastroMarketing } from '@/components/marketing/OnboardingTrilha'

const TOTAL_ETAPAS = 3

// o lucide desta versão não traz ícones de marca, então usamos equivalentes
const ICONE_CANAL: Record<string, LucideIcon> = {
  instagram: Camera,
  facebook: Users,
  whatsapp: MessageCircle,
  tiktok: Music2
}

const uid = () => Math.random().toString(36).slice(2, 10)

const hojeISO = () => new Date().toISOString().slice(0, 10)

const plural = (n: number, singular: string, plural: string) =>
  `${n} ${n === 1 ? singular : plural}`

// moldura dos pop-ups pequenos. No modo compacto a caixa se ajusta ao
// conteúdo, para a pergunta do desconto ficar só com os botões.
// fica fora do componente para o campo de digitar não perder o foco a cada tecla
function PopupPequeno({ titulo, descricao, aoSair, children, rodape, compacto }: {
  titulo: string
  descricao: string
  aoSair: () => void
  children: React.ReactNode
  rodape?: React.ReactNode
  compacto?: boolean
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) aoSair()
      }}
    >
      <div className={`bg-white rounded-xl w-full shadow-2xl border border-gray-100 text-left flex flex-col ${
        compacto ? 'max-w-[320px]' : 'max-w-sm'
      }`}>
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-black truncate">{titulo}</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">{descricao}</p>
          </div>
          <button
            type="button"
            onClick={aoSair}
            aria-label="Fechar"
            className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded transition-colors shrink-0"
          >
            <X size={15} />
          </button>
        </div>
        <div className={compacto ? 'px-5 pb-5' : 'px-5 pb-4 h-[304px] overflow-y-auto scrollbar-thin'}>
          {children}
        </div>
        {rodape && (
          <div className="px-5 h-14 border-t border-gray-100 flex items-center justify-end">
            {rodape}
          </div>
        )}
      </div>
    </div>
  )
}

export function CampanhaTrilha({
  aberta, tipo, cadastro, campanha, campanhasIds, campanhasNomes, aoFechar, aoConcluir
}: {
  aberta: boolean
  tipo: 'campanha' | 'acao'
  cadastro: CadastroMarketing
  // ao abrir pelo cartão, a trilha volta preenchida para revisão
  campanha?: Campanha | null
  // campanhas escolhidas antes de abrir a trilha de ação
  campanhasIds?: string[]
  campanhasNomes?: string[]
  aoFechar: () => void
  aoConcluir: (campanha: Campanha) => void
}) {
  const rotulo = tipo === 'acao' ? 'ação' : 'campanha'

  const TITULOS: Record<number, string> = {
    1: tipo === 'acao' ? 'Dados da ação' : 'Dados da campanha',
    2: `Objetivo da ${rotulo}`,
    3: `Veiculação da ${rotulo}`
  }

  const [etapa, setEtapa] = useState(1)

  // ao trocar de etapa a leitura recomeça do topo
  const conteudoRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    conteudoRef.current?.scrollTo({ top: 0 })
  }, [etapa, aberta])

  // etapa 1: preenchida com a campanha, quando veio do cartão
  const [nome, setNome] = useState(campanha?.nome ?? '')
  const [inicio, setInicio] = useState(campanha?.inicio ?? hojeISO())
  const [fim, setFim] = useState(campanha?.fim ?? '')
  const [escopoGrupos, setEscopoGrupos] = useState<'loja' | 'selecao'>(
    campanha?.escopoGrupos ?? 'loja'
  )
  const [grupos, setGrupos] = useState<string[]>(
    campanha?.escopoGrupos === 'selecao' ? campanha.grupos : []
  )
  const [produtos, setProdutos] = useState<string[]>(
    campanha?.escopoGrupos === 'selecao' ? campanha.produtos : []
  )
  const [escopoMarcas, setEscopoMarcas] = useState<'todas' | 'selecao'>(
    campanha?.escopoMarcas ?? 'todas'
  )
  const [marcas, setMarcas] = useState<string[]>(
    campanha?.escopoMarcas === 'selecao' ? campanha.marcas : []
  )

  // etapa 2
  const [objetivo, setObjetivo] = useState(campanha?.objetivo ?? '')
  const [objetivosSelecionados, setObjetivosSelecionados] = useState<string[]>(() =>
    campanha?.objetivo ? campanha.objetivo.split(' · ') : []
  )
  const [acoesColecaoSelecionadas, setAcoesColecaoSelecionadas] = useState<string[]>([])
  const [outroObjetivo, setOutroObjetivo] = useState('')
  const [desconto, setDesconto] = useState<DescontoCampanha | null>(campanha?.desconto ?? null)
  const [popup, setPopup] = useState<'pergunta' | 'desconto' | null>(null)
  // a pergunta do desconto aparece sozinha uma única vez
  const [jaPerguntouDesconto, setJaPerguntouDesconto] = useState(Boolean(campanha))
  const [percentual, setPercentual] = useState('')
  const [percentualLivre, setPercentualLivre] = useState('')
  const [formatoPromo, setFormatoPromo] = useState('')

  const blocosObjetivos = useMemo(() => {
    const ids = cadastro.categoriaIds.map(id => id.toLowerCase())
    return ids.some(id => CATEGORIAS_ROUPAS.has(id)) ? OBJETIVOS_ROUPAS : OBJETIVOS
  }, [cadastro.categoriaIds])

  // etapa 3: os canais do dia a dia já vêm marcados
  const [canais, setCanais] = useState<string[]>(campanha?.canais ?? CANAIS_PADRAO)
  const [formatos, setFormatos] = useState<string[]>(
    campanha?.formatos ?? CANAIS_PADRAO.flatMap(formatosPadrao)
  )
  // canal que abriu a lista de formatos: aparece primeiro
  const [formatosDe, setFormatosDe] = useState<string | null>(null)
  // acordeão manual: só fecha quando o usuário clica no cabeçalho
  const [abertos, setAbertos] = useState<string[]>(campanha?.canais ?? CANAIS_PADRAO)

  const alternar = (valor: string, lista: string[], definir: (l: string[]) => void) =>
    definir(lista.includes(valor) ? lista.filter(v => v !== valor) : [...lista, valor])

  // a partir de 3 letras, sugere as campanhas que já vêm cadastradas
  const sugestoesNome = useMemo(() => {
    const sugestoes = sugerirCampanhas(nome)
    // some quando o nome já é exatamente uma das sugestões
    return sugestoes.length === 1 && sugestoes[0] === nome.trim() ? [] : sugestoes
  }, [nome])

  // produtos do cadastro que pertencem aos grupos que a campanha alcança
  const blocosProdutos = useMemo<BlocoSugestao[]>(
    () => filtrarBlocos(produtosPorGrupo(grupos), cadastro.produtos),
    [grupos, cadastro.produtos]
  )

  const periodoValido = inicio !== '' && fim !== '' && fim >= inicio
  const escopoOk = escopoGrupos === 'loja' || grupos.length > 0
  const marcasOk = escopoMarcas === 'todas' || marcas.length > 0
  const etapa1Ok = nome.trim().length > 0 && periodoValido && escopoOk && marcasOk
  const objetivoColecaoNova = objetivosSelecionados.some(item =>
    /lançamento de coleção|lançamento da coleção|nova coleção|novidades/i.test(item)
  )
  // regra única da etapa: pelo menos um objetivo escolhido.
  // Desconto e ações da coleção ficam livres.
  const etapa2Ok = objetivosSelecionados.length > 0
  const etapa3Ok = canais.length > 0 && formatos.length > 0
  const podeAvancar = [etapa1Ok, etapa2Ok, etapa3Ok][etapa - 1]

  // marcar ou limpar um bloco inteiro de grupos
  const marcarGrupos = (itens: string[], marcar: boolean) => {
    const novos = marcarVarios(itens, marcar, grupos)
    setGrupos(novos)
    const validos = produtosPorGrupo(novos).flatMap(b => b.itens)
    setProdutos(prev => prev.filter(p => validos.includes(p)))
  }

  const alternarGrupo = (grupo: string) => {
    const novos = grupos.includes(grupo) ? grupos.filter(g => g !== grupo) : [...grupos, grupo]
    setGrupos(novos)
    // produtos de um grupo que saiu deixam de valer
    const validos = produtosPorGrupo(novos).flatMap(b => b.itens)
    setProdutos(prev => prev.filter(p => validos.includes(p)))
  }

  // a pergunta do desconto aparece na primeira escolha e só uma vez;
  // depois dela, o desconto se ajusta pelo resumo da etapa
  const escolherObjetivo = (item: string) => {
    const novaLista = objetivosSelecionados.includes(item)
      ? objetivosSelecionados.filter(v => v !== item)
      : [...objetivosSelecionados, item]

    setObjetivosSelecionados(novaLista)
    setObjetivo(novaLista.join(' · '))
    if (!jaPerguntouDesconto && novaLista.length > 0) {
      setJaPerguntouDesconto(true)
      setPopup('pergunta')
    }
  }

  const semDesconto = () => {
    setDesconto({ tem: false, percentual: '', formato: '' })
    setPopup(null)
  }

  const abrirDesconto = () => {
    setPercentual(desconto?.percentual ?? '')
    setPercentualLivre('')
    setFormatoPromo(desconto?.formato ?? '')
    setPopup('desconto')
  }

  // o campo aceita texto: só um número vira porcentagem,
  // o resto entra como foi escrito, como em "De 20 a 50%"
  const digitado = percentualLivre.trim()
  const valorPercentual = digitado
    ? (/^\d{1,3}$/.test(digitado) ? `${digitado}%` : digitado)
    : percentual

  const confirmarDesconto = () => {
    if (!valorPercentual && !formatoPromo) return
    setDesconto({ tem: true, percentual: valorPercentual, formato: formatoPromo })
    setPopup(null)
  }

  // fechar sem responder não desfaz nada: a campanha segue sem desconto
  const fecharPergunta = () => setPopup(null)

  const alternarCanal = (canalId: string) => {
    if (canais.includes(canalId)) {
      const doCanal = formatosDoCanal(canalId)
      setCanais(canais.filter(c => c !== canalId))
      setFormatos(prev => prev.filter(f => !doCanal.includes(f)))
      setAbertos(prev => prev.filter(c => c !== canalId))
      if (formatosDe === canalId) setFormatosDe(null)
    } else {
      setCanais([...canais, canalId])
      setFormatos(prev => [...new Set([...prev, ...formatosPadrao(canalId)])])
      setAbertos(prev => [...prev, canalId])
    }
  }

  // "formatos" dentro do canal abre a lista já com ele na frente
  const abrirFormatosDe = (canalId: string) => {
    setAbertos(prev => (prev.includes(canalId) ? prev : [...prev, canalId]))
    setFormatosDe(canalId)
  }

  const todasAsRedes = canais.length === CANAIS.length

  const alternarTodasAsRedes = () => {
    if (todasAsRedes) {
      setCanais([])
      setFormatos([])
      setAbertos([])
      setFormatosDe(null)
    } else {
      const todos = CANAIS.map(c => c.id)
      setCanais(todos)
      setFormatos([...new Set(todos.flatMap(formatosPadrao))])
      setAbertos(todos)
    }
  }

  const formatosDoCanalSelecionados = (canalId: string) =>
    formatos.filter(f => f.startsWith(`${canalId}:`)).length

  // o canal que abriu a lista vem primeiro, depois os outros escolhidos
  const canaisOrdenados = useMemo(
    () => CANAIS.filter(c => canais.includes(c.id))
      .sort((a, b) => Number(b.id === formatosDe) - Number(a.id === formatosDe)),
    [canais, formatosDe]
  )

  const concluir = () => {
    aoConcluir({
      // editando, a campanha mantém o mesmo id e a data de criação
      id: campanha?.id ?? uid(),
      tipo,
      nome: nome.trim(),
      inicio,
      fim,
      escopoGrupos,
      grupos: escopoGrupos === 'loja' ? cadastro.grupos : grupos,
      produtos: escopoGrupos === 'loja' ? cadastro.produtos : produtos,
      escopoMarcas,
      marcas: escopoMarcas === 'todas' ? cadastro.marcas : marcas,
      objetivo,
      desconto: desconto ?? { tem: false, percentual: '', formato: '' },
      canais,
      formatos,
      campanhasIds: campanhasIds ?? campanha?.campanhasIds,
      criadaEm: campanha?.criadaEm ?? new Date().toISOString()
    })
  }

  if (!aberta) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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

          {/* na ação, as campanhas escolhidas ficam à vista desde a etapa 1 */}
          {campanhasNomes && campanhasNomes.length > 0 && (
            <div className="flex items-center gap-2 mt-2.5">
              <Megaphone size={13} className="text-gray-400 shrink-0" />
              <span className="text-[10px] text-gray-400 truncate">
                {campanhasNomes.join(', ')}
              </span>
            </div>
          )}

          {etapa > 1 && nome.trim() && (
            <div className="flex items-center gap-2 mt-2.5">
              <Megaphone size={13} className="text-gray-400 shrink-0" />
              <span className="text-xs font-medium text-black shrink-0">{nome}</span>
              {objetivo && <span className="text-[10px] text-gray-400 truncate">{objetivo}</span>}
            </div>
          )}
        </div>

        <div ref={conteudoRef} className="px-6 pt-4 pb-5 overflow-y-auto scrollbar-thin flex-1 space-y-6">

          {/* nome da etapa, logo abaixo da linha do cabeçalho */}
          <h2 className="text-[26px] leading-tight font-semibold text-black">{TITULOS[etapa]}</h2>

          {/* Etapa 1: nome, vigência e alcance */}
          {etapa === 1 && (
            <>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">
                  Nome da {rotulo}
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder={tipo === 'acao' ? 'Ex.: Ação relâmpago de sexta' : 'Ex.: Liquida de Janeiro 2026'}
                  autoFocus
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-black placeholder-gray-400 text-black"
                />

                {/* campanhas já cadastradas, sugeridas a partir de 3 letras */}
                {sugestoesNome.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {sugestoesNome.map(sugestao => (
                      <Pilula
                        key={sugestao}
                        texto={sugestao}
                        ativo={nome.trim() === sugestao}
                        aoClicar={() => setNome(sugestao)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">
                  Vigência
                </label>
                <div className="flex w-full max-w-[420px] items-center gap-2">
                  <input
                    type="date"
                    value={inicio}
                    onChange={(e) => setInicio(e.target.value)}
                    className="w-[180px] min-w-0 h-8 min-h-0 px-2.5 py-1.5 text-[11px] border border-gray-200 rounded-lg focus:outline-none focus:border-black text-black"
                  />
                  <span className="text-[10px] text-gray-400 shrink-0">até</span>
                  <input
                    type="date"
                    value={fim}
                    min={inicio || undefined}
                    onChange={(e) => setFim(e.target.value)}
                    className={`w-[180px] min-w-0 h-8 min-h-0 px-2.5 py-1.5 text-[11px] border rounded-lg focus:outline-none text-black ${
                      fim && fim < inicio
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-200 focus:border-black'
                    }`}
                  />
                </div>
                <p className={`text-[10px] mt-1 ${fim && fim < inicio ? 'text-red-600' : 'text-gray-400'}`}>
                  {fim && fim < inicio
                    ? 'O término precisa ser igual ou depois do início.'
                    : 'Escolha quando começa e quando termina.'}
                </p>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">
                  Grupos de produtos
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Pilula
                    texto="Toda a loja"
                    ativo={escopoGrupos === 'loja'}
                    aoClicar={() => setEscopoGrupos('loja')}
                  />
                  <Pilula
                    texto="Itens selecionados"
                    ativo={escopoGrupos === 'selecao'}
                    aoClicar={() => setEscopoGrupos('selecao')}
                  />
                </div>

                {escopoGrupos === 'loja' ? (
                  <p className="text-[10px] text-gray-400">
                    Alcança {plural(cadastro.grupos.length, 'grupo', 'grupos')} e{' '}
                    {plural(cadastro.produtos.length, 'produto', 'produtos')} de{' '}
                    {cadastro.categoriaNomes.join(', ')}.
                  </p>
                ) : (
                  <div className="space-y-5">
                    {/* grupos do cadastro, separados pelas categorias da loja */}
                    <BlocosDeSugestao
                      blocos={cadastro.blocosGrupos}
                      selecionados={grupos}
                      aoAlternar={alternarGrupo}
                      aoMarcarBloco={marcarGrupos}
                    />

                    {blocosProdutos.length > 0 && (
                      <div className="pt-1 border-t border-gray-100">
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-4 mb-3">
                          Produtos dos grupos escolhidos
                        </p>
                        <BlocosDeSugestao
                          blocos={blocosProdutos}
                          selecionados={produtos}
                          aoAlternar={(produto) => alternar(produto, produtos, setProdutos)}
                          aoMarcarBloco={(itens, marcar) => setProdutos(marcarVarios(itens, marcar, produtos))}
                        />
                      </div>
                    )}

                    {grupos.length > 0 && blocosProdutos.length === 0 && (
                      <p className="text-[10px] text-gray-400">
                        Os grupos escolhidos entram inteiros: nenhum produto do cadastro pertence a eles.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">
                  Marcas
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Pilula
                    texto="Todas as marcas"
                    ativo={escopoMarcas === 'todas'}
                    aoClicar={() => setEscopoMarcas('todas')}
                  />
                  <Pilula
                    texto="Marcas selecionadas"
                    ativo={escopoMarcas === 'selecao'}
                    aoClicar={() => setEscopoMarcas('selecao')}
                  />
                </div>

                {escopoMarcas === 'todas' ? (
                  <p className="text-[10px] text-gray-400">
                    Alcança {plural(cadastro.marcas.length, 'marca', 'marcas')} de{' '}
                    {cadastro.categoriaNomes.join(', ')}.
                  </p>
                ) : (
                  // marcas do cadastro, separadas pelas categorias da loja
                  <BlocosDeSugestao
                    blocos={cadastro.blocosMarcas}
                    selecionados={marcas}
                    aoAlternar={(marca) => alternar(marca, marcas, setMarcas)}
                    aoMarcarBloco={(itens, marcar) => setMarcas(marcarVarios(itens, marcar, marcas))}
                  />
                )}
              </div>
            </>
          )}

          {/* Etapa 2: objetivo e desconto */}
          {etapa === 2 && (
            <>
              <p className="text-xs text-gray-500">
                Escolha a data ou o motivo que sustenta esta {rotulo}.
              </p>

              <BlocosDeSugestao
                blocos={blocosObjetivos}
                selecionados={objetivosSelecionados}
                aoAlternar={escolherObjetivo}
                aoMarcarBloco={(itens, marcar) => {
                  const novaLista = marcar
                    ? [...new Set([...objetivosSelecionados, ...itens])]
                    : objetivosSelecionados.filter(item => !itens.includes(item))

                  setObjetivosSelecionados(novaLista)
                  setObjetivo(novaLista.join(' · '))
                }}
              />

              {objetivoColecaoNova && cadastro.categoriaIds.some(id => CATEGORIAS_ROUPAS.has(id.toLowerCase())) && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 mb-2.5">Ações da coleção</p>
                  <BlocosDeSugestao
                    blocos={ACOES_COLECAO}
                    selecionados={acoesColecaoSelecionadas}
                    aoAlternar={(item) => setAcoesColecaoSelecionadas(prev =>
                      prev.includes(item) ? prev.filter(v => v !== item) : [...prev, item]
                    )}
                    aoMarcarBloco={(itens, marcar) => {
                      setAcoesColecaoSelecionadas(prev => marcar
                        ? [...new Set([...prev, ...itens])]
                        : prev.filter(item => !itens.includes(item))
                      )
                    }}
                  />
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2.5">Outro objetivo</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={outroObjetivo}
                    onChange={(e) => setOutroObjetivo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && outroObjetivo.trim()) {
                        e.preventDefault()
                        escolherObjetivo(outroObjetivo.trim())
                      }
                    }}
                    placeholder="Digite o objetivo da campanha..."
                    className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-full focus:outline-none focus:border-black placeholder-gray-400 text-black"
                  />
                  <button
                    type="button"
                    onClick={() => outroObjetivo.trim() && escolherObjetivo(outroObjetivo.trim())}
                    className="px-3 py-2 text-xs border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Usar
                  </button>
                </div>
              </div>

              {/* o desconto é opcional: fica sempre à mão, sem travar a etapa */}
              {objetivosSelecionados.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg">
                  <Percent size={13} className="text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-600 flex-1 truncate">
                    {desconto === null
                      ? 'Desconto ainda não definido'
                      : desconto.tem
                        ? ['Com desconto', desconto.percentual, desconto.formato]
                          .filter(Boolean).join(' · ')
                        : 'Sem desconto'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPopup('pergunta')}
                    className="text-[10px] text-gray-500 hover:text-black underline underline-offset-2 shrink-0"
                  >
                    {desconto === null ? 'Definir' : 'Alterar'}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Etapa 3: canais e formatos */}
          {etapa === 3 && (
            <>
              <p className="text-xs text-gray-500">
                Escolha onde a {rotulo} vai ao ar. Os formatos ficam dentro de cada canal.
              </p>

              <div className="grid grid-cols-2 gap-2">
                {CANAIS.map(canal => {
                  const Icone = ICONE_CANAL[canal.id] ?? Megaphone
                  const ativo = canais.includes(canal.id)
                  return (
                    <div
                      key={canal.id}
                      className={`flex items-center rounded-lg border transition-colors ${
                        ativo
                          ? 'bg-black text-white border-black'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => alternarCanal(canal.id)}
                        className="flex items-center gap-2.5 px-4 py-3 flex-1 min-w-0 text-left"
                      >
                        <Icone size={15} className="shrink-0" />
                        <span className="text-xs font-medium truncate">{canal.nome}</span>
                      </button>

                      {/* a lista de formatos abre por dentro do canal */}
                      {ativo && (
                        <button
                          type="button"
                          onClick={() => abrirFormatosDe(canal.id)}
                          className="flex items-center gap-1 pl-2 pr-3 py-3 text-[10px] text-white/60 hover:text-white transition-colors shrink-0"
                        >
                          {plural(formatosDoCanalSelecionados(canal.id), 'formato', 'formatos')}
                          <ChevronDown size={12} />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center gap-2">
                <Pilula
                  texto="Selecionar todas"
                  ativo={todasAsRedes}
                  aoClicar={alternarTodasAsRedes}
                />
                <span className="text-[10px] text-gray-400">
                  {canais.length === 0
                    ? 'Escolha ao menos um canal'
                    : `${plural(formatos.length, 'formato marcado', 'formatos marcados')}`}
                </span>
              </div>
            </>
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
              disabled={!etapa3Ok}
              className="px-5 py-2 text-xs font-medium bg-black hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {campanha ? 'Salvar' : `Criar ${rotulo}`}
            </button>
          )}
        </div>
      </div>

      {/* Pop-up 1: a campanha tem desconto? */}
      {popup === 'pergunta' && (
        <PopupPequeno
          titulo={objetivo || `Objetivo da ${rotulo}`}
          descricao={`Esta ${rotulo} terá desconto?`}
          aoSair={fecharPergunta}
          compacto
        >
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={abrirDesconto}
              className="py-3 text-xs font-medium border border-gray-200 rounded-lg text-gray-700 hover:border-black hover:bg-gray-50 transition-colors"
            >
              Sim
            </button>
            <button
              type="button"
              onClick={semDesconto}
              className="py-3 text-xs font-medium border border-gray-200 rounded-lg text-gray-700 hover:border-black hover:bg-gray-50 transition-colors"
            >
              Não
            </button>
          </div>
        </PopupPequeno>
      )}

      {/* Pop-up 2: qual desconto */}
      {popup === 'desconto' && (
        <PopupPequeno
          titulo="Desconto"
          descricao="Escolha a porcentagem ou o tipo de promoção"
          aoSair={() => setPopup('pergunta')}
          rodape={
            <button
              type="button"
              onClick={confirmarDesconto}
              disabled={!valorPercentual && !formatoPromo}
              className="px-5 py-2 text-xs font-medium bg-black hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Concluir
            </button>
          }
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {PERCENTUAIS.map(p => (
                <Pilula
                  key={p}
                  texto={p}
                  ativo={valorPercentual === p}
                  aoClicar={() => {
                    setPercentualLivre('')
                    setPercentual(percentual === p ? '' : p)
                  }}
                />
              ))}
            </div>

            <div className="relative flex items-center">
              <Percent size={13} className="absolute left-3 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={percentualLivre}
                maxLength={40}
                onChange={(e) => {
                  setPercentualLivre(e.target.value)
                  setPercentual('')
                }}
                placeholder="Outra porcentagem, como De 20 a 50%"
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-full focus:outline-none focus:border-black placeholder-gray-400 text-black"
              />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
                Tipo de promoção
              </p>
              <div className="flex flex-wrap gap-2">
                {FORMATOS_PROMOCAO.map(f => (
                  <Pilula
                    key={f}
                    texto={f}
                    ativo={formatoPromo === f}
                    aoClicar={() => setFormatoPromo(formatoPromo === f ? '' : f)}
                  />
                ))}
              </div>
            </div>
          </div>
        </PopupPequeno>
      )}

      {/* Pop-up dos formatos, em acordeão por canal */}
      {formatosDe && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setFormatosDe(null)
          }}
        >
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] shadow-2xl border border-gray-100 text-left flex flex-col">
            <div className="flex items-start justify-between px-5 pt-5 pb-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-black">Formatos</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Marque o que será produzido em cada canal
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormatosDe(null)}
                aria-label="Fechar"
                className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded transition-colors shrink-0"
              >
                <X size={15} />
              </button>
            </div>

            <div className="px-5 pb-4 overflow-y-auto scrollbar-thin flex-1 space-y-2">
              {canaisOrdenados.map(canal => {
                const Icone = ICONE_CANAL[canal.id] ?? Megaphone
                const aberto = abertos.includes(canal.id)
                return (
                  <div key={canal.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => alternar(canal.id, abertos, setAbertos)}
                      className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <Icone size={14} className="text-gray-500 shrink-0" />
                      <span className="text-xs font-medium text-black flex-1 text-left">
                        {canal.nome}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {formatosDoCanalSelecionados(canal.id)} de {formatosDoCanal(canal.id).length}
                      </span>
                      <ChevronDown
                        size={14}
                        className={`text-gray-400 transition-transform ${aberto ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {aberto && (
                      <div className="px-4 pb-3 pt-1 space-y-3 border-t border-gray-100">
                        {canal.secoes.map(secao => (
                          <div key={secao.id}>
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 mt-2">
                              {secao.nome}
                            </p>
                            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                              {secao.formatos.map(formato => {
                                const id = idFormato(canal.id, secao.id, formato.id)
                                return (
                                  <label
                                    key={id}
                                    className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={formatos.includes(id)}
                                      onChange={() => alternar(id, formatos, setFormatos)}
                                      className="w-3.5 h-3.5 accent-black cursor-pointer"
                                    />
                                    {formato.nome}
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setFormatosDe(null)}
                className="px-5 py-2 text-xs font-medium bg-black hover:bg-gray-800 text-white rounded-lg transition-colors"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
