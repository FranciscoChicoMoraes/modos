// Empresa fictícia para testar a área de Marketing sem refazer o cadastro
// a cada recarregamento. É temporária: apagar este arquivo e a importação
// em app/marketing/page.tsx devolve a trilha de cadastro.
import {
  SEGMENTOS, gruposPorCategoria, marcasPorCategoria, produtosPorGrupo
} from '@/lib/marketing/segmentos'
import type { CadastroMarketing } from '@/components/marketing/OnboardingTrilha'

const CATEGORIAS = ['loja-roupas', 'relojoaria', 'semijoias', 'otica', 'perfumaria']

// logo vermelha, desenhada aqui mesmo para não depender de arquivo
const LOGO_VERMELHA =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <rect width="120" height="120" fill="#e11d48"/>
      <text x="60" y="82" font-family="Helvetica, Arial, sans-serif" font-size="68"
        font-weight="bold" fill="#ffffff" text-anchor="middle">G</text>
    </svg>`
  )

const blocosGrupos = gruposPorCategoria(CATEGORIAS)
const grupos = blocosGrupos.flatMap(b => b.itens)

const blocosProdutos = produtosPorGrupo(grupos)
const produtos = blocosProdutos.flatMap(b => b.itens)

const blocosMarcas = marcasPorCategoria(CATEGORIAS, grupos)
const marcas = blocosMarcas.flatMap(b => b.itens)

export const EMPRESA_DEMO: CadastroMarketing = {
  nome: 'Granfinos',
  aniversario: '05/11',
  categoriaIds: CATEGORIAS,
  categoriaNomes: CATEGORIAS.map(
    id => SEGMENTOS.find(s => s.id === id)?.nome ?? id
  ),
  logo: LOGO_VERMELHA,
  grupos,
  produtos,
  marcas,
  blocosGrupos,
  blocosMarcas
}
