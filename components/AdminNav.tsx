'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: '▦' },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/users',            label: 'Users',             icon: '◉' },
      { href: '/images',           label: 'Images',            icon: '◈' },
      { href: '/captions',         label: 'Captions',          icon: '◎' },
      { href: '/caption-requests', label: 'Caption Requests',  icon: '◷' },
      { href: '/caption-examples', label: 'Caption Examples',  icon: '◻' },
    ],
  },
  {
    label: 'Humor',
    items: [
      { href: '/humor-flavors',       label: 'Flavors',       icon: '◈' },
      { href: '/humor-flavor-steps',  label: 'Flavor Steps',  icon: '◧' },
      { href: '/humor-mix',           label: 'Mix',           icon: '◑' },
    ],
  },
  {
    label: 'LLM',
    items: [
      { href: '/llm-providers',    label: 'Providers',       icon: '◆' },
      { href: '/llm-models',       label: 'Models',          icon: '◇' },
      { href: '/llm-prompt-chains', label: 'Prompt Chains', icon: '◈' },
      { href: '/llm-responses',    label: 'Responses',       icon: '◉' },
    ],
  },
  {
    label: 'Config',
    items: [
      { href: '/terms',              label: 'Terms',             icon: '◻' },
      { href: '/allowed-domains',    label: 'Allowed Domains',   icon: '◎' },
      { href: '/whitelisted-emails', label: 'Whitelisted Emails', icon: '◷' },
    ],
  },
]

export default function AdminNav() {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-zinc-200/80 bg-white/95 backdrop-blur-sm px-3 py-5 sticky top-0 overflow-y-auto">
      <div className="mb-6 px-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Admin</span>
        <p className="mt-0.5 text-lg font-bold text-zinc-900">Humor Study</p>
      </div>

      <nav className="flex flex-1 flex-col gap-4">
        {NAV_SECTIONS.map(({ label, items }) => (
          <div key={label}>
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-widest text-zinc-300">{label}</p>
            <div className="flex flex-col gap-0.5">
              {items.map(({ href, label: itemLabel, icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 ${
                      active
                        ? 'bg-zinc-900 text-white shadow-sm'
                        : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 rounded-r-full bg-white/40" />
                    )}
                    <span className="text-sm leading-none">{icon}</span>
                    <span className="flex-1 truncate">{itemLabel}</span>
                    {active && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/60" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-zinc-100 pt-3 mt-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-400 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
        >
          <span className="text-sm leading-none">⏏</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
