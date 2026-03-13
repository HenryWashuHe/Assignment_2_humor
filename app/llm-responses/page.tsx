import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

export default async function LlmResponsesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()
  const { data: responses, count } = await supabase
    .from('llm_model_responses')
    .select(
      'id, created_datetime_utc, processing_time_seconds, llm_temperature, llm_model_id, humor_flavor_id, llm_models(name), humor_flavors(slug)',
      { count: 'exact' }
    )
    .order('created_datetime_utc', { ascending: false })
    .range(from, to)

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1
  const list = responses ?? []

  return (
    <div className="animate-fade-up">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">LLM</p>
          <h1 className="mt-0.5 text-2xl font-bold text-zinc-900">LLM Responses</h1>
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">
          {count ?? 0} total
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400">Model</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400">Flavor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-20">Temp</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-24">Time (s)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-28">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-sm text-zinc-400">No responses found</td>
                </tr>
              ) : (
                list.map((r) => {
                  const model = Array.isArray(r.llm_models) ? r.llm_models[0] : r.llm_models
                  const flavor = Array.isArray(r.humor_flavors) ? r.humor_flavors[0] : r.humor_flavors
                  return (
                    <tr key={r.id} className="hover:bg-zinc-50 transition-colors duration-100">
                      <td className="px-4 py-3 text-xs text-zinc-600">
                        {(model as { name?: string } | null)?.name ?? `#${r.llm_model_id}`}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                          {(flavor as { slug?: string } | null)?.slug ?? `#${r.humor_flavor_id}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-zinc-400">
                        {r.llm_temperature != null ? Number(r.llm_temperature).toFixed(1) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-zinc-500">{r.processing_time_seconds}s</td>
                      <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">
                        {r.created_datetime_utc ? new Date(r.created_datetime_utc).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-5 flex items-center gap-2 text-sm text-zinc-600">
          {page > 1 && (
            <a href={`/llm-responses?page=${page - 1}`} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-medium hover:bg-zinc-50 transition-colors duration-100">
              ← Previous
            </a>
          )}
          <span className="px-2 text-zinc-400">
            Page <span className="font-semibold text-zinc-700">{page}</span> of {totalPages}
          </span>
          {page < totalPages && (
            <a href={`/llm-responses?page=${page + 1}`} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-medium hover:bg-zinc-50 transition-colors duration-100">
              Next →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
