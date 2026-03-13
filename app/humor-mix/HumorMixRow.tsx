'use client'

import { useState } from 'react'

export default function HumorMixRow({
  id,
  slug,
  captionCount,
}: {
  id: number
  slug: string
  captionCount: number
}) {
  const [value, setValue] = useState(captionCount)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch(`/api/humor-mix/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption_count: value }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Failed to update')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <tr className="hover:bg-zinc-50 transition-colors duration-100">
      <td className="px-4 py-3">
        <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
          {slug}
        </span>
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          min={0}
          max={100}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-20 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm font-mono text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/10"
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-150 disabled:opacity-50 ${
            saved
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-zinc-900 text-white hover:bg-zinc-800'
          }`}
        >
          {saving ? '…' : saved ? 'Saved!' : 'Save'}
        </button>
      </td>
    </tr>
  )
}
