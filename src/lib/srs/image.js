import { supabase } from '../supabase'

// Compress image client-side: max 800px wide, JPEG 80%
export function compressImage(file, maxWidth = 800, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let w = img.width
      let h = img.height

      if (w > maxWidth) {
        h = Math.round((h * maxWidth) / w)
        w = maxWidth
      }

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)

      canvas.toBlob(
        (blob) => resolve(blob),
        'image/jpeg',
        quality
      )
    }

    img.src = url
  })
}

export async function uploadSrsImage(userId, file) {
  const compressed = await compressImage(file)
  const ext = 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('srs-images')
    .upload(path, compressed, { contentType: 'image/jpeg' })

  if (error) throw error

  const { data } = supabase.storage.from('srs-images').getPublicUrl(path)
  return data.publicUrl
}
