'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface FilterOption { label: string; value: string }
interface Filter { key: string; label: string; value: string | undefined; options: FilterOption[] }

export default function FilterBar({ filters }: { filters: Filter[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function update(key: string, value: string) {
    const sp = new URLSearchParams(searchParams.toString())
    if (value === '') sp.delete(key)
    else sp.set(key, value)
    sp.delete('page')
    router.push(`${pathname}?${sp}`)
  }

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 animate-fade-up">
      {filters.map((f) => (
        <div key={f.key} className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400 whitespace-nowrap">
            {f.label}
          </span>
          <div className="flex overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 shadow-sm text-xs">
            {f.options.map((opt) => {
              const active = (f.value ?? '') === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => update(f.key, opt.value)}
                  className={`rounded-md px-3 py-1 font-medium transition-all duration-150 ${
                    active
                      ? 'bg-zinc-900 text-white shadow-sm'
                      : 'text-zinc-500 hover:bg-white hover:text-zinc-900 hover:shadow-sm'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
