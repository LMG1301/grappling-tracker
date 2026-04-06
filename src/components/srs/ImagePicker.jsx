import { useState, useRef, useCallback } from 'react'
import { Camera, Youtube, Check, RefreshCw, ImageIcon } from 'lucide-react'
import { extractYoutubeId, getYoutubeThumbnail } from '../../lib/srs/youtube'
import { uploadSrsImage } from '../../lib/srs/image'
import { useAuth } from '../../hooks/useAuth'

export default function ImagePicker({ imageUrl, videoUrl, onImageChange, onVideoChange }) {
  const { user } = useAuth()
  const [mode, setMode] = useState(videoUrl ? 'youtube' : imageUrl ? 'photo' : null) // null | 'youtube' | 'photo'
  const [ytInput, setYtInput] = useState(videoUrl || '')
  const [ytId, setYtId] = useState(videoUrl ? extractYoutubeId(videoUrl) : null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const previewUrl = ytId
    ? getYoutubeThumbnail(ytId)
    : imageUrl || null

  // YouTube paste/change handler
  const handleYtChange = useCallback((value) => {
    setYtInput(value)
    const id = extractYoutubeId(value)
    setYtId(id)
    if (id) {
      onVideoChange(value)
      onImageChange(getYoutubeThumbnail(id))
    }
  }, [onVideoChange, onImageChange])

  // Photo upload handler
  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Immediate preview
    const localUrl = URL.createObjectURL(file)
    onImageChange(localUrl)
    setMode('photo')

    // Upload
    setUploading(true)
    try {
      const publicUrl = await uploadSrsImage(user.id, file)
      onImageChange(publicUrl)
    } catch (err) {
      console.error('Upload failed:', err)
    }
    setUploading(false)
  }, [user, onImageChange])

  return (
    <div className="space-y-2">
      {/* Preview area */}
      <div className="w-full aspect-video rounded-xl overflow-hidden bg-[#EEEDE8] relative">
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
            {mode === 'photo' && !uploading && (
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/50 text-white text-[10px] font-medium border-none backdrop-blur-sm"
              >
                Changer
              </button>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <ImageIcon className="w-10 h-10 text-[#C8C6BF]" />
            <span className="text-xs text-[#A8A6A0] mt-1">Image de la position</span>
          </div>
        )}
      </div>

      {/* Input mode selector + inputs */}
      {!mode ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode('youtube')}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-dojo-border text-sm font-medium text-dojo-text hover:bg-dojo-surface transition-colors"
          >
            <Youtube className="w-4 h-4 text-red-500" />
            Lien YouTube
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-dojo-border text-sm font-medium text-dojo-text hover:bg-dojo-surface transition-colors"
          >
            <Camera className="w-4 h-4 text-dojo-accent" />
            Photo
          </button>
        </div>
      ) : mode === 'youtube' ? (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
            <input
              type="url"
              value={ytInput}
              onChange={(e) => handleYtChange(e.target.value)}
              onPaste={(e) => {
                setTimeout(() => handleYtChange(e.target.value), 0)
              }}
              placeholder="Coller le lien YouTube..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white border border-dojo-border text-sm text-dojo-text placeholder:text-dojo-muted/50 outline-none focus:border-dojo-accent"
              style={{ fontSize: '16px' }}
              autoFocus
            />
            {ytId && (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
            )}
          </div>
          <button
            onClick={() => { setMode(null); setYtInput(''); setYtId(null); onVideoChange(''); onImageChange('') }}
            className="text-xs text-dojo-muted hover:text-dojo-text bg-transparent border-none p-1"
          >
            Annuler
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-dojo-border text-xs font-medium text-dojo-text hover:bg-dojo-surface transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            Changer la photo
          </button>
          <button
            onClick={() => { setMode(null); onImageChange('') }}
            className="text-xs text-dojo-muted hover:text-dojo-text bg-transparent border-none p-1"
          >
            Supprimer
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
