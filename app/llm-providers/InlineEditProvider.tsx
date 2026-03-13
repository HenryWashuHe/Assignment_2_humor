'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function InlineEditProvider({ id, name }: { id: number; name: string }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!value.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/llm-providers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: value.trim() }),
      })
      if (!res.ok) throw new Error('Save failed')
      setEditing(false)
      router.refresh()
    } catch {
      alert('Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-sm font-medium text-zinc-800 hover:text-zinc-600 transition-colors duration-100"
      >
        {name}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded-lg border border-zinc-300 px-2 py-1 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/10"
        autoFocus
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
      />
      <button onClick={handleSave} disabled={saving} className="text-xs font-medium text-emerald-700 hover:text-emerald-900 disabled:opacity-50">
        {saving ? '…' : 'Save'}
      </button>
      <button onClick={() => setEditing(false)} className="text-xs text-zinc-400 hover:text-zinc-600">
        Cancel
      </button>
    </div>
  )
}
