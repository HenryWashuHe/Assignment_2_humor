import { createClient } from '@/lib/supabase-server'
import TermForm from '../TermForm'

export const dynamic = 'force-dynamic'

export default async function NewTermPage() {
  const supabase = await createClient()
  const { data: termTypes } = await supabase
    .from('term_types')
    .select('id, name')
    .order('name')

  return (
    <div className="animate-fade-up max-w-lg">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Terms</p>
        <h1 className="mt-0.5 text-2xl font-bold text-zinc-900">New Term</h1>
      </div>
      <TermForm termTypes={termTypes ?? []} />
    </div>
  )
}
