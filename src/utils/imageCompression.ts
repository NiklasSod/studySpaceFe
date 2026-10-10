/**
 * Client-side image compression. Converts the image to WebP (quality 0.72)
 * and, if needed, progressively lowers quality and scales the image down until
 * it fits within `maxBytes`. Falls back to the original file when it is already
 * small enough.
 */

const DEFAULT_MAX_BYTES = 1024 * 1024 // 1 MB

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not read the selected image.'))
    }
    img.src = objectUrl
  })
}

function encode(
  img: HTMLImageElement,
  quality: number,
  maxDimension?: number,
): Promise<Blob | null> {
  const largestSide = Math.max(img.naturalWidth, img.naturalHeight)
  const scale =
    maxDimension === undefined ? 1 : Math.min(1, maxDimension / largestSide)

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))

  const context = canvas.getContext('2d')
  if (!context) return Promise.resolve(null)

  context.drawImage(img, 0, 0, canvas.width, canvas.height)

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/webp', quality)
  })
}

export async function compressImage(
  file: File,
  maxBytes: number = DEFAULT_MAX_BYTES,
): Promise<Blob> {
  if (file.type === 'image/webp' && file.size <= maxBytes) {
    return file
  }

  const img = await loadImage(file)

  let quality = 0.72
  let maxDimension: number | undefined

  for (let attempt = 0; attempt < 9; attempt += 1) {
    const blob = await encode(img, quality, maxDimension)
    if (blob && blob.size <= maxBytes) {
      return blob
    }

    // First lower the quality, then start scaling the image down.
    if (attempt < 3) {
      quality = Math.max(0.4, quality - 0.1)
    } else {
      const largestSide = Math.max(img.naturalWidth, img.naturalHeight)
      maxDimension = (maxDimension ?? largestSide) * 0.75
      quality = 0.72
    }
  }

  if (file.size <= maxBytes) {
    return file
  }

  throw new Error(
    'Could not compress the image below 1 MB. Please choose a smaller image.',
  )
}
