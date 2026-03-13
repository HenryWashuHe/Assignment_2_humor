'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteButton({ id }: { id: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Remove this domain? Users from this domain may no longer sign up.')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/allowed-domains/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      router.refresh()
    } catch {
      alert('Failed to remove domain.')
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
      {loading ? '…' : 'Remove'}
    </button>
  )
}
