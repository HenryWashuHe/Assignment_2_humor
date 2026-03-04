'use client'

export default function ImageThumbnail({ url }: { url: string | null }) {
  if (!url) return <div className="h-12 w-12 rounded bg-zinc-100" />
  return (
    <img
      src={url}
      alt=""
      className="h-12 w-12 rounded object-cover"
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
    />
  )
}
