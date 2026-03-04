import { Suspense } from 'react'
import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 bg-zinc-50"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgb(212 212 216 / 0.6) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* Soft gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-transparent to-zinc-100/60" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm animate-fade-up">
        <div className="rounded-2xl border border-zinc-200/80 bg-white/90 backdrop-blur-md p-8 shadow-xl shadow-zinc-200/60">
          {/* Logo / brand mark */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white text-xl shadow-lg">
              ◎
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Humor Study</h1>
            <p className="mt-1 text-sm text-zinc-500">Admin Panel</p>
          </div>

          <div className="mb-6 border-t border-zinc-100" />

          <p className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Sign in to continue
          </p>

          <Suspense>
            <LoginForm />
          </Suspense>

          <p className="mt-6 text-center text-xs text-zinc-400">
            Access restricted to authorised administrators only.
          </p>
        </div>
      </div>
    </div>
  )
}
