'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddProviderForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/llm-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Failed to create')
      }
      setName('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Provider name (e.g. Anthropic)"
        className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/10"
      />
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-zinc-800 disabled:opacity-50"
      >
        {loading ? '…' : 'Add'}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  )
}
