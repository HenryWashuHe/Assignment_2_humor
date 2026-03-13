import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

export default async function CaptionRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()
  const { data: requests, count } = await supabase
    .from('caption_requests')
    .select(
      'id, created_datetime_utc, profile_id, image_id, profiles(email), images(url)',
      { count: 'exact' }
    )
    .order('created_datetime_utc', { ascending: false })
    .range(from, to)

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1
  const list = requests ?? []

  return (
    <div className="animate-fade-up">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Captions</p>
          <h1 className="mt-0.5 text-2xl font-bold text-zinc-900">Caption Requests</h1>
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
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400">Image</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-28">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center text-sm text-zinc-400">No caption requests found</td>
                </tr>
              ) : (
                list.map((r) => {
                  const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
                  const image = Array.isArray(r.images) ? r.images[0] : r.images
                  return (
                    <tr key={r.id} className="hover:bg-zinc-50 transition-colors duration-100">
                      <td className="px-4 py-3 text-xs font-mono text-zinc-400">{r.id}</td>
                      <td className="px-4 py-3 text-xs text-zinc-600">
                        {(profile as { email?: string } | null)?.email ?? r.profile_id.slice(0, 8) + '…'}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <span className="block truncate text-xs text-zinc-500 font-mono">
                          {(image as { url?: string } | null)?.url ?? r.image_id}
                        </span>
                      </td>
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
            <a href={`/caption-requests?page=${page - 1}`} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-medium hover:bg-zinc-50 transition-colors duration-100">
              ← Previous
            </a>
          )}
          <span className="px-2 text-zinc-400">
            Page <span className="font-semibold text-zinc-700">{page}</span> of {totalPages}
          </span>
          {page < totalPages && (
            <a href={`/caption-requests?page=${page + 1}`} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-medium hover:bg-zinc-50 transition-colors duration-100">
              Next →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
