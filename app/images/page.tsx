import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import DeleteImageButton from './DeleteImageButton'
import ImageThumbnail from './ImageThumbnail'
import FilterBar from '../users/FilterBar'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

interface SearchParams {
  page?: string
  public?: string
  common_use?: string
  sort?: string
}

export default async function ImagesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const publicFilter = params.public
  const commonUseFilter = params.common_use
  const sort = params.sort === 'asc' ? true : false
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()
  let query = supabase
    .from('images')
    .select('id, url, is_public, is_common_use, created_datetime_utc', { count: 'exact' })
    .order('created_datetime_utc', { ascending: sort })
    .range(from, to)

  if (publicFilter === 'true') query = query.eq('is_public', true)
  if (publicFilter === 'false') query = query.eq('is_public', false)
  if (commonUseFilter === 'true') query = query.eq('is_common_use', true)
  if (commonUseFilter === 'false') query = query.eq('is_common_use', false)

  const { data: images, count } = await query
  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1

  function pageUrl(p: number) {
    const sp = new URLSearchParams()
    sp.set('page', String(p))
    if (publicFilter) sp.set('public', publicFilter)
    if (commonUseFilter) sp.set('common_use', commonUseFilter)
    if (params.sort) sp.set('sort', params.sort)
    return `/images?${sp}`
  }

  const imageList = images ?? []

  return (
    <div className="animate-fade-up">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Management</p>
          <h1 className="mt-0.5 text-2xl font-bold text-zinc-900">Images</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">
            {count ?? 0} total
          </span>
          <Link
            href="/images/new"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-zinc-800"
          >
            + New Image
          </Link>
        </div>
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
            key: 'common_use',
            label: 'Common Use',
            value: commonUseFilter,
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
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-20">Preview</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400">URL</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-24">Public</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-28">Common Use</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-28">Created</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {imageList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl text-zinc-300" aria-hidden="true">◈</span>
                      <p className="text-sm font-medium text-zinc-500">No images found</p>
                      <p className="text-xs text-zinc-400">
                        Try adjusting your filters, or{' '}
                        <Link href="/images/new" className="font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900">
                          add a new image
                        </Link>.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                imageList.map((img) => (
                  <tr key={img.id} className="hover:bg-zinc-50 transition-colors duration-100">
                    <td className="px-4 py-3">
                      <ImageThumbnail url={img.url} />
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <span
                        className="block truncate text-zinc-600"
                        title={img.url ?? ''}
                      >
                        {img.url ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${img.is_public ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                        {img.is_public ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${img.is_common_use ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-500'}`}>
                        {img.is_common_use ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">
                      {img.created_datetime_utc ? new Date(img.created_datetime_utc).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/images/${img.id}/edit`}
                          className="text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors duration-100"
                        >
                          Edit
                        </Link>
                        <DeleteImageButton id={img.id} />
                      </div>
                    </td>
                  </tr>
                ))
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
