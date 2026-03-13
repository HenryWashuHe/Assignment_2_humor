'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Provider { id: number; name: string }
interface Model {
  id: number
  name: string
  provider_model_id: string
  llm_provider_id: number
  is_temperature_supported: boolean
}

export default function LlmModelForm({
  model,
  providers,
}: {
  model?: Model
  providers: Provider[]
}) {
  const router = useRouter()
  const isEdit = !!model
  const [form, setForm] = useState({
    name: model?.name ?? '',
    provider_model_id: model?.provider_model_id ?? '',
    llm_provider_id: model?.llm_provider_id ?? (providers[0]?.id ?? 0),
    is_temperature_supported: model?.is_temperature_supported ?? false,
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
      const url = isEdit ? `/api/llm-models/${model!.id}` : '/api/llm-models'
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
      router.push('/llm-models')
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
        <label className="block text-sm font-medium text-zinc-700">Display Name <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/10"
          placeholder="e.g. Claude 3.5 Sonnet"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-700">Provider Model ID <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={form.provider_model_id}
          onChange={(e) => update('provider_model_id', e.target.value)}
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-mono text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/10"
          placeholder="e.g. claude-3-5-sonnet-20241022"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-700">Provider <span className="text-red-500">*</span></label>
        <select
          value={form.llm_provider_id}
          onChange={(e) => update('llm_provider_id', Number(e.target.value))}
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/10"
        >
          {providers.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-zinc-700">
        <input
          type="checkbox"
          checked={form.is_temperature_supported}
          onChange={(e) => update('is_temperature_supported', e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
        />
        Temperature Supported
      </label>

      <div className="flex gap-3 border-t border-zinc-100 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />}
          {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Model'}
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
