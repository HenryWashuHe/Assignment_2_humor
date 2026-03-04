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
  const superadminFilter = params.superadmin
  const studyFilter = params.study
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

  const userList = users ?? []

  return (
    <div className="animate-fade-up">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Management</p>
          <h1 className="mt-0.5 text-2xl font-bold text-zinc-900">Users</h1>
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">
          {count ?? 0} total
        </span>
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

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-sticky">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-44">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-28">Superadmin</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-24">In Study</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-28">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {userList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl text-zinc-300" aria-hidden="true">◉</span>
                      <p className="text-sm font-medium text-zinc-500">No users found</p>
                      <p className="text-xs text-zinc-400">Try adjusting your filters to see more results.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                userList.map((u) => {
                  const name = u.first_name || u.last_name
                    ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()
                    : null
                  return (
                    <tr key={u.id} className="hover:bg-zinc-50 transition-colors duration-100">
                      <td className="px-4 py-3 font-medium text-zinc-900 max-w-[11rem]">
                        {name
                          ? <span className="block truncate" title={name}>{name}</span>
                          : <span className="text-zinc-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 max-w-[16rem]">
                        <span className="block truncate" title={u.email ?? ''}>{u.email ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${u.is_superadmin ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                          {u.is_superadmin ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${u.is_in_study ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-500'}`}>
                          {u.is_in_study ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">
                        {u.created_datetime_utc ? new Date(u.created_datetime_utc).toLocaleDateString() : '—'}
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
            <a href={pageUrl(page - 1)} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-medium hover:bg-zinc-50 transition-colors duration-100">
              ← Previous
            </a>
          )}
          <span className="px-2 text-zinc-400">
            Page <span className="font-semibold text-zinc-700">{page}</span> of {totalPages}
          </span>
          {page < totalPages && (
            <a href={pageUrl(page + 1)} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-medium hover:bg-zinc-50 transition-colors duration-100">
              Next →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
