export type Canal =
  | 'stories' | 'feed' | 'status_whatsapp'
  | 'tiktok' | 'anuncios' | 'transmissoes'

export type PecaCard = {
  id: string
  ordem: number           // 1, 2, 3...
  canal: Canal
  capaImagem: string      // imagem que SIMULA a foto/print da peça
  orientacao: string      // texto curto de como fazer (o briefing)
  tituloCurto?: string    // rótulo opcional no topo do card
}

export type Secao = {
  canal: Canal
  titulo: string          // "Stories", "Feed"...
  pecas: PecaCard[]
}

export type DiaDetalhe = {
  id: string
  data: string            // ISO "2026-08-03"
  rotulo: string          // "3 de agosto, Segunda-feira"
  secoes: Secao[]         // as 6 seções, na ordem definida
}
