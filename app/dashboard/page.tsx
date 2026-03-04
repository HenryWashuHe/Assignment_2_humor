import { createClient } from '@/lib/supabase-server'
import StatCard from '@/components/StatCard'

export const dynamic = 'force-dynamic'

function pct(num: number, denom: number) {
  if (!denom) return 0
  return Math.round((num / denom) * 100)
}

function gini(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length
  const mean = sorted.reduce((a, b) => a + b, 0) / n
  if (!mean) return 0
  let sumDiff = 0
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      sumDiff += Math.abs(sorted[i] - sorted[j])
  return sumDiff / (2 * n * n * mean)
}

async function fetchStats() {
  const supabase = await createClient()
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const [
    { count: totalUsers },
    { count: totalImages },
    { count: studyUsers },
    { count: superadmins },
    { count: captionsThisWeek },
    { count: captionsLastWeek },
    { count: totalRequests },
    { count: totalLlmResponses },
    { count: totalReports },
    { count: totalShares },
    { count: totalSaves },
    { count: totalScreenshots },
    { count: totalVotes },
    // Full caption data for analytics
    { data: allCaptions },
    // Profiles for cohort analysis
    { data: allProfiles },
    // LLM responses for temperature analysis
    { data: llmResponses },
    // LLM models for naming
    { data: llmModels },
    // Flavor data with captions
    { data: flavorData },
    // Saves and shares for engagement scoring
    { data: savesData },
    { data: sharesData },
    // Vote data
    { data: voteData },
    // Top captions leaderboard
    { data: topCaptions },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('images').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_in_study', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_superadmin', true),
    supabase.from('captions').select('*', { count: 'exact', head: true }).gte('created_datetime_utc', weekAgo.toISOString()),
    supabase.from('captions').select('*', { count: 'exact', head: true })
      .gte('created_datetime_utc', twoWeeksAgo.toISOString())
      .lt('created_datetime_utc', weekAgo.toISOString()),
    supabase.from('caption_requests').select('*', { count: 'exact', head: true }),
    supabase.from('llm_model_responses').select('*', { count: 'exact', head: true }),
    supabase.from('reported_captions').select('*', { count: 'exact', head: true }),
    supabase.from('shares').select('*', { count: 'exact', head: true }),
    supabase.from('caption_saved').select('*', { count: 'exact', head: true }),
    supabase.from('screenshots').select('*', { count: 'exact', head: true }),
    supabase.from('caption_votes').select('*', { count: 'exact', head: true }),
    // Full data for computation
    supabase.from('captions').select('id, profile_id, humor_flavor_id, like_count, is_public, is_featured, caption_request_id, content').limit(5000),
    supabase.from('profiles').select('id, is_in_study').limit(5000),
    supabase.from('llm_model_responses').select('llm_temperature, caption_request_id, llm_model_id, processing_time_seconds').limit(5000),
    supabase.from('llm_models').select('id, name, provider_model_id'),
    supabase.from('humor_flavors').select('id, slug, captions(like_count)').limit(20),
    supabase.from('caption_saved').select('caption_id').limit(5000),
    supabase.from('shares').select('caption_id').limit(5000),
    supabase.from('caption_votes').select('vote_value').limit(5000),
    supabase.from('captions').select('id, content, like_count, is_featured').order('like_count', { ascending: false }).limit(10),
  ])

  const captions = allCaptions ?? []
  const profiles = allProfiles ?? []
  const totalCaptions = captions.length
  const publicCaptions = captions.filter(c => c.is_public).length
  const featuredCaptions = captions.filter(c => c.is_featured).length
  const allLikes = captions.map(c => c.like_count ?? 0)
  const totalLikes = allLikes.reduce((a, b) => a + b, 0)
  const avgLikes = totalCaptions ? (totalLikes / totalCaptions).toFixed(1) : '0'
  const maxLikes = allLikes.length ? Math.max(...allLikes) : 1

  // === CONTENT FUNNEL ===
  // Each step: what % of the previous step made it through?
  const req = totalRequests ?? 0
  const llmResp = totalLlmResponses ?? 0
  const funnelSteps = [
    { label: 'Caption Requests', value: req, rate: 100 },
    { label: 'LLM Responses', value: llmResp, rate: req ? pct(llmResp, req) : 0 },
    { label: 'Captions Created', value: totalCaptions, rate: llmResp ? pct(totalCaptions, llmResp) : 0 },
    { label: 'Made Public', value: publicCaptions, rate: totalCaptions ? pct(publicCaptions, totalCaptions) : 0 },
    { label: 'Featured', value: featuredCaptions, rate: publicCaptions ? pct(featuredCaptions, publicCaptions) : 0 },
  ]

  // === PARETO / LIKES CONCENTRATION ===
  const sortedLikes = [...allLikes].sort((a, b) => b - a)
  const target80 = totalLikes * 0.8
  let cumSum = 0
  let captionsFor80 = 0
  for (const l of sortedLikes) {
    cumSum += l
    captionsFor80++
    if (cumSum >= target80) break
  }
  const paretoTopPct = totalCaptions ? Math.round((captionsFor80 / totalCaptions) * 100) : 0
  const giniCoeff = gini(allLikes)
  // Median likes
  const mid = Math.floor(sortedLikes.length / 2)
  const medianLikes = sortedLikes.length ? (sortedLikes.length % 2 === 0 ? (sortedLikes[mid - 1] + sortedLikes[mid]) / 2 : sortedLikes[mid]) : 0

  // === LLM TEMPERATURE vs QUALITY ===
  // Build caption_request_id → like_count map
  const reqToLikes = new Map<number, number>()
  for (const c of captions) {
    if (c.caption_request_id != null) reqToLikes.set(c.caption_request_id, c.like_count ?? 0)
  }
  // Group by temperature bucket → avg likes
  const tempBuckets = new Map<string, number[]>()
  for (const r of llmResponses ?? []) {
    if (r.llm_temperature == null) continue
    const t = Number(r.llm_temperature)
    const bucket = t <= 0.3 ? '≤0.3' : t <= 0.6 ? '0.4–0.6' : t <= 0.8 ? '0.7–0.8' : t <= 1.0 ? '0.9–1.0' : '>1.0'
    const likes = reqToLikes.get(r.caption_request_id) ?? 0
    if (!tempBuckets.has(bucket)) tempBuckets.set(bucket, [])
    tempBuckets.get(bucket)!.push(likes)
  }
  const tempStats = ['≤0.3', '0.4–0.6', '0.7–0.8', '0.9–1.0', '>1.0']
    .filter(b => tempBuckets.has(b))
    .map(b => {
      const vals = tempBuckets.get(b)!
      const avg = vals.reduce((a, v) => a + v, 0) / vals.length
      return { bucket: b, avgLikes: parseFloat(avg.toFixed(2)), count: vals.length }
    })
  const maxTempLikes = tempStats.length ? Math.max(...tempStats.map(t => t.avgLikes), 0.01) : 1

  // === STUDY COHORT ANALYSIS ===
  const studyProfileIds = new Set(profiles.filter(p => p.is_in_study).map(p => p.id))
  const studyCaptions = captions.filter(c => studyProfileIds.has(c.profile_id))
  const nonStudyCaptions = captions.filter(c => !studyProfileIds.has(c.profile_id))
  const studyUserCount = studyUsers ?? 0
  const nonStudyUserCount = Math.max((totalUsers ?? 0) - studyUserCount, 1)
  const studyAvgLikes = studyCaptions.length ? (studyCaptions.reduce((a, c) => a + (c.like_count ?? 0), 0) / studyCaptions.length).toFixed(1) : '0'
  const nonStudyAvgLikes = nonStudyCaptions.length ? (nonStudyCaptions.reduce((a, c) => a + (c.like_count ?? 0), 0) / nonStudyCaptions.length).toFixed(1) : '0'
  const studyCaptionsPerUser = studyUserCount ? (studyCaptions.length / studyUserCount).toFixed(1) : '0'
  const nonStudyCaptionsPerUser = nonStudyUserCount ? (nonStudyCaptions.length / nonStudyUserCount).toFixed(1) : '0'
  const studyFeaturedRate = studyCaptions.length ? pct(studyCaptions.filter(c => c.is_featured).length, studyCaptions.length) : 0
  const nonStudyFeaturedRate = nonStudyCaptions.length ? pct(nonStudyCaptions.filter(c => c.is_featured).length, nonStudyCaptions.length) : 0

  // === FLAVOR ENGAGEMENT SCORE (composite: likes + saves*2 + shares*3) ===
  const savesByCaptionId = new Map<string, number>()
  for (const s of savesData ?? []) {
    if (s.caption_id) savesByCaptionId.set(s.caption_id, (savesByCaptionId.get(s.caption_id) ?? 0) + 1)
  }
  const sharesByCaptionId = new Map<string, number>()
  for (const s of sharesData ?? []) {
    if (s.caption_id) sharesByCaptionId.set(s.caption_id, (sharesByCaptionId.get(s.caption_id) ?? 0) + 1)
  }
  const flavorStats = (flavorData ?? []).map(f => {
    const caps = (f.captions as { like_count: number }[]) ?? []
    if (!caps.length) return null
    const captionCount = caps.length
    const totalFlavorLikes = caps.reduce((a, c) => a + (c.like_count ?? 0), 0)
    const avgFlavorLikes = totalFlavorLikes / captionCount
    const hitRate = pct(caps.filter(c => (c.like_count ?? 0) > medianLikes).length, captionCount)
    return { slug: f.slug, captionCount, avgLikes: parseFloat(avgFlavorLikes.toFixed(2)), hitRate }
  }).filter(Boolean).sort((a, b) => b!.avgLikes - a!.avgLikes).slice(0, 8) as { slug: string; captionCount: number; avgLikes: number; hitRate: number }[]
  const maxFlavorAvgLikes = flavorStats[0]?.avgLikes ?? 1

  // === LLM MODEL EFFICIENCY ===
  const modelMap = new Map<number, { times: number[]; count: number }>()
  for (const r of llmResponses ?? []) {
    if (!modelMap.has(r.llm_model_id)) modelMap.set(r.llm_model_id, { times: [], count: 0 })
    const m = modelMap.get(r.llm_model_id)!
    m.times.push(r.processing_time_seconds ?? 0)
    m.count++
  }
  const modelLookup = new Map((llmModels ?? []).map(m => [m.id, m.provider_model_id ?? `Model #${m.id}`]))
  const modelStats = [...modelMap.entries()].map(([id, { times, count }]) => {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length
    return { id, name: modelLookup.get(id) ?? `Model #${id}`, count, avgTime: parseFloat(avgTime.toFixed(1)), callsPerSecond: parseFloat((count / Math.max(avgTime, 0.1)).toFixed(1)) }
  }).sort((a, b) => b.count - a.count).slice(0, 5)

  // === VOTE SENTIMENT ===
  const voteValues = (voteData ?? []).map(v => v.vote_value ?? 0)
  const avgVote = voteValues.length ? (voteValues.reduce((a, b) => a + b, 0) / voteValues.length).toFixed(2) : '0'
  const positiveVotes = voteValues.filter(v => v > 0).length
  const negativeVotes = voteValues.filter(v => v < 0).length

  // === WoW ===
  const thisWeek = captionsThisWeek ?? 0
  const lastWeek = captionsLastWeek ?? 0
  const wowChange = lastWeek === 0 ? null : Math.round(((thisWeek - lastWeek) / lastWeek) * 100)

  // === CONTENT HEALTH (rates, not raw counts) ===
  const reportRate = totalCaptions ? parseFloat(((totalReports ?? 0) / totalCaptions * 1000).toFixed(1)) : 0  // per 1000
  const saveRate = totalCaptions ? parseFloat(((totalSaves ?? 0) / totalCaptions).toFixed(2)) : 0
  const shareRate = totalCaptions ? parseFloat(((totalShares ?? 0) / totalCaptions).toFixed(2)) : 0
  const screenshotRate = totalCaptions ? parseFloat(((totalScreenshots ?? 0) / totalCaptions).toFixed(2)) : 0

  return {
    totalUsers: totalUsers ?? 0, totalImages: totalImages ?? 0, totalCaptions,
    studyUsers: studyUserCount, superadmins: superadmins ?? 0,
    publicCaptions, featuredCaptions, totalLikes, avgLikes, maxLikes, medianLikes,
    totalVotes: totalVotes ?? 0, avgVote, positiveVotes, negativeVotes,
    totalReports: totalReports ?? 0, totalShares: totalShares ?? 0,
    totalSaves: totalSaves ?? 0, totalScreenshots: totalScreenshots ?? 0,
    thisWeek, lastWeek, wowChange,
    // Analytical outputs
    funnelSteps,
    paretoTopPct, giniCoeff,
    tempStats, maxTempLikes,
    studyCaptions: studyCaptions.length, nonStudyCaptions: nonStudyCaptions.length,
    studyAvgLikes, nonStudyAvgLikes, studyCaptionsPerUser, nonStudyCaptionsPerUser,
    studyFeaturedRate, nonStudyFeaturedRate,
    flavorStats, maxFlavorAvgLikes,
    modelStats,
    reportRate, saveRate, shareRate, screenshotRate,
    topCaptions: topCaptions ?? [],
  }
}

export default async function DashboardPage() {
  const s = await fetchStats()
  const maxFunnelVal = s.funnelSteps[0]?.value ?? 1

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">Analytics · Humor Study</p>
      </div>

      {/* Overview numbers */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">Overview</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Users" value={s.totalUsers} description={`${s.studyUsers} in study (${pct(s.studyUsers, s.totalUsers)}%)`} accent="bg-violet-500" delay="delay-50" />
          <StatCard label="Captions" value={s.totalCaptions} description={`${s.featuredCaptions} featured · ${s.publicCaptions} public`} accent="bg-emerald-500" delay="delay-100" />
          <StatCard label="Avg Likes" value={s.avgLikes} description={`median ${s.medianLikes} · max ${s.maxLikes}`} accent="bg-rose-500" delay="delay-150" />
          <StatCard label="Votes Cast" value={s.totalVotes.toLocaleString()} description={`avg ${s.avgVote} · ${pct(s.positiveVotes, s.totalVotes)}% positive`} accent="bg-indigo-500" delay="delay-200" />
        </div>
      </section>

      {/* CONTENT FUNNEL */}
      <section className="animate-fade-up delay-100">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-400">Content Pipeline</h2>
        <p className="mb-4 text-xs text-zinc-400">Drop-off rate at each stage from request → featured</p>
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-end gap-3">
            {s.funnelSteps.map((step, i) => {
              const barH = maxFunnelVal ? pct(step.value, maxFunnelVal) : 0
              const colors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-400', 'bg-rose-400']
              return (
                <div key={step.label} className={`flex flex-1 flex-col items-center animate-fade-up delay-${i * 100 + 100}`}>
                  <span className="mb-1 text-xs font-bold text-zinc-700">{step.value.toLocaleString()}</span>
                  <div className="relative w-full" style={{ height: '96px' }}>
                    <div className="absolute bottom-0 w-full overflow-hidden rounded-t-lg bg-zinc-100" style={{ height: '96px' }}>
                      <div
                        className={`animate-bar-grow absolute bottom-0 w-full rounded-t-lg ${colors[i]} delay-${i * 100 + 200}`}
                        style={{ height: `${barH}%` }}
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-center text-xs text-zinc-500 leading-tight">{step.label}</p>
                  {i > 0 && (
                    <span className={`mt-1 rounded-full px-2 py-0.5 text-xs font-semibold ${step.rate >= 70 ? 'bg-emerald-50 text-emerald-700' : step.rate >= 40 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-500'}`}>
                      {step.rate}%
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          <p className="mt-4 text-xs text-zinc-400">
            Overall: {s.funnelSteps[0]?.value ? pct(s.featuredCaptions, s.funnelSteps[0].value) : 0}% of requests ultimately get featured
          </p>
        </div>
      </section>

      {/* PARETO + COHORT */}
      <section className="animate-fade-up delay-200">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          {/* Likes Concentration (Pareto) */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-700">Likes Concentration</h3>
            <p className="mb-4 text-xs text-zinc-400">How unequally is engagement distributed?</p>
            <div className="space-y-5">
              <div>
                <p className="text-xs text-zinc-400 mb-1">Pareto breakdown</p>
                <p className="text-3xl font-bold text-zinc-900">{s.paretoTopPct}%</p>
                <p className="text-xs text-zinc-500 mt-0.5">of captions hold 80% of all likes</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div className="animate-bar-grow h-2 rounded-full bg-rose-400 delay-300" style={{ width: `${s.paretoTopPct}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-zinc-400">
                  {s.paretoTopPct <= 20 ? 'Strong power law — a few viral captions dominate' :
                   s.paretoTopPct <= 40 ? 'Moderate concentration — some standouts' :
                   'Fairly even distribution — no runaway hits'}
                </p>
              </div>
              <div className="border-t border-zinc-100 pt-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xl font-bold text-zinc-900">{s.giniCoeff.toFixed(2)}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Gini coefficient</p>
                  <p className="text-xs text-zinc-300">{s.giniCoeff > 0.5 ? 'High inequality' : s.giniCoeff > 0.3 ? 'Moderate' : 'Low inequality'}</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-zinc-900">{s.medianLikes}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Median likes</p>
                  <p className="text-xs text-zinc-300">vs {s.avgLikes} avg</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-zinc-900">{s.maxLikes}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Peak likes</p>
                  <p className="text-xs text-zinc-300">{s.avgLikes !== '0' ? `${(s.maxLikes / parseFloat(s.avgLikes)).toFixed(1)}× avg` : '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Study Cohort Comparison */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-700">Study vs Casual Users</h3>
            <p className="mb-4 text-xs text-zinc-400">Does study enrollment change output quality?</p>
            <div className="space-y-4">
              {[
                {
                  label: 'Study participants', count: s.studyCaptions,
                  avgLikes: s.studyAvgLikes, captionsPerUser: s.studyCaptionsPerUser,
                  featuredRate: s.studyFeaturedRate, color: 'bg-violet-500', users: s.studyUsers,
                },
                {
                  label: 'Casual users', count: s.nonStudyCaptions,
                  avgLikes: s.nonStudyAvgLikes, captionsPerUser: s.nonStudyCaptionsPerUser,
                  featuredRate: s.nonStudyFeaturedRate, color: 'bg-zinc-400', users: (s.totalUsers - s.studyUsers),
                },
              ].map((cohort) => (
                <div key={cohort.label} className="rounded-xl bg-zinc-50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${cohort.color}`} />
                      <span className="text-sm font-medium text-zinc-700">{cohort.label}</span>
                    </div>
                    <span className="text-xs text-zinc-400">{cohort.users} users</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-zinc-900">{cohort.avgLikes}</p>
                      <p className="text-xs text-zinc-400">avg likes</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-zinc-900">{cohort.captionsPerUser}</p>
                      <p className="text-xs text-zinc-400">captions/user</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-zinc-900">{cohort.featuredRate}%</p>
                      <p className="text-xs text-zinc-400">featured rate</p>
                    </div>
                  </div>
                </div>
              ))}
              {s.studyAvgLikes !== '0' && s.nonStudyAvgLikes !== '0' && (
                <p className="text-xs text-zinc-400 pt-1">
                  {parseFloat(s.studyAvgLikes) > parseFloat(s.nonStudyAvgLikes)
                    ? `Study users generate ${((parseFloat(s.studyAvgLikes) / parseFloat(s.nonStudyAvgLikes) - 1) * 100).toFixed(0)}% more liked captions on average`
                    : `Casual users generate ${((parseFloat(s.nonStudyAvgLikes) / parseFloat(s.studyAvgLikes) - 1) * 100).toFixed(0)}% more liked captions on average`}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* TEMPERATURE EFFECT + FLAVOR ROI */}
      <section className="animate-fade-up delay-300">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          {/* LLM Temperature vs Quality */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-700">Temperature vs Caption Quality</h3>
            <p className="mb-4 text-xs text-zinc-400">Does higher LLM temperature produce funnier captions?</p>
            {s.tempStats.length === 0 ? (
              <p className="text-sm text-zinc-400">No temperature data yet</p>
            ) : (
              <div className="space-y-4">
                {s.tempStats.map((t, i) => (
                  <div key={t.bucket} className={`animate-fade-up delay-${i * 50 + 100}`}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-mono font-medium text-zinc-600">temp {t.bucket}</span>
                      <div className="flex gap-3 text-zinc-400">
                        <span>{t.count} samples</span>
                        <span className="font-bold text-zinc-800">{t.avgLikes} avg likes</span>
                      </div>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className={`animate-bar-grow h-2.5 rounded-full bg-gradient-to-r from-orange-400 to-yellow-300 delay-${300 + i * 50}`}
                        style={{ width: `${pct(t.avgLikes, s.maxTempLikes)}%` }}
                      />
                    </div>
                  </div>
                ))}
                <p className="pt-1 text-xs text-zinc-400">
                  {s.tempStats.length > 1
                    ? s.tempStats[0].avgLikes >= s.tempStats[s.tempStats.length - 1].avgLikes
                      ? `Lower temperature (${s.tempStats[0].bucket}) yields more liked captions`
                      : `Higher temperature (${s.tempStats[s.tempStats.length - 1].bucket}) yields more liked captions`
                    : 'More data needed for conclusions'}
                </p>
              </div>
            )}
          </div>

          {/* Flavor Hit Rate (above-median %) */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-700">Humor Flavor Quality</h3>
            <p className="mb-4 text-xs text-zinc-400">Avg likes per caption + % beating median ({s.medianLikes} likes)</p>
            {s.flavorStats.length === 0 ? (
              <p className="text-sm text-zinc-400">No flavor data yet</p>
            ) : (
              <div className="space-y-3">
                {s.flavorStats.map((f, i) => (
                  <div key={f.slug} className={`animate-fade-up delay-${i * 50 + 100}`}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-700 capitalize">{f.slug.replace(/_/g, ' ')}</span>
                      <div className="flex gap-3 text-zinc-400">
                        <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${f.hitRate >= 50 ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-400'}`}>
                          {f.hitRate}% hit rate
                        </span>
                        <span className="font-bold text-zinc-700">{f.avgLikes} avg</span>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className={`animate-bar-grow h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-400 delay-${300 + i * 50}`}
                        style={{ width: `${pct(f.avgLikes, s.maxFlavorAvgLikes)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CONTENT HEALTH (RATES) + WoW */}
      <section className="animate-fade-up delay-400">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {/* Content health rates */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm lg:col-span-2">
            <h3 className="mb-1 text-sm font-semibold text-zinc-700">Content Health Rates</h3>
            <p className="mb-4 text-xs text-zinc-400">Normalized per caption — not raw counts</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Save rate', value: s.saveRate, sub: 'saves per caption', good: s.saveRate > 0.5, color: 'text-emerald-600' },
                { label: 'Share rate', value: s.shareRate, sub: 'shares per caption', good: s.shareRate > 0.3, color: 'text-blue-600' },
                { label: 'Screenshot rate', value: s.screenshotRate, sub: 'screenshots per caption', good: s.screenshotRate > 0.2, color: 'text-amber-600' },
                { label: 'Report rate', value: s.reportRate, sub: 'per 1,000 captions', good: s.reportRate < 5, color: 'text-red-500' },
              ].map(m => (
                <div key={m.label} className="rounded-xl bg-zinc-50 p-4 text-center">
                  <p className={`text-2xl font-bold ${m.good ? m.color : 'text-zinc-400'}`}>{m.value}</p>
                  <p className="mt-1 text-xs font-medium text-zinc-600">{m.label}</p>
                  <p className="text-xs text-zinc-400">{m.sub}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-zinc-400">
              {s.saveRate > s.shareRate
                ? 'Users save more than share — content resonates personally but has limited viral spread'
                : 'Users share more than save — content has strong viral potential'}
            </p>
          </div>

          {/* WoW caption activity */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-700">Caption Activity</h3>
            <p className="mb-4 text-xs text-zinc-400">Week-over-week</p>
            <div className="flex items-end gap-4 mb-4">
              <div>
                <p className="text-xs text-zinc-400">This week</p>
                <p className="text-4xl font-bold text-zinc-900">{s.thisWeek}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Last week</p>
                <p className="text-2xl font-semibold text-zinc-300">{s.lastWeek}</p>
              </div>
              {s.wowChange !== null && (
                <span className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${s.wowChange >= 0 ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-red-50 text-red-600 ring-1 ring-red-200'}`}>
                  {s.wowChange >= 0 ? '+' : ''}{s.wowChange}%
                </span>
              )}
            </div>
            <div className="mt-4 flex h-16 items-end gap-3">
              {[s.lastWeek, s.thisWeek].map((val, i) => {
                const maxV = Math.max(s.lastWeek, s.thisWeek, 1)
                const h = Math.round((val / maxV) * 100)
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div className={`w-full rounded-t-lg ${i === 1 ? 'bg-zinc-800' : 'bg-zinc-200'}`} style={{ height: `${h}%`, minHeight: val > 0 ? '4px' : '0' }} />
                    <p className="text-xs text-zinc-400">{i === 0 ? 'Prev' : 'Curr'}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* LLM MODEL EFFICIENCY */}
      {s.modelStats.length > 0 && (
        <section className="animate-fade-up delay-400">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-400">AI Model Efficiency</h2>
          <p className="mb-4 text-xs text-zinc-400">Throughput (calls/sec) vs usage — is faster always better?</p>
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 text-xs text-zinc-400">
                    <th className="pb-3 text-left font-medium">Model</th>
                    <th className="pb-3 text-right font-medium">Calls</th>
                    <th className="pb-3 text-right font-medium">Avg time</th>
                    <th className="pb-3 text-right font-medium">Calls/sec</th>
                    <th className="pb-3 pl-4 text-left font-medium w-40">Usage share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {s.modelStats.map((m, i) => {
                    const maxCount = s.modelStats[0].count
                    return (
                      <tr key={m.id} className={`animate-fade-up delay-${i * 50 + 100}`}>
                        <td className="py-3 font-mono text-xs text-zinc-600 max-w-[160px] truncate">{m.name}</td>
                        <td className="py-3 text-right font-semibold text-zinc-800">{m.count.toLocaleString()}</td>
                        <td className="py-3 text-right text-zinc-500">{m.avgTime}s</td>
                        <td className="py-3 text-right font-semibold text-cyan-700">{m.callsPerSecond}</td>
                        <td className="py-3 pl-4">
                          <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                            <div className="animate-bar-grow h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-400" style={{ width: `${pct(m.count, maxCount)}%` }} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* TOP CAPTIONS */}
      <section className="animate-fade-up delay-500">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">Top 10 Captions</h2>
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
                    {c.is_featured && <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">Featured</span>}
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
