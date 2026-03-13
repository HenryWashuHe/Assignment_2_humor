'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteButton({ id }: { id: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this model? This may affect existing data.')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/llm-models/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      router.refresh()
    } catch {
      alert('Failed to delete model.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-red-500 underline hover:text-red-700 disabled:opacity-50"
    >
      {loading ? '…' : 'Delete'}
    </button>
  )
}
