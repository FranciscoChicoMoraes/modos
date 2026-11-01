// Ponte entre a tela de Marketing e o Supabase. Campanhas e ações moram
// em tabelas separadas; o navegador fica só como cópia de apoio, usada
// enquanto a nuvem não responde.
import type { Campanha } from '@/lib/marketing/campanhas'

const rota = (item: Campanha) =>
  item.tipo === 'acao' ? '/api/marketing/acoes' : '/api/marketing/campanhas'

const corpo = (item: Campanha) =>
  item.tipo === 'acao' ? { acao: item } : { campanha: item }

export interface CargaMarketing {
  itens: Campanha[]
  naNuvem: boolean
}

// junta as duas tabelas em uma lista só, que é como a tela trabalha
export const carregarDaNuvem = async (): Promise<CargaMarketing> => {
  try {
    const [rc, ra] = await Promise.all([
      fetch('/api/marketing/campanhas'),
      fetch('/api/marketing/acoes')
    ])
    const dc = await rc.json()
    const da = await ra.json()

    if (dc.indisponivel || da.indisponivel) return { itens: [], naNuvem: false }

    return {
      itens: [...(da.acoes ?? []), ...(dc.campanhas ?? [])],
      naNuvem: true
    }
  } catch {
    return { itens: [], naNuvem: false }
  }
}

export const salvarNaNuvem = async (item: Campanha): Promise<boolean> => {
  try {
    const r = await fetch(rota(item), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo(item))
    })
    const dados = await r.json()
    return Boolean(dados.ok)
  } catch {
    return false
  }
}

export const excluirDaNuvem = async (item: Campanha): Promise<boolean> => {
  try {
    const r = await fetch(`${rota(item)}?id=${encodeURIComponent(item.id)}`, {
      method: 'DELETE'
    })
    const dados = await r.json()
    return Boolean(dados.ok)
  } catch {
    return false
  }
}
