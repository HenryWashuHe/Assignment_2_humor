import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import TermForm from '../../TermForm'

export const dynamic = 'force-dynamic'

export default async function EditTermPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: term }, { data: termTypes }] = await Promise.all([
    supabase
      .from('terms')
      .select('id, term, definition, example, priority, term_type_id')
      .eq('id', id)
      .single(),
    supabase.from('term_types').select('id, name').order('name'),
  ])

  if (!term) notFound()

  return (
    <div className="animate-fade-up max-w-lg">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Terms</p>
        <h1 className="mt-0.5 text-2xl font-bold text-zinc-900">Edit Term</h1>
      </div>
      <TermForm term={term} termTypes={termTypes ?? []} />
    </div>
  )
}
