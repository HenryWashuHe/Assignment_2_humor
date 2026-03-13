'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Example {
  id: number
  image_description: string
  caption: string
  explanation: string
  priority: number
  image_id: string | null
}

export default function CaptionExampleForm({ example }: { example?: Example }) {
  const router = useRouter()
  const isEdit = !!example
  const [form, setForm] = useState({
    image_description: example?.image_description ?? '',
    caption: example?.caption ?? '',
    explanation: example?.explanation ?? '',
    priority: example?.priority ?? 0,
    image_id: example?.image_id ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update<K extends keyof typeof form>(field: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const url = isEdit ? `/api/caption-examples/${example!.id}` : '/api/caption-examples'
      const method = isEdit ? 'PATCH' : 'POST'
      const payload = {
        ...form,
        image_id: form.image_id.trim() || null,
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Failed to save')
      }
      router.push('/caption-examples')
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
          <span className="mt-px shrink-0 text-red-400" aria-hidden="true">⚠</span>
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-700">Image Description <span className="text-red-500">*</span></label>
        <textarea
          value={form.image_description}
          onChange={(e) => update('image_description', e.target.value)}
          required
          rows={2}
          className="w-full resize-none rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/10"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-700">Caption <span className="text-red-500">*</span></label>
        <textarea
          value={form.caption}
          onChange={(e) => update('caption', e.target.value)}
          required
          rows={2}
          className="w-full resize-none rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/10"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-700">Explanation <span className="text-red-500">*</span></label>
        <textarea
          value={form.explanation}
          onChange={(e) => update('explanation', e.target.value)}
          required
          rows={3}
          className="w-full resize-none rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/10"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-zinc-700">Priority</label>
          <input
            type="number"
            value={form.priority}
            onChange={(e) => update('priority', Number(e.target.value))}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-mono text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/10"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-zinc-700">Image ID (UUID)</label>
          <input
            type="text"
            value={form.image_id}
            onChange={(e) => update('image_id', e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-mono text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/10"
            placeholder="Optional UUID"
          />
        </div>
      </div>

      <div className="flex gap-3 border-t border-zinc-100 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />}
          {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Example'}
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
