import { createClient } from '@/lib/supabase-server'
import StatCard from '@/components/StatCard'

export const dynamic = 'force-dynamic'

function pct(num: number, denom: number) {
  if (!denom) return 0
  return Math.round((num / denom) * 100)
}

async function fetchStats() {
  const supabase = await createClient()
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const [
    { count: totalUsers },
    { count: totalImages },
    { count: totalCaptions },
    { count: publicImages },
    { count: commonUseImages },
    { count: publicCaptions },
    { count: featuredCaptions },
    { count: studyUsers },
    { count: superadmins },
    { count: captionsThisWeek },
    { count: captionsLastWeek },
    { count: totalReports },
    { count: totalShares },
    { count: totalSaves },
    { count: totalVotes },
    { count: totalRequests },
    { data: topCaptions },
    { data: allCaptionLikes },
    { data: allContributors },
    { data: flavorData },
    { data: llmModelData },
    { data: voteData },
    { data: reportedCaptionsData },
    { data: topImagesData },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('images').select('*', { count: 'exact', head: true }),
    supabase.from('captions').select('*', { count: 'exact', head: true }),
    supabase.from('images').select('*', { count: 'exact', head: true }).eq('is_public', true),
    supabase.from('images').select('*', { count: 'exact', head: true }).eq('is_common_use', true),
    supabase.from('captions').select('*', { count: 'exact', head: true }).eq('is_public', true),
    supabase.from('captions').select('*', { count: 'exact', head: true }).eq('is_featured', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_in_study', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_superadmin', true),
    supabase.from('captions').select('*', { count: 'exact', head: true }).gte('created_datetime_utc', weekAgo.toISOString()),
    supabase.from('captions').select('*', { count: 'exact', head: true })
      .gte('created_datetime_utc', twoWeeksAgo.toISOString())
      .lt('created_datetime_utc', weekAgo.toISOString()),
    supabase.from('reported_captions').select('*', { count: 'exact', head: true }),
    supabase.from('shares').select('*', { count: 'exact', head: true }),
    supabase.from('caption_saved').select('*', { count: 'exact', head: true }),
    supabase.from('caption_votes').select('*', { count: 'exact', head: true }),
    supabase.from('caption_requests').select('*', { count: 'exact', head: true }),
    supabase.from('captions').select('id, content, like_count, is_featured').order('like_count', { ascending: false }).limit(10),
    supabase.from('captions').select('like_count').limit(2000),
    supabase.from('captions').select('profile_id').limit(2000),
    // Humor flavors joined with caption counts
    supabase.from('humor_flavors').select('id, slug, captions(like_count)').limit(20),
    // LLM model responses - avg processing time per model
    supabase.from('llm_model_responses').select('llm_model_id, processing_time_seconds').limit(2000),
    // Vote values distribution
    supabase.from('caption_votes').select('vote_value').limit(2000),
    // Reported captions with reasons
    supabase.from('reported_captions').select('reason').limit(500),
    // Top images by caption count
    supabase.from('images').select('id, url, captions(id)').limit(200),
  ])

  // Likes stats
  const allLikes = (allCaptionLikes ?? []).map(r => r.like_count ?? 0)
  const totalLikes = allLikes.reduce((a, b) => a + b, 0)
  const avgLikes = totalCaptions ? (totalLikes / totalCaptions).toFixed(1) : '0'
  const maxLikes = allLikes.length ? Math.max(...allLikes) : 1

  // WoW change
  const thisWeek = captionsThisWeek ?? 0
  const lastWeek = captionsLastWeek ?? 0
  const wowChange = lastWeek === 0 ? null : Math.round(((thisWeek - lastWeek) / lastWeek) * 100)

  // Top contributors
  const contributorMap = new Map<string, number>()
  for (const c of allContributors ?? []) {
    if (c.profile_id) contributorMap.set(c.profile_id, (contributorMap.get(c.profile_id) ?? 0) + 1)
  }
  const topContributors = [...contributorMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ id, count }))

  // Humor flavor stats
  const flavorStats = (flavorData ?? [])
    .map(f => {
      const captions = (f.captions as { like_count: number }[]) ?? []
      const captionCount = captions.length
      const totalLikesForFlavor = captions.reduce((a, c) => a + (c.like_count ?? 0), 0)
      const avgLikesForFlavor = captionCount ? (totalLikesForFlavor / captionCount).toFixed(1) : '0'
      return { slug: f.slug, captionCount, avgLikes: Number(avgLikesForFlavor) }
    })
    .filter(f => f.captionCount > 0)
    .sort((a, b) => b.captionCount - a.captionCount)
    .slice(0, 6)

  // LLM model performance
  const modelMap = new Map<number, number[]>()
  for (const r of llmModelData ?? []) {
    if (!modelMap.has(r.llm_model_id)) modelMap.set(r.llm_model_id, [])
    modelMap.get(r.llm_model_id)!.push(r.processing_time_seconds ?? 0)
  }
  const modelStats = [...modelMap.entries()]
    .map(([id, times]) => ({
      id,
      count: times.length,
      avgTime: (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Vote distribution
  const voteValues = (voteData ?? []).map(v => v.vote_value ?? 0)
  const avgVote = voteValues.length ? (voteValues.reduce((a, b) => a + b, 0) / voteValues.length).toFixed(2) : '0'
  const positiveVotes = voteValues.filter(v => v > 0).length
  const negativeVotes = voteValues.filter(v => v < 0).length

  // Top images by caption count
  const topImages = (topImagesData ?? [])
    .map(img => ({
      id: img.id,
      url: img.url,
      captionCount: (img.captions as { id: string }[])?.length ?? 0,
    }))
    .filter(img => img.captionCount > 0)
    .sort((a, b) => b.captionCount - a.captionCount)
    .slice(0, 5)

  // Caption request → caption conversion
  const conversionRate = (totalRequests ?? 0) > 0
    ? pct(totalCaptions ?? 0, totalRequests ?? 1)
    : null

  // Suppress unused variable warning
  void reportedCaptionsData

  return {
    totalUsers: totalUsers ?? 0, totalImages: totalImages ?? 0,
    totalCaptions: totalCaptions ?? 0, publicImages: publicImages ?? 0,
    commonUseImages: commonUseImages ?? 0, publicCaptions: publicCaptions ?? 0,
    featuredCaptions: featuredCaptions ?? 0, studyUsers: studyUsers ?? 0,
    superadmins: superadmins ?? 0, captionsThisWeek: thisWeek, captionsLastWeek: lastWeek,
    wowChange, totalLikes, avgLikes, maxLikes,
    totalReports: totalReports ?? 0, totalShares: totalShares ?? 0,
    totalSaves: totalSaves ?? 0, totalVotes: totalVotes ?? 0,
    totalRequests: totalRequests ?? 0, conversionRate,
    avgVote, positiveVotes, negativeVotes,
    topCaptions: topCaptions ?? [], topContributors,
    flavorStats, modelStats, topImages,
  }
}

export default async function DashboardPage() {
  const s = await fetchStats()
  const maxFlavor = s.flavorStats[0]?.captionCount ?? 1
  const maxContributor = s.topContributors[0]?.count ?? 1
  const maxModelCount = s.modelStats[0]?.count ?? 1
  const maxImageCaptions = s.topImages[0]?.captionCount ?? 1

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">Live analytics · Humor Study</p>
      </div>

      {/* Core metrics */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">Overview</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Users" value={s.totalUsers} description={`${s.superadmins} superadmin · ${s.studyUsers} in study`} accent="bg-violet-500" delay="delay-50" />
          <StatCard label="Images" value={s.totalImages} description={`${s.publicImages} public · ${s.commonUseImages} common use`} accent="bg-blue-500" delay="delay-100" />
          <StatCard label="Captions" value={s.totalCaptions} description={`${s.featuredCaptions} featured · ${s.publicCaptions} public`} accent="bg-emerald-500" delay="delay-150" />
          <StatCard label="Total Likes" value={s.totalLikes.toLocaleString()} description={`${s.avgLikes} avg per caption`} accent="bg-rose-500" delay="delay-200" />
          <StatCard label="Total Shares" value={s.totalShares.toLocaleString()} accent="bg-amber-500" delay="delay-250" />
          <StatCard label="Saves" value={s.totalSaves.toLocaleString()} accent="bg-cyan-500" delay="delay-300" />
          <StatCard label="Votes Cast" value={s.totalVotes.toLocaleString()} description={`avg vote: ${s.avgVote}`} accent="bg-indigo-500" delay="delay-350" />
          <StatCard label="Requests" value={s.totalRequests.toLocaleString()} description={s.conversionRate != null ? `${s.conversionRate}% → captions` : undefined} accent="bg-zinc-700" delay="delay-400" />
        </div>
      </section>

      {/* Engagement + activity */}
      <section className="animate-fade-up delay-200">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">Engagement</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {/* Study participation */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Study Participation</p>
            <p className="mt-2 text-4xl font-bold text-zinc-900">{Math.round((s.studyUsers / Math.max(s.totalUsers, 1)) * 100)}%</p>
            <p className="mb-3 text-xs text-zinc-400">{s.studyUsers} of {s.totalUsers} users enrolled</p>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
              <div className="animate-bar-grow h-2 rounded-full bg-blue-500 delay-500" style={{ width: `${Math.round((s.studyUsers / Math.max(s.totalUsers, 1)) * 100)}%` }} />
            </div>
          </div>

          {/* Vote sentiment */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Vote Sentiment</p>
            <p className="mt-2 text-4xl font-bold text-zinc-900">{s.avgVote}</p>
            <p className="mb-3 text-xs text-zinc-400">avg vote · {s.totalVotes} total</p>
            <div className="flex gap-2">
              <div className="flex-1">
                <p className="mb-1 text-xs text-emerald-600">👍 {s.positiveVotes}</p>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div className="animate-bar-grow h-2 rounded-full bg-emerald-400 delay-500" style={{ width: `${pct(s.positiveVotes, s.totalVotes)}%` }} />
                </div>
              </div>
              <div className="flex-1">
                <p className="mb-1 text-xs text-red-500">👎 {s.negativeVotes}</p>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div className="animate-bar-grow h-2 rounded-full bg-red-400 delay-600" style={{ width: `${pct(s.negativeVotes, s.totalVotes)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Caption activity WoW */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Caption Activity</p>
            <div className="mt-2 flex items-end gap-4">
              <div>
                <p className="text-xs text-zinc-400">This week</p>
                <p className="text-4xl font-bold text-zinc-900">{s.captionsThisWeek}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Last week</p>
                <p className="text-2xl font-semibold text-zinc-300">{s.captionsLastWeek}</p>
              </div>
              {s.wowChange !== null && (
                <span className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${s.wowChange >= 0 ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-red-50 text-red-600 ring-1 ring-red-200'}`}>
                  {s.wowChange >= 0 ? '+' : ''}{s.wowChange}%
                </span>
              )}
            </div>
            <div className="mt-4 flex h-14 items-end gap-2">
              {[s.captionsLastWeek, s.captionsThisWeek].map((val, i) => {
                const maxV = Math.max(s.captionsLastWeek, s.captionsThisWeek, 1)
                const h = Math.round((val / maxV) * 100)
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div className={`w-full rounded-t-lg transition-all duration-700 ${i === 1 ? 'bg-zinc-800' : 'bg-zinc-200'}`} style={{ height: `${h}%` }} />
                    <p className="text-xs text-zinc-400">{i === 0 ? 'Prev' : 'Curr'}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Humor Flavor Analysis */}
      {s.flavorStats.length > 0 && (
        <section className="animate-fade-up delay-300">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">Humor Flavor Performance</h2>
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
            <div className="space-y-4">
              {s.flavorStats.map((f, i) => (
                <div key={f.slug} className={`animate-fade-up delay-${(i + 1) * 50}`}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-zinc-700 capitalize">{f.slug.replace(/_/g, ' ')}</span>
                    <div className="flex gap-4 text-xs text-zinc-400">
                      <span>{f.captionCount} captions</span>
                      <span className="font-semibold text-zinc-700">⭐ {f.avgLikes} avg likes</span>
                    </div>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className={`animate-bar-grow h-2.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-400 delay-${300 + i * 50}`}
                      style={{ width: `${pct(f.captionCount, maxFlavor)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* LLM Model + Top Images */}
      <section className="animate-fade-up delay-400">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          {/* LLM model usage */}
          {s.modelStats.length > 0 && (
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
              <h3 className="mb-1 text-sm font-semibold text-zinc-700">AI Model Usage</h3>
              <p className="mb-4 text-xs text-zinc-400">Calls · avg processing time</p>
              <div className="space-y-3">
                {s.modelStats.map((m, i) => (
                  <div key={m.id} className={`animate-fade-up delay-${i * 50 + 100}`}>
                    <div className="mb-1 flex justify-between text-xs text-zinc-500">
                      <span className="font-medium">Model #{m.id}</span>
                      <span>{m.count} calls · <span className="font-semibold text-zinc-700">{m.avgTime}s avg</span></span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className={`animate-bar-grow h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-400 delay-${400 + i * 50}`}
                        style={{ width: `${pct(m.count, maxModelCount)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top images by captions */}
          {s.topImages.length > 0 && (
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
              <h3 className="mb-1 text-sm font-semibold text-zinc-700">Most Captioned Images</h3>
              <p className="mb-4 text-xs text-zinc-400">Images that inspired the most captions</p>
              <div className="space-y-3">
                {s.topImages.map((img, i) => (
                  <div key={img.id} className={`animate-fade-up delay-${i * 50 + 100}`}>
                    <div className="mb-1 flex items-center gap-2">
                      {img.url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img.url} alt="" className="h-7 w-7 rounded-md object-cover flex-shrink-0" />
                      )}
                      <div className="flex flex-1 items-center justify-between text-xs text-zinc-500">
                        <span className="truncate max-w-[160px]">
                          {img.url ? (() => { try { return new URL(img.url!).hostname } catch { return img.id.slice(0,8) } })() : img.id.slice(0,8)}
                        </span>
                        <span className="font-semibold text-zinc-700">{img.captionCount} captions</span>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className={`animate-bar-grow h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 delay-${400 + i * 50}`}
                        style={{ width: `${pct(img.captionCount, maxImageCaptions)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Top contributors */}
      <section className="animate-fade-up delay-400">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold text-zinc-700">Top Contributors</h3>
            <p className="mb-4 text-xs text-zinc-400">By caption count</p>
            <div className="space-y-3">
              {s.topContributors.length === 0 && <p className="text-sm text-zinc-400">No data yet</p>}
              {s.topContributors.map(({ id, count }, i) => (
                <div key={id} className={`animate-fade-up delay-${i * 50 + 100}`}>
                  <div className="mb-1 flex justify-between text-xs text-zinc-500">
                    <span>#{i + 1} <span className="font-mono">{id.slice(0, 12)}…</span></span>
                    <span className="font-semibold text-zinc-700">{count} captions</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className={`animate-bar-grow h-2 rounded-full bg-zinc-800 delay-${400 + i * 50}`}
                      style={{ width: `${pct(count, maxContributor)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content health */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold text-zinc-700">Content Health</h3>
            <p className="mb-4 text-xs text-zinc-400">Moderation signals</p>
            <div className="space-y-3">
              {[
                { label: 'Reported captions', value: s.totalReports, color: 'bg-red-400', max: Math.max(s.totalReports, s.totalShares, s.totalSaves, 1) },
                { label: 'Total shares', value: s.totalShares, color: 'bg-blue-400', max: Math.max(s.totalReports, s.totalShares, s.totalSaves, 1) },
                { label: 'Total saves', value: s.totalSaves, color: 'bg-emerald-400', max: Math.max(s.totalReports, s.totalShares, s.totalSaves, 1) },
              ].map(({ label, value, color, max }, i) => (
                <div key={label} className={`animate-fade-up delay-${i * 50 + 100}`}>
                  <div className="mb-1 flex justify-between text-xs text-zinc-500">
                    <span>{label}</span>
                    <span className="font-semibold text-zinc-700">{value.toLocaleString()}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div className={`animate-bar-grow h-2 rounded-full ${color} delay-${400 + i * 50}`} style={{ width: `${pct(value, max)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Top captions leaderboard */}
      <section className="animate-fade-up delay-500">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">Top 10 Captions by Likes</h2>
        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 w-8">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Content</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Badge</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 w-52">Likes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {s.topCaptions.map((c, i) => (
                <tr key={c.id} className={`transition-colors duration-150 hover:bg-zinc-50 animate-fade-up delay-${Math.min(i * 50 + 100, 700)}`}>
                  <td className="px-4 py-3.5 text-sm font-bold text-zinc-300">{i + 1}</td>
                  <td className="px-4 py-3.5 max-w-xs"><span className="block truncate text-zinc-700">{c.content ?? '—'}</span></td>
                  <td className="px-4 py-3.5">
                    {c.is_featured && <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">⭐ Featured</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="w-8 text-right text-xs font-bold text-zinc-700">{c.like_count}</span>
                      <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                        <div className="animate-bar-grow h-1.5 rounded-full bg-gradient-to-r from-rose-400 to-pink-500" style={{ width: `${pct(c.like_count, s.maxLikes)}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {s.topCaptions.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-zinc-400">No captions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
