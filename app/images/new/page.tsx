'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewImagePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    url: '',
    additional_context: '',
    is_public: false,
    is_common_use: false,
  })
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(field: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function uploadFile(f: File): Promise<string> {
    const fd = new FormData()
    fd.append('file', f)
    const res = await fetch('/api/images/upload', { method: 'POST', body: fd })
    if (!res.ok) {
      const body = await res.json()
      throw new Error(body.error ?? 'Upload failed')
    }
    const body = await res.json()
    return body.url as string
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      let url = form.url
      if (file) {
        setUploading(true)
        url = await uploadFile(file)
        setUploading(false)
      }
      if (!url) throw new Error('Provide a URL or select a file')
      const res = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, url }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Failed to create image')
      }
      router.push('/images')
      router.refresh()
    } catch (err) {
      setUploading(false)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-up max-w-lg">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Images</p>
        <h1 className="mt-0.5 text-2xl font-bold text-zinc-900">New Image</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="mt-px shrink-0 text-red-400" aria-hidden="true">⚠</span>
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="new-image-file" className="block text-sm font-medium text-zinc-700">
            Upload File
          </label>
          <input
            id="new-image-file"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null
              setFile(f)
              if (f) setForm((prev) => ({ ...prev, url: '' }))
            }}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1 file:text-xs file:font-medium file:text-zinc-700"
          />
          <p className="text-xs text-zinc-400">Or enter a URL below</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="new-image-url" className="block text-sm font-medium text-zinc-700">
            Image URL
          </label>
          <input
            id="new-image-url"
            type="url"
            value={form.url}
            onChange={(e) => {
              update('url', e.target.value)
              if (e.target.value) setFile(null)
            }}
            disabled={!!file}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition-all duration-150 placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/10 disabled:bg-zinc-50 disabled:text-zinc-400"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="new-image-context" className="block text-sm font-medium text-zinc-700">
            Additional Context
          </label>
          <textarea
            id="new-image-context"
            value={form.additional_context}
            onChange={(e) => update('additional_context', e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition-all duration-150 placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/10"
            placeholder="e.g. Shows a cartoon character laughing…"
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Visibility</p>
          <div className="flex gap-6">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-zinc-700">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(e) => update('is_public', e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
              />
              Public
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-zinc-700">
              <input
                type="checkbox"
                checked={form.is_common_use}
                onChange={(e) => update('is_common_use', e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
              />
              Common Use
            </label>
          </div>
        </div>

        <div className="flex gap-3 border-t border-zinc-100 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && (
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
            )}
            {uploading ? 'Uploading…' : loading ? 'Creating…' : 'Create Image'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors duration-150 hover:bg-zinc-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
