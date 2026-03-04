import { createClient } from '@/lib/supabase-server'
import FilterBar from '../users/FilterBar'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

interface SearchParams {
  page?: string
  public?: string
  featured?: string
  sort?: string
}

export default async function CaptionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const publicFilter = params.public
  const featuredFilter = params.featured
  const sort = params.sort ?? 'likes_desc'
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()
  let query = supabase
    .from('captions')
    .select('id, content, is_public, is_featured, like_count, created_datetime_utc, profile_id', { count: 'exact' })
    .range(from, to)

  if (publicFilter === 'true') query = query.eq('is_public', true)
  if (publicFilter === 'false') query = query.eq('is_public', false)
  if (featuredFilter === 'true') query = query.eq('is_featured', true)
  if (featuredFilter === 'false') query = query.eq('is_featured', false)

  if (sort === 'likes_asc') query = query.order('like_count', { ascending: true })
  else if (sort === 'date_desc') query = query.order('created_datetime_utc', { ascending: false })
  else if (sort === 'date_asc') query = query.order('created_datetime_utc', { ascending: true })
  else query = query.order('like_count', { ascending: false }) // default: likes_desc

  const { data: captions, count } = await query
  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1

  function pageUrl(p: number) {
    const sp = new URLSearchParams()
    sp.set('page', String(p))
    if (publicFilter) sp.set('public', publicFilter)
    if (featuredFilter) sp.set('featured', featuredFilter)
    if (sort !== 'likes_desc') sp.set('sort', sort)
    return `/captions?${sp}`
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Captions</h1>
        <span className="text-sm text-zinc-400">{count ?? 0} total</span>
      </div>

      <FilterBar
        filters={[
          {
            key: 'public',
            label: 'Public',
            value: publicFilter,
            options: [
              { label: 'All', value: '' },
              { label: 'Yes', value: 'true' },
              { label: 'No', value: 'false' },
            ],
          },
          {
            key: 'featured',
            label: 'Featured',
            value: featuredFilter,
            options: [
              { label: 'All', value: '' },
              { label: 'Yes', value: 'true' },
              { label: 'No', value: 'false' },
            ],
          },
          {
            key: 'sort',
            label: 'Sort by',
            value: sort === 'likes_desc' ? '' : sort,
            options: [
              { label: 'Most liked', value: '' },
              { label: 'Least liked', value: 'likes_asc' },
              { label: 'Newest', value: 'date_desc' },
              { label: 'Oldest', value: 'date_asc' },
            ],
          },
        ]}
      />

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Content</th>
              <th className="px-4 py-3 font-medium">Public</th>
              <th className="px-4 py-3 font-medium">Featured</th>
              <th className="px-4 py-3 font-medium">Likes</th>
              <th className="px-4 py-3 font-medium">Profile</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {(captions ?? []).map((c) => (
              <tr key={c.id} className="hover:bg-zinc-50">
                <td className="max-w-xs px-4 py-3">
                  <span className="block truncate text-zinc-700">{c.content ?? '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.is_public ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                    {c.is_public ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.is_featured ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-500'}`}>
                    {c.is_featured ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-zinc-900">{c.like_count}</td>
                <td className="max-w-[120px] px-4 py-3">
                  <span className="block truncate text-xs text-zinc-400">{c.profile_id?.slice(0, 8)}…</span>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-400">
                  {c.created_datetime_utc ? new Date(c.created_datetime_utc).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
            {(captions ?? []).length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-zinc-400">No captions found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center gap-2 text-sm text-zinc-600">
          {page > 1 && <a href={pageUrl(page - 1)} className="rounded-lg border border-zinc-200 px-3 py-1.5 hover:bg-zinc-50">Previous</a>}
          <span>Page {page} of {totalPages}</span>
          {page < totalPages && <a href={pageUrl(page + 1)} className="rounded-lg border border-zinc-200 px-3 py-1.5 hover:bg-zinc-50">Next</a>}
        </div>
      )}
    </div>
  )
}
