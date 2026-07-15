// Compressione lato client delle immagini prima del salvataggio in IndexedDB.
// Ridimensiona a max 1600px sul lato lungo e ricodifica in JPEG q=0.8.

const MAX_SIDE = 1600
const QUALITY = 0.8

function loadImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}

export async function compressImage(file) {
  try {
    const img = await loadImage(file)
    let { width, height } = img
    if (width > height && width > MAX_SIDE) {
      height = Math.round((height * MAX_SIDE) / width)
      width = MAX_SIDE
    } else if (height >= width && height > MAX_SIDE) {
      width = Math.round((width * MAX_SIDE) / height)
      height = MAX_SIDE
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, width, height)

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', QUALITY),
    )
    return blob || file
  } catch {
    // In caso di errore (formato non supportato) salva l'originale.
    return file
  }
}

// Conversioni base64 <-> Blob per il backup JSON.
export function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function dataURLToBlob(dataUrl) {
  const res = await fetch(dataUrl)
  return res.blob()
}
