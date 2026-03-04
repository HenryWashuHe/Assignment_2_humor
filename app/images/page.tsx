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

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Images</h1>
        <Link href="/images/new" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">
          + New Image
        </Link>
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

      <p className="mb-2 text-xs text-zinc-400">{count ?? 0} images</p>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Thumbnail</th>
              <th className="px-4 py-3 font-medium">URL</th>
              <th className="px-4 py-3 font-medium">Public</th>
              <th className="px-4 py-3 font-medium">Common Use</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {(images ?? []).map((img) => (
              <tr key={img.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3"><ImageThumbnail url={img.url} /></td>
                <td className="max-w-xs px-4 py-3">
                  <span className="block truncate text-zinc-700">{img.url ?? '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${img.is_public ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                    {img.is_public ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${img.is_common_use ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-500'}`}>
                    {img.is_common_use ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-400">
                  {img.created_datetime_utc ? new Date(img.created_datetime_utc).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/images/${img.id}/edit`} className="text-xs text-zinc-600 underline hover:text-zinc-900">Edit</Link>
                    <DeleteImageButton id={img.id} />
                  </div>
                </td>
              </tr>
            ))}
            {(images ?? []).length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-zinc-400">No images found</td></tr>
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
