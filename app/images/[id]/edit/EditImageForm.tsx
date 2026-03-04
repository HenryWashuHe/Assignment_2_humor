'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ImageData {
  id: string
  url: string | null
  additional_context: string | null
  is_public: boolean | null
  is_common_use: boolean | null
}

export default function EditImageForm({ image }: { image: ImageData }) {
  const router = useRouter()
  const [form, setForm] = useState({
    url: image.url ?? '',
    additional_context: image.additional_context ?? '',
    is_public: image.is_public ?? false,
    is_common_use: image.is_common_use ?? false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(field: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/images/${image.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Failed to update image')
      }
      router.push('/images')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="mt-px text-red-400 shrink-0" aria-hidden="true">⚠</span>
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="edit-image-url" className="block text-sm font-medium text-zinc-700">
          Image URL <span className="text-red-500">*</span>
        </label>
        <input
          id="edit-image-url"
          type="url"
          value={form.url}
          onChange={(e) => update('url', e.target.value)}
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition-all duration-150 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/10"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="edit-image-context" className="block text-sm font-medium text-zinc-700">
          Additional Context
        </label>
        <p className="text-xs text-zinc-400">Optional description or notes about this image.</p>
        <textarea
          id="edit-image-context"
          value={form.additional_context}
          onChange={(e) => update('additional_context', e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition-all duration-150 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/10 resize-none"
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
            <span
              className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"
              aria-hidden="true"
            />
          )}
          {loading ? 'Saving…' : 'Save Changes'}
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
  )
}
