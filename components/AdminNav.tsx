'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/users',     label: 'Users',     icon: '◉' },
  { href: '/images',    label: 'Images',    icon: '◈' },
  { href: '/captions',  label: 'Captions',  icon: '◎' },
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
    <aside className="flex h-screen w-56 flex-col border-r border-zinc-200/80 bg-white/95 backdrop-blur-sm px-3 py-5 sticky top-0">
      <div className="mb-8 px-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Admin</span>
        <p className="mt-0.5 text-lg font-bold text-zinc-900">Humor Study</p>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {NAV_ITEMS.map(({ href, label, icon }, i) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 animate-slide-left delay-${i * 50 + 50} ${
                active
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-white/40" />
              )}
              <span className="text-base leading-none">{icon}</span>
              <span className="flex-1">{label}</span>
              {active && (
                <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-zinc-100 pt-3 mt-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
        >
          <span className="text-base leading-none">⏏</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
