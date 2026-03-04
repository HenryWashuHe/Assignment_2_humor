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
      const res = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Failed to create image')
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
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">New Image</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">URL</label>
          <input
            type="url"
            value={form.url}
            onChange={(e) => update('url', e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Additional Context</label>
          <textarea
            value={form.additional_context}
            onChange={(e) => update('additional_context', e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
          />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(e) => update('is_public', e.target.checked)}
              className="rounded"
            />
            Public
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={form.is_common_use}
              onChange={(e) => update('is_common_use', e.target.checked)}
              className="rounded"
            />
            Common Use
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create Image'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
