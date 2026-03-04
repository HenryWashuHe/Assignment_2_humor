import { createClient } from '@/lib/supabase-server'
import FilterBar from './FilterBar'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

interface SearchParams {
  page?: string
  superadmin?: string
  study?: string
  sort?: string
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const superadminFilter = params.superadmin // 'true' | 'false' | undefined
  const studyFilter = params.study           // 'true' | 'false' | undefined
  const sort = params.sort === 'asc' ? true : false
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()
  let query = supabase
    .from('profiles')
    .select('id, first_name, last_name, email, is_superadmin, is_in_study, created_datetime_utc', { count: 'exact' })
    .order('created_datetime_utc', { ascending: sort })
    .range(from, to)

  if (superadminFilter === 'true') query = query.eq('is_superadmin', true)
  if (superadminFilter === 'false') query = query.eq('is_superadmin', false)
  if (studyFilter === 'true') query = query.eq('is_in_study', true)
  if (studyFilter === 'false') query = query.eq('is_in_study', false)

  const { data: users, count } = await query
  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1

  function pageUrl(p: number) {
    const sp = new URLSearchParams()
    sp.set('page', String(p))
    if (superadminFilter) sp.set('superadmin', superadminFilter)
    if (studyFilter) sp.set('study', studyFilter)
    if (params.sort) sp.set('sort', params.sort)
    return `/users?${sp}`
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Users</h1>
        <span className="text-sm text-zinc-400">{count ?? 0} total</span>
      </div>

      <FilterBar
        filters={[
          {
            key: 'superadmin',
            label: 'Superadmin',
            value: superadminFilter,
            options: [
              { label: 'All', value: '' },
              { label: 'Yes', value: 'true' },
              { label: 'No', value: 'false' },
            ],
          },
          {
            key: 'study',
            label: 'In Study',
            value: studyFilter,
            options: [
              { label: 'All', value: '' },
              { label: 'Yes', value: 'true' },
              { label: 'No', value: 'false' },
            ],
          },
          {
            key: 'sort',
            label: 'Created',
            value: params.sort,
            options: [
              { label: 'Newest first', value: '' },
              { label: 'Oldest first', value: 'asc' },
            ],
          },
        ]}
      />

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Superadmin</th>
              <th className="px-4 py-3 font-medium">In Study</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {(users ?? []).map((u) => (
              <tr key={u.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 text-zinc-700">
                  {u.first_name || u.last_name
                    ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()
                    : <span className="text-zinc-400">—</span>}
                </td>
                <td className="px-4 py-3 text-zinc-700">{u.email ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${u.is_superadmin ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                    {u.is_superadmin ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${u.is_in_study ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-500'}`}>
                    {u.is_in_study ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-400">
                  {u.created_datetime_utc ? new Date(u.created_datetime_utc).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
            {(users ?? []).length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-zinc-400">No users found</td></tr>
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
