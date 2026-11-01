import type { Canal, DiaDetalhe, PecaCard, Secao } from './types'
import { CANAIS, ORDEM_CANAIS } from './canais'

// Capa placeholder na proporção do canal, em tom lavanda do design system.
// Para usar foto real depois, basta trocar capaImagem pela URL da imagem.
const capa = (canal: Canal, rotulo: string) =>
  `https://placehold.co/${CANAIS[canal].placeholder}/D8D0EE/6B5CA5?text=${encodeURIComponent(rotulo)}`

const peca = (
  canal: Canal,
  ordem: number,
  orientacao: string,
  tituloCurto?: string
): PecaCard => ({
  id: `${canal}-${ordem}`,
  ordem,
  canal,
  capaImagem: capa(canal, tituloCurto ?? `${CANAIS[canal].titulo} ${ordem}`),
  orientacao,
  tituloCurto
})

// ---- Seções do dia 3 de agosto ----

const STORIES: PecaCard[] = [
  peca('stories', 1, 'Óculos solar Ray-Ban Aviador: foto na mão, dentro da loja.', 'Produto na mão'),
  peca('stories', 2, 'Bastidor da vitrine sendo montada, vídeo curto com a equipe.', 'Bastidor'),
  peca('stories', 3, 'Print do depoimento da cliente no WhatsApp, com adesivos.', 'Depoimento'),
  peca('stories', 4, 'Enquete: qual armação combina mais com você? Redonda ou quadrada.', 'Enquete'),
  peca('stories', 5, 'Antes e depois da troca de lentes, duas fotos lado a lado.', 'Antes e depois'),
  peca('stories', 6, 'Unboxing da coleção nova chegando, abrir a caixa em vídeo.', 'Unboxing'),
  peca('stories', 7, 'Close no detalhe da haste dourada, luz natural da janela.', 'Detalhe'),
  peca('stories', 8, 'Tour de 15 segundos pela loja arrumada, música animada.', 'Ambiente da loja'),
  peca('stories', 9, 'Oferta relâmpago de 20% nas semijoias, arte com fundo lavanda.', 'Oferta'),
  peca('stories', 10, 'Contagem regressiva para o lançamento de sábado, adesivo de timer.', 'Contagem'),
  peca('stories', 11, 'Caixinha de perguntas: qual look você quer ver amanhã?', 'Caixinha'),
  peca('stories', 12, 'Repost do carrossel novo do feed, com adesivo de link.', 'Chamada ao feed')
]

const FEED: PecaCard[] = [
  peca('feed', 1, 'Carrossel educativo com 7 slides: como escolher óculos para seu rosto.', 'Carrossel'),
  peca('feed', 2, 'Foto still do óculos sobre mármore, sombra dura e fundo claro.', 'Still de produto'),
  peca('feed', 3, 'Reels de bastidor da chegada da coleção, cortes rápidos.', 'Reels'),
  peca('feed', 4, 'Card de depoimento com foto da cliente usando a compra.', 'Depoimento')
]

const STATUS: PecaCard[] = [
  peca('status_whatsapp', 1, 'Arte da oferta do dia com preço e botão de chamar no zap.', 'Oferta do dia'),
  peca('status_whatsapp', 2, 'Foto da novidade que chegou hoje, texto curto por cima.', 'Novidade'),
  peca('status_whatsapp', 3, 'Bom dia com foto do produto em uso e link do catálogo.', 'Bom dia')
]

const TIKTOK: PecaCard[] = [
  peca('tiktok', 1, 'Trend com áudio em alta adaptada para troca de óculos.', 'Trend'),
  peca('tiktok', 2, 'Arrume-se comigo: abrindo a loja e escolhendo o look do dia.', 'GRWM'),
  peca('tiktok', 3, 'POV: você entra na loja procurando presente de aniversário.', 'POV'),
  peca('tiktok', 4, 'Responder comentário da semana com vídeo mostrando o produto.', 'Resposta')
]

const ANUNCIOS: PecaCard[] = [
  peca('anuncios', 1, 'Criativo da oferta de 20% com foto de produto e selo de desconto.', 'Oferta 20%'),
  peca('anuncios', 2, 'Retargeting com depoimento em vídeo de cliente satisfeita.', 'Retargeting'),
  peca('anuncios', 3, 'Catálogo da coleção nova para público frio, 4 produtos.', 'Catálogo')
]

const TRANSMISSOES: PecaCard[] = [
  peca('transmissoes', 1, 'Capa da live de lançamento da coleção, quinta às 19h.', 'Live lançamento'),
  peca('transmissoes', 2, 'Live tira-dúvidas sobre lentes, roteiro com 5 perguntas.', 'Tira-dúvidas'),
  peca('transmissoes', 3, 'Corte de 60 segundos do melhor momento da live anterior.', 'Corte')
]

const PECAS_POR_CANAL: Record<Canal, PecaCard[]> = {
  stories: STORIES,
  feed: FEED,
  status_whatsapp: STATUS,
  tiktok: TIKTOK,
  anuncios: ANUNCIOS,
  transmissoes: TRANSMISSOES
}

// monta as 6 seções na ordem definida em canais.ts
const SECOES: Secao[] = ORDEM_CANAIS.map(canal => ({
  canal,
  titulo: CANAIS[canal].titulo,
  pecas: PECAS_POR_CANAL[canal]
}))

const DIAS_SEMANA = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado'
]

const MESES_LONGOS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
]

const rotuloDoDia = (iso: string) => {
  const [ano, mes, dia] = iso.split('-').map(Number)
  const semana = DIAS_SEMANA[new Date(ano, mes - 1, dia).getDay()]
  return `${dia} de ${MESES_LONGOS[mes - 1]}, ${semana}`
}

// Devolve o briefing do dia pedido na rota. Enquanto não há API,
// todo dia usa o mesmo conjunto de seções, com o rótulo da data certa.
export function getDiaDetalhe(diaParam: string): DiaDetalhe {
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(diaParam) ? diaParam : '2026-08-03'
  return {
    id: iso,
    data: iso,
    rotulo: rotuloDoDia(iso),
    secoes: SECOES
  }
}
