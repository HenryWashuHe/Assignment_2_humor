interface StatCardProps {
  label: string
  value: string | number
  description?: string
  accent?: string
  delay?: string
}

export default function StatCard({ label, value, description, accent = 'bg-zinc-900', delay = '' }: StatCardProps) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md animate-fade-up ${delay}`}>
      <div className={`absolute right-0 top-0 h-1 w-12 rounded-bl-lg ${accent}`} />
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-zinc-900 tabular-nums">{value}</p>
      {description && (
        <p className="mt-1.5 text-xs text-zinc-400">{description}</p>
      )}
    </div>
  )
}
