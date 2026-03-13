import { createClient } from '@/lib/supabase-server'
import HumorMixRow from './HumorMixRow'

export const dynamic = 'force-dynamic'

export default async function HumorMixPage() {
  const supabase = await createClient()
  const { data: mix } = await supabase
    .from('humor_flavor_mix')
    .select('id, caption_count, humor_flavor_id, humor_flavors(slug)')
    .order('id', { ascending: true })

  const mixList = mix ?? []

  return (
    <div className="animate-fade-up max-w-xl">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Humor</p>
        <h1 className="mt-0.5 text-2xl font-bold text-zinc-900">Humor Mix</h1>
        <p className="mt-1 text-sm text-zinc-400">Configure how many captions each flavor generates.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400">Flavor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-32">Caption Count</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-20">Save</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {mixList.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-16 text-center text-sm text-zinc-400">No mix entries found</td>
              </tr>
            ) : (
              mixList.map((m) => {
                const flavor = Array.isArray(m.humor_flavors) ? m.humor_flavors[0] : m.humor_flavors
                return (
                  <HumorMixRow
                    key={m.id}
                    id={m.id}
                    slug={(flavor as { slug?: string } | null)?.slug ?? `Flavor #${m.humor_flavor_id}`}
                    captionCount={m.caption_count}
                  />
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
