export type DiaConteudo = {
  id: string
  titulo: string        // ex: "Segunda: Fundamentos de Prompt"
  descricao?: string
  imagem: string        // placeholders por enquanto
  data: string          // ISO: "2026-08-17"
  badges?: string[]     // ex: ["4 módulos", "39 aulas"]
  duracao?: string      // ex: "45 min"
  href: string          // link do conteúdo
}

export type Semana = {
  id: string
  titulo: string
  dias: DiaConteudo[]
}

export type Mes = {
  id: string
  titulo: string
  semanas: Semana[]
}
