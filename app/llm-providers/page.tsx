import { createClient } from '@/lib/supabase-server'
import DeleteButton from './DeleteButton'
import InlineEditProvider from './InlineEditProvider'
import AddProviderForm from './AddProviderForm'

export const dynamic = 'force-dynamic'

export default async function LlmProvidersPage() {
  const supabase = await createClient()
  const { data: providers, count } = await supabase
    .from('llm_providers')
    .select('id, name, created_datetime_utc', { count: 'exact' })
    .order('id', { ascending: true })

  const list = providers ?? []

  return (
    <div className="animate-fade-up max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">LLM</p>
          <h1 className="mt-0.5 text-2xl font-bold text-zinc-900">LLM Providers</h1>
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">
          {count ?? 0} total
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-16">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-28">Created</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {list.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-zinc-400">No providers yet</td>
              </tr>
            ) : (
              list.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50 transition-colors duration-100">
                  <td className="px-4 py-3 text-xs font-mono text-zinc-400">{p.id}</td>
                  <td className="px-4 py-3">
                    <InlineEditProvider id={p.id} name={p.name} />
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">
                    {p.created_datetime_utc ? new Date(p.created_datetime_utc).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <DeleteButton id={p.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Add Provider</h2>
        <AddProviderForm />
      </div>
    </div>
  )
}
