import { Suspense } from 'react'
import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold text-zinc-900">Admin Panel</h1>
        <p className="mb-6 text-sm text-zinc-500">Sign in with your Google account</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
