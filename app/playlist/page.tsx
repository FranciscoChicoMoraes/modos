'use client'

import { useMemo, useState } from 'react'
import {
  Play, Pause, SkipBack, SkipForward, Search, ArrowLeft,
  ExternalLink, Music2, Zap, Sparkles, Heart, Sun, Snowflake,
  Guitar, Flower2, Coffee, PartyPopper, Clock3
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Track {
  titulo: string
  artista: string
  duracao: string   // mm:ss
}

interface Playlist {
  id: string
  nome: string
  descricao: string
  categoria: string
  gradiente: string   // classes tailwind da capa
  icone: LucideIcon
  faixas: Track[]
}

const PLAYLISTS: Playlist[] = [
  {
    id: 'black-friday',
    nome: 'Black Friday Energia',
    descricao: 'Ritmo acelerado para dias de promoção intensa e loja cheia.',
    categoria: 'Campanhas de marketing',
    gradiente: 'from-zinc-700 via-zinc-900 to-black',
    icone: Zap,
    faixas: [
      { titulo: 'Titanium', artista: 'David Guetta, Sia', duracao: '4:05' },
      { titulo: "Can't Hold Us", artista: 'Macklemore & Ryan Lewis', duracao: '4:18' },
      { titulo: "Don't Start Now", artista: 'Dua Lipa', duracao: '3:03' },
      { titulo: 'Uptown Funk', artista: 'Mark Ronson, Bruno Mars', duracao: '4:30' },
      { titulo: 'Stronger', artista: 'Kanye West', duracao: '5:11' },
      { titulo: 'Run the World (Girls)', artista: 'Beyoncé', duracao: '3:56' }
    ]
  },
  {
    id: 'lancamento-colecao',
    nome: 'Lançamento de Coleção',
    descricao: 'Trilha sofisticada e vibrante para apresentar as peças novas.',
    categoria: 'Campanhas de marketing',
    gradiente: 'from-fuchsia-600 via-purple-700 to-indigo-900',
    icone: Sparkles,
    faixas: [
      { titulo: 'Levitating', artista: 'Dua Lipa', duracao: '3:23' },
      { titulo: 'Get Lucky', artista: 'Daft Punk, Pharrell Williams', duracao: '4:08' },
      { titulo: 'Blinding Lights', artista: 'The Weeknd', duracao: '3:20' },
      { titulo: 'About Damn Time', artista: 'Lizzo', duracao: '3:11' },
      { titulo: 'Golden', artista: 'Harry Styles', duracao: '3:28' },
      { titulo: 'Dance The Night', artista: 'Dua Lipa', duracao: '2:56' }
    ]
  },
  {
    id: 'dia-dos-namorados',
    nome: 'Dia dos Namorados',
    descricao: 'Clima romântico para a campanha mais apaixonada do ano.',
    categoria: 'Campanhas de marketing',
    gradiente: 'from-rose-500 via-red-600 to-rose-900',
    icone: Heart,
    faixas: [
      { titulo: 'Perfect', artista: 'Ed Sheeran', duracao: '4:23' },
      { titulo: 'All of Me', artista: 'John Legend', duracao: '4:29' },
      { titulo: 'Ainda Bem', artista: 'Marisa Monte', duracao: '3:07' },
      { titulo: 'Eu Sei Que Vou Te Amar', artista: 'Tom Jobim, Vinícius de Moraes', duracao: '2:44' },
      { titulo: 'Lover', artista: 'Taylor Swift', duracao: '3:41' },
      { titulo: 'Thinking Out Loud', artista: 'Ed Sheeran', duracao: '4:41' }
    ]
  },
  {
    id: 'verao-na-loja',
    nome: 'Verão na Loja',
    descricao: 'Leveza tropical para a estação mais quente das vitrines.',
    categoria: 'Estações do ano',
    gradiente: 'from-amber-400 via-orange-500 to-red-500',
    icone: Sun,
    faixas: [
      { titulo: 'País Tropical', artista: 'Jorge Ben Jor', duracao: '3:15' },
      { titulo: 'Mas Que Nada', artista: 'Sergio Mendes, Black Eyed Peas', duracao: '4:26' },
      { titulo: 'Island In The Sun', artista: 'Weezer', duracao: '3:20' },
      { titulo: 'Sunny', artista: 'Boney M.', duracao: '3:56' },
      { titulo: 'Summer', artista: 'Calvin Harris', duracao: '3:42' },
      { titulo: 'Águas de Março', artista: 'Elis Regina, Tom Jobim', duracao: '3:32' }
    ]
  },
  {
    id: 'inverno-aconchegante',
    nome: 'Inverno Aconchegante',
    descricao: 'Sons quentinhos para a coleção de frio e provadores cheios.',
    categoria: 'Estações do ano',
    gradiente: 'from-sky-600 via-blue-800 to-slate-900',
    icone: Snowflake,
    faixas: [
      { titulo: 'Sweater Weather', artista: 'The Neighbourhood', duracao: '4:00' },
      { titulo: 'Skinny Love', artista: 'Bon Iver', duracao: '3:58' },
      { titulo: 'Trevo (Tu)', artista: 'AnaVitória, Tiago Iorc', duracao: '3:22' },
      { titulo: 'Holocene', artista: 'Bon Iver', duracao: '5:36' },
      { titulo: 'Velha Infância', artista: 'Tribalistas', duracao: '4:45' },
      { titulo: 'Fix You', artista: 'Coldplay', duracao: '4:54' }
    ]
  },
  {
    id: 'colecao-country',
    nome: 'Coleção Country',
    descricao: 'Do Nashville ao sertanejo, a trilha do estilo country da loja.',
    categoria: 'Temas de coleção',
    gradiente: 'from-amber-700 via-orange-900 to-stone-900',
    icone: Guitar,
    faixas: [
      { titulo: 'Take Me Home, Country Roads', artista: 'John Denver', duracao: '3:10' },
      { titulo: 'Jolene', artista: 'Dolly Parton', duracao: '2:41' },
      { titulo: 'Need You Now', artista: 'Lady A', duracao: '4:37' },
      { titulo: 'Esperando na Janela', artista: 'Gilberto Gil', duracao: '4:26' },
      { titulo: 'Evidências', artista: 'Chitãozinho & Xororó', duracao: '4:37' },
      { titulo: 'Batom de Cereja', artista: 'Israel & Rodolffo', duracao: '2:59' }
    ]
  },
  {
    id: 'colecao-boho',
    nome: 'Coleção Boho',
    descricao: 'Folk e indie para looks despojados, rendas e tons terrosos.',
    categoria: 'Temas de coleção',
    gradiente: 'from-emerald-600 via-teal-800 to-stone-900',
    icone: Flower2,
    faixas: [
      { titulo: 'Riptide', artista: 'Vance Joy', duracao: '3:24' },
      { titulo: 'Ho Hey', artista: 'The Lumineers', duracao: '2:43' },
      { titulo: 'Budapest', artista: 'George Ezra', duracao: '3:20' },
      { titulo: 'Banana Pancakes', artista: 'Jack Johnson', duracao: '3:11' },
      { titulo: 'Velha Roupa Colorida', artista: 'Belchior', duracao: '4:24' },
      { titulo: 'Big Yellow Taxi', artista: 'Joni Mitchell', duracao: '2:15' }
    ]
  },
  {
    id: 'cafe-com-clientes',
    nome: 'Café com Clientes',
    descricao: 'Bossa e jazz suaves para manhãs de atendimento na loja.',
    categoria: 'Eventos em loja',
    gradiente: 'from-yellow-700 via-amber-900 to-stone-950',
    icone: Coffee,
    faixas: [
      { titulo: 'Garota de Ipanema', artista: 'Tom Jobim, Vinícius de Moraes', duracao: '5:24' },
      { titulo: 'Fly Me To The Moon', artista: 'Frank Sinatra', duracao: '2:28' },
      { titulo: 'Corcovado', artista: 'João Gilberto', duracao: '4:16' },
      { titulo: 'Wave', artista: 'Tom Jobim', duracao: '2:56' },
      { titulo: 'L-O-V-E', artista: 'Nat King Cole', duracao: '2:32' },
      { titulo: 'Samba de Verão', artista: 'Marcos Valle', duracao: '2:39' }
    ]
  },
  {
    id: 'coquetel-inauguracao',
    nome: 'Coquetel de Inauguração',
    descricao: 'Lounge elegante para brindes, convidados e noites especiais.',
    categoria: 'Eventos em loja',
    gradiente: 'from-violet-700 via-indigo-900 to-black',
    icone: PartyPopper,
    faixas: [
      { titulo: 'Feeling Good', artista: 'Nina Simone', duracao: '2:57' },
      { titulo: 'Golden Hour', artista: 'JVKE', duracao: '3:29' },
      { titulo: 'Lovely Day', artista: 'Bill Withers', duracao: '4:14' },
      { titulo: 'September', artista: 'Earth, Wind & Fire', duracao: '3:35' },
      { titulo: 'Menina Flor', artista: 'Bebel Gilberto', duracao: '3:40' },
      { titulo: 'Valerie', artista: 'Mark Ronson, Amy Winehouse', duracao: '3:53' }
    ]
  }
]

const CATEGORIAS = [
  'Campanhas de marketing',
  'Estações do ano',
  'Temas de coleção',
  'Eventos em loja'
]

const parseDuracao = (d: string) => {
  const [m, s] = d.split(':').map(Number)
  return m * 60 + s
}

const formatTotal = (faixas: Track[]) => {
  const total = faixas.reduce((acc, f) => acc + parseDuracao(f.duracao), 0)
  const min = Math.round(total / 60)
  return `${min} min`
}

const spotifySearchUrl = (texto: string) =>
  `https://open.spotify.com/search/${encodeURIComponent(texto)}`

export default function PlaylistPage() {
  const [busca, setBusca] = useState('')
  const [aberta, setAberta] = useState<Playlist | null>(null)
  // faixa em destaque no player (visual, sem áudio)
  const [tocando, setTocando] = useState<{ playlist: Playlist; idx: number } | null>(null)
  const [pausado, setPausado] = useState(false)

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return PLAYLISTS
    return PLAYLISTS.filter(p =>
      p.nome.toLowerCase().includes(q) ||
      p.descricao.toLowerCase().includes(q) ||
      p.categoria.toLowerCase().includes(q) ||
      p.faixas.some(f => f.titulo.toLowerCase().includes(q) || f.artista.toLowerCase().includes(q))
    )
  }, [busca])

  const tocarPlaylist = (p: Playlist, idx = 0) => {
    setTocando({ playlist: p, idx })
    setPausado(false)
  }

  const pular = (dir: 1 | -1) => {
    setTocando(prev => {
      if (!prev) return prev
      const total = prev.playlist.faixas.length
      return { ...prev, idx: (prev.idx + dir + total) % total }
    })
    setPausado(false)
  }

  const faixaAtual = tocando ? tocando.playlist.faixas[tocando.idx] : null

  const CoverIcon = ({ p, size, iconSize }: { p: Playlist; size: string; iconSize: number }) => {
    const Icone = p.icone
    return (
      <div className={`${size} rounded bg-gradient-to-br ${p.gradiente} flex items-center justify-center shrink-0 shadow-lg`}>
        <Icone size={iconSize} className="text-white/90" />
      </div>
    )
  }

  return (
    <div className="-m-12 h-screen flex flex-col bg-[#121212] text-white">
      {/* Área rolável */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {aberta ? (
          /* ---- Detalhe da playlist ---- */
          <div>
            <div className={`bg-gradient-to-b ${aberta.gradiente} bg-fixed`}>
              <div className="px-8 pt-6 pb-8 bg-gradient-to-b from-black/20 to-black/50">
                <button
                  onClick={() => setAberta(null)}
                  className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white mb-8 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Voltar
                </button>
                <div className="flex items-end gap-6 flex-wrap">
                  <CoverIcon p={aberta} size="w-44 h-44" iconSize={72} />
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wider text-white/70 mb-2">
                      Playlist sugerida
                    </p>
                    <h1 className="text-4xl md:text-5xl font-bold mb-3 truncate">{aberta.nome}</h1>
                    <p className="text-sm text-white/80 mb-2">{aberta.descricao}</p>
                    <p className="text-xs text-white/60">
                      {aberta.categoria} · {aberta.faixas.length} músicas, {formatTotal(aberta.faixas)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-6">
              <div className="flex items-center gap-4 mb-8">
                <button
                  onClick={() => tocarPlaylist(aberta)}
                  aria-label="Tocar playlist"
                  className="w-14 h-14 rounded-full bg-[#1DB954] hover:scale-105 text-black flex items-center justify-center transition-transform shadow-lg"
                >
                  <Play size={24} fill="currentColor" className="ml-0.5" />
                </button>
                <a
                  href={spotifySearchUrl(aberta.nome)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 text-xs border border-white/20 hover:border-white/60 rounded-full text-white/90 transition-colors"
                >
                  <ExternalLink size={13} />
                  Buscar no Spotify
                </a>
              </div>

              {/* Lista de faixas */}
              <div className="grid grid-cols-[2rem_1fr_auto] gap-x-4 px-3 pb-2 border-b border-white/10 text-xs uppercase tracking-wider text-white/50">
                <span>#</span>
                <span>Título</span>
                <Clock3 size={14} />
              </div>
              <div className="mt-2">
                {aberta.faixas.map((faixa, i) => {
                  const ativa = tocando?.playlist.id === aberta.id && tocando.idx === i
                  return (
                    <button
                      key={i}
                      onClick={() => tocarPlaylist(aberta, i)}
                      className="w-full grid grid-cols-[2rem_1fr_auto] gap-x-4 items-center px-3 py-2.5 rounded hover:bg-white/10 text-left transition-colors group"
                    >
                      <span className={`text-sm tabular-nums ${ativa ? 'text-[#1DB954]' : 'text-white/50'}`}>
                        {ativa ? <Music2 size={14} /> : i + 1}
                      </span>
                      <span className="min-w-0">
                        <span className={`block text-sm truncate ${ativa ? 'text-[#1DB954]' : 'text-white'}`}>
                          {faixa.titulo}
                        </span>
                        <span className="block text-xs text-white/50 truncate">{faixa.artista}</span>
                      </span>
                      <span className="text-xs text-white/50 tabular-nums">{faixa.duracao}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ---- Home: prateleiras por categoria ---- */
          <div>
            <div className="bg-gradient-to-b from-emerald-900/60 to-transparent">
              <div className="px-8 pt-8 pb-6">
                <h1 className="text-3xl font-bold mb-1">Playlists</h1>
                <p className="text-sm text-white/60 mb-6">
                  Trilhas sonoras sugestivas para campanhas, estações, coleções e eventos em loja.
                </p>
                <div className="relative max-w-sm">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar playlist, música ou artista"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/10 hover:bg-white/15 focus:bg-white/15 rounded-full placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/30 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="px-8 pb-10 flex flex-col gap-10">
              {CATEGORIAS.map(cat => {
                const doGrupo = filtradas.filter(p => p.categoria === cat)
                if (doGrupo.length === 0) return null
                return (
                  <section key={cat}>
                    <h2 className="text-lg font-semibold mb-4">{cat}</h2>
                    <div className="flex gap-5 overflow-x-auto scrollbar-none pb-2">
                      {doGrupo.map(p => (
                        <button
                          key={p.id}
                          onClick={() => setAberta(p)}
                          className="group w-44 shrink-0 p-3 bg-[#181818] hover:bg-[#282828] rounded-lg text-left transition-colors"
                        >
                          <div className="relative mb-3">
                            <CoverIcon p={p} size="w-38 h-38 aspect-square w-full" iconSize={48} />
                            <span
                              role="button"
                              aria-label={`Tocar ${p.nome}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                setAberta(p)
                                tocarPlaylist(p)
                              }}
                              className="absolute bottom-2 right-2 w-11 h-11 rounded-full bg-[#1DB954] text-black flex items-center justify-center shadow-xl opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-105 transition-all"
                            >
                              <Play size={18} fill="currentColor" className="ml-0.5" />
                            </span>
                          </div>
                          <p className="text-sm font-medium truncate mb-1">{p.nome}</p>
                          <p className="text-xs text-white/50 line-clamp-2 leading-snug">{p.descricao}</p>
                        </button>
                      ))}
                    </div>
                  </section>
                )
              })}

              {filtradas.length === 0 && (
                <p className="text-sm text-white/50">
                  Nada encontrado para "{busca}". Tente outro termo.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Barra do player */}
      {tocando && faixaAtual && (
        <div className="h-20 shrink-0 bg-[#181818] border-t border-white/10 px-4 flex items-center gap-4">
          <CoverIcon p={tocando.playlist} size="w-12 h-12" iconSize={20} />
          <div className="min-w-0 w-52">
            <p className="text-sm truncate">{faixaAtual.titulo}</p>
            <p className="text-xs text-white/50 truncate">{faixaAtual.artista}</p>
          </div>

          {/* Equalizador decorativo */}
          {!pausado && (
            <div className="hidden sm:flex items-end gap-0.5 h-4" aria-hidden>
              <span className="w-0.5 bg-[#1DB954] animate-pulse" style={{ height: '60%' }} />
              <span className="w-0.5 bg-[#1DB954] animate-pulse" style={{ height: '100%', animationDelay: '150ms' }} />
              <span className="w-0.5 bg-[#1DB954] animate-pulse" style={{ height: '40%', animationDelay: '300ms' }} />
              <span className="w-0.5 bg-[#1DB954] animate-pulse" style={{ height: '80%', animationDelay: '450ms' }} />
            </div>
          )}

          <div className="flex-1 flex items-center justify-center gap-4">
            <button
              onClick={() => pular(-1)}
              aria-label="Faixa anterior"
              className="text-white/60 hover:text-white transition-colors"
            >
              <SkipBack size={18} fill="currentColor" />
            </button>
            <button
              onClick={() => setPausado(p => !p)}
              aria-label={pausado ? 'Tocar' : 'Pausar'}
              className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
            >
              {pausado
                ? <Play size={16} fill="currentColor" className="ml-0.5" />
                : <Pause size={16} fill="currentColor" />}
            </button>
            <button
              onClick={() => pular(1)}
              aria-label="Próxima faixa"
              className="text-white/60 hover:text-white transition-colors"
            >
              <SkipForward size={18} fill="currentColor" />
            </button>
          </div>

          <a
            href={spotifySearchUrl(`${faixaAtual.titulo} ${faixaAtual.artista}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
          >
            <ExternalLink size={13} />
            Ouvir no Spotify
          </a>
        </div>
      )}
    </div>
  )
}
