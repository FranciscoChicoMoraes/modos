import type { ComponentType } from 'react'
import {
  CirclePlay, LayoutGrid, MessageCircle, Music2, Megaphone, Radio
} from 'lucide-react'
import type { Canal } from './types'

export type CanalInfo = {
  titulo: string
  Icone: ComponentType<{ size?: number; className?: string }>
  aspecto: string       // classe tailwind da proporção da capa
  grid: string          // colunas do grid responsivo da seção
  placeholder: string   // dimensões do placehold.co ("900x1600")
}

// Mapa central: cada canal define título, ícone, proporção da capa e grid
export const CANAIS: Record<Canal, CanalInfo> = {
  stories: {
    titulo: 'Stories',
    Icone: CirclePlay,
    aspecto: 'aspect-[9/16]',
    grid: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
    placeholder: '900x1600'
  },
  feed: {
    titulo: 'Feed',
    Icone: LayoutGrid,
    aspecto: 'aspect-square',
    grid: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    placeholder: '1080x1080'
  },
  status_whatsapp: {
    titulo: 'Status WhatsApp',
    Icone: MessageCircle,
    aspecto: 'aspect-[9/16]',
    grid: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
    placeholder: '900x1600'
  },
  tiktok: {
    titulo: 'TikTok',
    Icone: Music2,
    aspecto: 'aspect-[9/16]',
    grid: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
    placeholder: '900x1600'
  },
  anuncios: {
    titulo: 'Anúncios',
    Icone: Megaphone,
    aspecto: 'aspect-[4/5]',
    grid: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    placeholder: '1080x1350'
  },
  transmissoes: {
    titulo: 'Transmissões',
    Icone: Radio,
    aspecto: 'aspect-video',
    grid: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    placeholder: '1600x900'
  }
}

// Ordem exata de exibição das seções na página do dia
export const ORDEM_CANAIS: Canal[] = [
  'stories', 'feed', 'status_whatsapp', 'tiktok', 'anuncios', 'transmissoes'
]
