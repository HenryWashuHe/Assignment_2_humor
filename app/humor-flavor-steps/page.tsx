import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

export default async function HumorFlavorStepsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()
  const { data: steps, count } = await supabase
    .from('humor_flavor_steps')
    .select(
      'id, order_by, description, llm_temperature, llm_system_prompt, llm_user_prompt, humor_flavor_id, humor_flavors(slug), llm_models(name)',
      { count: 'exact' }
    )
    .order('humor_flavor_id', { ascending: true })
    .order('order_by', { ascending: true })
    .range(from, to)

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1
  const stepList = steps ?? []

  return (
    <div className="animate-fade-up">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Humor</p>
          <h1 className="mt-0.5 text-2xl font-bold text-zinc-900">Humor Flavor Steps</h1>
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
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-16">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400">Flavor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-16">Order</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400">Model</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-20">Temp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {stepList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-sm text-zinc-400">No steps found</td>
                </tr>
              ) : (
                stepList.map((s) => {
                  const flavor = Array.isArray(s.humor_flavors) ? s.humor_flavors[0] : s.humor_flavors
                  const model = Array.isArray(s.llm_models) ? s.llm_models[0] : s.llm_models
                  return (
                    <tr key={s.id} className="hover:bg-zinc-50 transition-colors duration-100">
                      <td className="px-4 py-3 text-xs font-mono text-zinc-400">{s.id}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                          {(flavor as { slug?: string } | null)?.slug ?? `#${s.humor_flavor_id}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-xs text-zinc-500">{s.order_by}</td>
                      <td className="px-4 py-3 max-w-xs">
                        <span className="block truncate text-zinc-600">{s.description ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {(model as { name?: string } | null)?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-zinc-400">
                        {s.llm_temperature != null ? Number(s.llm_temperature).toFixed(1) : '—'}
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
            <a href={`/humor-flavor-steps?page=${page - 1}`} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-medium hover:bg-zinc-50 transition-colors duration-100">
              ← Previous
            </a>
          )}
          <span className="px-2 text-zinc-400">
            Page <span className="font-semibold text-zinc-700">{page}</span> of {totalPages}
          </span>
          {page < totalPages && (
            <a href={`/humor-flavor-steps?page=${page + 1}`} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-medium hover:bg-zinc-50 transition-colors duration-100">
              Next →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
