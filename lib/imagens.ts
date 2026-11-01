// Converte formatos que o navegador não decodifica (HEIC/HEIF do iPhone e
// DNG das câmeras) para JPEG, para que possam ser exibidos e exportados.

export const EXTENSOES_EXTRAS = ['.heic', '.heif', '.dng']

const temExtensao = (nome: string, exts: string[]) =>
  exts.some(ext => nome.toLowerCase().endsWith(ext))

export const ehHeic = (file: File) =>
  /image\/hei[cf]/i.test(file.type) || temExtensao(file.name, ['.heic', '.heif'])

export const ehDng = (file: File) =>
  /image\/x-adobe-dng/i.test(file.type) || temExtensao(file.name, ['.dng'])

// arquivos que valem tentar abrir: imagens comuns + os formatos convertidos
export const ehImagemAceita = (file: File) =>
  file.type.startsWith('image/') || temExtensao(file.name, EXTENSOES_EXTRAS)

const trocarExtensao = (nome: string) => nome.replace(/\.[^.]+$/, '') + '.jpg'

const paraArquivoJpeg = (blob: Blob, nomeOriginal: string) =>
  new File([blob], trocarExtensao(nomeOriginal), { type: 'image/jpeg' })

// ---- DNG: extrai a maior prévia JPEG embutida no arquivo ----

// tamanho em bytes de cada tipo de campo TIFF
const TAMANHO_TIPO: Record<number, number> = {
  1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8
}

const TAG_COMPRESSAO = 0x0103
const TAG_STRIP_OFFSETS = 0x0111
const TAG_STRIP_BYTES = 0x0117
const TAG_JPEG_OFFSET = 0x0201
const TAG_JPEG_TAMANHO = 0x0202
const TAG_SUB_IFDS = 0x014a

type Entrada = { tipo: number; quantidade: number; posicaoValor: number }

const lerValores = (view: DataView, little: boolean, entrada: Entrada): number[] => {
  const tamanho = TAMANHO_TIPO[entrada.tipo] ?? 0
  if (tamanho === 0) return []
  const total = tamanho * entrada.quantidade
  // até 4 bytes o valor fica embutido na própria entrada
  const base = total <= 4 ? entrada.posicaoValor : view.getUint32(entrada.posicaoValor, little)
  const valores: number[] = []
  for (let i = 0; i < entrada.quantidade; i++) {
    const p = base + i * tamanho
    if (p + tamanho > view.byteLength) break
    if (entrada.tipo === 3) valores.push(view.getUint16(p, little))
    else if (entrada.tipo === 4 || entrada.tipo === 9) valores.push(view.getUint32(p, little))
    else if (entrada.tipo === 1 || entrada.tipo === 7) valores.push(view.getUint8(p))
    else valores.push(0)
  }
  return valores
}

const lerIfd = (view: DataView, little: boolean, offset: number) => {
  const entradas = new Map<number, Entrada>()
  if (offset <= 0 || offset + 2 > view.byteLength) return { entradas, proximo: 0 }
  const quantas = view.getUint16(offset, little)
  let p = offset + 2
  for (let i = 0; i < quantas; i++, p += 12) {
    if (p + 12 > view.byteLength) break
    entradas.set(view.getUint16(p, little), {
      tipo: view.getUint16(p + 2, little),
      quantidade: view.getUint32(p + 4, little),
      posicaoValor: p + 8
    })
  }
  const proximo = p + 4 <= view.byteLength ? view.getUint32(p, little) : 0
  return { entradas, proximo }
}

// percorre IFD0, seus SubIFDs e os IFDs seguintes juntando as prévias JPEG
const localizarPrevias = (view: DataView, little: boolean, primeiroIfd: number) => {
  const previas: { offset: number; tamanho: number }[] = []
  const visitados = new Set<number>()
  const fila = [primeiroIfd]

  while (fila.length > 0 && visitados.size < 32) {
    const offset = fila.shift()!
    if (offset <= 0 || visitados.has(offset)) continue
    visitados.add(offset)

    const { entradas, proximo } = lerIfd(view, little, offset)
    const um = (tag: number) => {
      const e = entradas.get(tag)
      return e ? lerValores(view, little, e)[0] : undefined
    }

    const jpegOffset = um(TAG_JPEG_OFFSET)
    const jpegTamanho = um(TAG_JPEG_TAMANHO)
    if (jpegOffset && jpegTamanho) previas.push({ offset: jpegOffset, tamanho: jpegTamanho })

    // imagem inteira comprimida em JPEG (compressão 7): normalmente uma única faixa
    if (um(TAG_COMPRESSAO) === 7) {
      const inicio = um(TAG_STRIP_OFFSETS)
      const bytes = um(TAG_STRIP_BYTES)
      if (inicio && bytes) previas.push({ offset: inicio, tamanho: bytes })
    }

    const subIfds = entradas.get(TAG_SUB_IFDS)
    if (subIfds) fila.push(...lerValores(view, little, subIfds))
    if (proximo) fila.push(proximo)
  }
  return previas
}

// último recurso: procura o maior bloco JPEG (FFD8...FFD9) dentro do arquivo
const varrerJpeg = (bytes: Uint8Array) => {
  let melhor: { offset: number; tamanho: number } | null = null
  for (let i = 0; i + 3 < bytes.length; i++) {
    if (bytes[i] !== 0xff || bytes[i + 1] !== 0xd8 || bytes[i + 2] !== 0xff) continue
    for (let j = i + 2; j + 1 < bytes.length; j++) {
      if (bytes[j] === 0xff && bytes[j + 1] === 0xd9) {
        const tamanho = j + 2 - i
        if (!melhor || tamanho > melhor.tamanho) melhor = { offset: i, tamanho }
        i = j + 1
        break
      }
    }
  }
  return melhor
}

const extrairPreviaDng = async (file: File): Promise<Blob> => {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const view = new DataView(buffer)

  let previas: { offset: number; tamanho: number }[] = []
  if (buffer.byteLength >= 8) {
    const marca = view.getUint16(0, true)
    const little = marca === 0x4949
    const bigEndian = marca === 0x4d4d
    if ((little || bigEndian) && view.getUint16(2, little) === 42) {
      previas = localizarPrevias(view, little, view.getUint32(4, little))
    }
  }

  // fica só com blocos que realmente começam com o marcador JPEG
  const validas = previas.filter(p =>
    p.offset > 0 &&
    p.offset + p.tamanho <= bytes.length &&
    bytes[p.offset] === 0xff &&
    bytes[p.offset + 1] === 0xd8
  )
  const escolhida = validas.sort((a, b) => b.tamanho - a.tamanho)[0] ?? varrerJpeg(bytes)
  if (!escolhida) throw new Error(`Sem prévia JPEG em ${file.name}`)

  return new Blob([bytes.slice(escolhida.offset, escolhida.offset + escolhida.tamanho)], {
    type: 'image/jpeg'
  })
}

// ---- entrada única usada pelo app ----

export const converterSePreciso = async (file: File): Promise<File> => {
  if (ehHeic(file)) {
    const heic2any = (await import('heic2any')).default
    const convertido = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })
    const blob = Array.isArray(convertido) ? convertido[0] : convertido
    return paraArquivoJpeg(blob as Blob, file.name)
  }
  if (ehDng(file)) {
    return paraArquivoJpeg(await extrairPreviaDng(file), file.name)
  }
  return file
}
