import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import DeleteButton from './DeleteButton'

export const dynamic = 'force-dynamic'

export default async function LlmModelsPage() {
  const supabase = await createClient()
  const [{ data: models, count }] = await Promise.all([
    supabase
      .from('llm_models')
      .select('id, name, provider_model_id, is_temperature_supported, llm_provider_id, llm_providers(name)', { count: 'exact' })
      .order('id', { ascending: true }),
    supabase.from('llm_providers').select('id, name').order('name'),
  ])

  const list = models ?? []

  return (
    <div className="animate-fade-up">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">LLM</p>
          <h1 className="mt-0.5 text-2xl font-bold text-zinc-900">LLM Models</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">
            {count ?? 0} total
          </span>
          <Link
            href="/llm-models/new"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-zinc-800"
          >
            + New Model
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-16">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400">Provider Model ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400">Provider</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-28">Temp Support</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-sm text-zinc-400">No models found</td>
                </tr>
              ) : (
                list.map((m) => {
                  const provider = Array.isArray(m.llm_providers) ? m.llm_providers[0] : m.llm_providers
                  return (
                    <tr key={m.id} className="hover:bg-zinc-50 transition-colors duration-100">
                      <td className="px-4 py-3 text-xs font-mono text-zinc-400">{m.id}</td>
                      <td className="px-4 py-3 font-medium text-zinc-800">{m.name}</td>
                      <td className="px-4 py-3 text-xs font-mono text-zinc-500">{m.provider_model_id}</td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {(provider as { name?: string } | null)?.name ?? `#${m.llm_provider_id}`}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${m.is_temperature_supported ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                          {m.is_temperature_supported ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/llm-models/${m.id}/edit`}
                            className="text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors duration-100"
                          >
                            Edit
                          </Link>
                          <DeleteButton id={m.id} />
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
