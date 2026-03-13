'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface TermType { id: number; name: string }
interface Term {
  id: number
  term: string
  definition: string
  example: string
  priority: number
  term_type_id: number | null
}

export default function TermForm({
  term,
  termTypes,
}: {
  term?: Term
  termTypes: TermType[]
}) {
  const router = useRouter()
  const isEdit = !!term
  const [form, setForm] = useState({
    term: term?.term ?? '',
    definition: term?.definition ?? '',
    example: term?.example ?? '',
    priority: term?.priority ?? 0,
    term_type_id: term?.term_type_id ?? null as number | null,
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
      const url = isEdit ? `/api/terms/${term!.id}` : '/api/terms'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Failed to save')
      }
      router.push('/terms')
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
        <label className="block text-sm font-medium text-zinc-700">Term <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={form.term}
          onChange={(e) => update('term', e.target.value)}
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/10"
          placeholder="e.g. Slapstick"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-700">Definition <span className="text-red-500">*</span></label>
        <textarea
          value={form.definition}
          onChange={(e) => update('definition', e.target.value)}
          required
          rows={3}
          className="w-full resize-none rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/10"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-700">Example <span className="text-red-500">*</span></label>
        <textarea
          value={form.example}
          onChange={(e) => update('example', e.target.value)}
          required
          rows={2}
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
          <label className="block text-sm font-medium text-zinc-700">Type</label>
          <select
            value={form.term_type_id ?? ''}
            onChange={(e) => update('term_type_id', e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/10"
          >
            <option value="">None</option>
            {termTypes.map((tt) => (
              <option key={tt.id} value={tt.id}>{tt.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3 border-t border-zinc-100 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />}
          {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Term'}
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
