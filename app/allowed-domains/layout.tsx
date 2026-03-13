import AdminNav from '@/components/AdminNav'

export default function AllowedDomainsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      <AdminNav />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
