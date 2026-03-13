import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import DeleteCaptionExampleButton from './DeleteButton'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

export default async function CaptionExamplesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()
  const { data: examples, count } = await supabase
    .from('caption_examples')
    .select('id, image_description, caption, explanation, priority, image_id', { count: 'exact' })
    .order('priority', { ascending: false })
    .order('id', { ascending: true })
    .range(from, to)

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1
  const list = examples ?? []

  return (
    <div className="animate-fade-up">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Captions</p>
          <h1 className="mt-0.5 text-2xl font-bold text-zinc-900">Caption Examples</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">
            {count ?? 0} total
          </span>
          <Link
            href="/caption-examples/new"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-zinc-800"
          >
            + New Example
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400">Caption</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400">Image Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-16">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center text-sm text-zinc-400">No caption examples found</td>
                </tr>
              ) : (
                list.map((ex) => (
                  <tr key={ex.id} className="hover:bg-zinc-50 transition-colors duration-100">
                    <td className="px-4 py-3 max-w-xs">
                      <span className="block truncate font-medium text-zinc-800">{ex.caption}</span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <span className="block truncate text-zinc-500">{ex.image_description}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-mono text-zinc-400">{ex.priority}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/caption-examples/${ex.id}/edit`}
                          className="text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors duration-100"
                        >
                          Edit
                        </Link>
                        <DeleteCaptionExampleButton id={ex.id} />
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
            <a href={`/caption-examples?page=${page - 1}`} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-medium hover:bg-zinc-50 transition-colors duration-100">
              ← Previous
            </a>
          )}
          <span className="px-2 text-zinc-400">
            Page <span className="font-semibold text-zinc-700">{page}</span> of {totalPages}
          </span>
          {page < totalPages && (
            <a href={`/caption-examples?page=${page + 1}`} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-medium hover:bg-zinc-50 transition-colors duration-100">
              Next →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
