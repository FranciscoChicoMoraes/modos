/**
 * Utilitários de data - centralizar TODA manipulação de datas aqui
 * Formato padrão: DD/MM/YYYY (string) ou Date (objeto)
 */

export const formatarData = (data: Date): string => {
  const dia = String(data.getDate()).padStart(2, '0')
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const ano = data.getFullYear()
  return `${dia}/${mes}/${ano}`
}

export const parseData = (dataString: string): Date => {
  const [dia, mes, ano] = dataString.split('/').map(Number)
  return new Date(Date.UTC(ano, mes - 1, dia))
}

export const obterHoje = (): string => {
  return formatarData(new Date())
}

export const obterAmanha = (): string => {
  const amanha = new Date()
  amanha.setDate(amanha.getDate() + 1)
  return formatarData(amanha)
}

export const somarDias = (data: string, dias: number): string => {
  const dataObj = parseData(data)
  dataObj.setDate(dataObj.getDate() + dias)
  return formatarData(dataObj)
}

export const distribuirTarefas = (
  dataInicial: string,
  quantidade: number,
  diasJanela: number = 7
): Array<{ data: string; periodo: 'manha' | 'tarde' }> => {
  const resultado = []

  for (let i = 0; i < quantidade; i++) {
    const diaOffset = i % diasJanela
    const data = somarDias(dataInicial, diaOffset)
    const periodo = Math.floor(i / diasJanela) % 2 === 0 ? 'manha' : 'tarde'
    resultado.push({ data, periodo })
  }

  return resultado
}

export const validarFormatoData = (dataString: string): boolean => {
  const regex = /^\d{2}\/\d{2}\/\d{4}$/
  if (!regex.test(dataString)) return false
  const [dia, mes, ano] = dataString.split('/').map(Number)
  return dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12 && ano >= 2000
}
