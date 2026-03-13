import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export default async function HumorFlavorsPage() {
  const supabase = await createClient()
  const { data: flavors, count } = await supabase
    .from('humor_flavors')
    .select('id, slug, description, created_datetime_utc', { count: 'exact' })
    .order('id', { ascending: true })

  const flavorList = flavors ?? []

  return (
    <div className="animate-fade-up">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Humor</p>
          <h1 className="mt-0.5 text-2xl font-bold text-zinc-900">Humor Flavors</h1>
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
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400">Slug</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400">Description</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-28">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {flavorList.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-16 text-center text-sm text-zinc-400">No humor flavors found</td>
              </tr>
            ) : (
              flavorList.map((f) => (
                <tr key={f.id} className="hover:bg-zinc-50 transition-colors duration-100">
                  <td className="px-4 py-3 text-xs font-mono text-zinc-400">{f.id}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                      {f.slug}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-md text-zinc-600">
                    <span className="block truncate">{f.description ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">
                    {f.created_datetime_utc ? new Date(f.created_datetime_utc).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
