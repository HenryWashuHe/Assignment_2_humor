'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: 'Your account does not have admin access.',
  oauth: 'Sign-in failed. Please try again.',
}

export default function LoginForm() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
  const [loading, setLoading] = useState(false)

  async function handleGoogleLogin() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    // Browser will redirect — no need to setLoading(false)
  }

  return (
    <div className="flex flex-col gap-3">
      {errorParam && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="mt-px text-red-400" aria-hidden="true">⚠</span>
          <span>{ERROR_MESSAGES[errorParam] ?? 'An error occurred. Please try again.'}</span>
        </div>
      )}

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 shadow-sm transition-all duration-150 hover:bg-zinc-50 hover:border-zinc-400 hover:shadow focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <span
              className="inline-block h-4 w-4 rounded-full border-2 border-zinc-300 border-t-zinc-700 animate-spin"
              aria-hidden="true"
            />
            <span>Redirecting…</span>
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z"/>
            </svg>
            <span>Continue with Google</span>
          </>
        )}
      </button>
    </div>
  )
}
