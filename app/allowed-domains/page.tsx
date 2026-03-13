import { createClient } from '@/lib/supabase-server'
import DeleteButton from './DeleteButton'
import AddDomainForm from './AddDomainForm'

export const dynamic = 'force-dynamic'

export default async function AllowedDomainsPage() {
  const supabase = await createClient()
  const { data: domains, count } = await supabase
    .from('allowed_signup_domains')
    .select('id, apex_domain, created_datetime_utc', { count: 'exact' })
    .order('apex_domain', { ascending: true })

  const list = domains ?? []

  return (
    <div className="animate-fade-up max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Config</p>
          <h1 className="mt-0.5 text-2xl font-bold text-zinc-900">Allowed Signup Domains</h1>
          <p className="mt-1 text-sm text-zinc-400">Domains whose users are permitted to sign up.</p>
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">
          {count ?? 0} total
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400">Domain</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-28">Added</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 w-20">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {list.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-zinc-400">No allowed domains</td>
              </tr>
            ) : (
              list.map((d) => (
                <tr key={d.id} className="hover:bg-zinc-50 transition-colors duration-100">
                  <td className="px-4 py-3 font-mono text-sm text-zinc-800">{d.apex_domain}</td>
                  <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">
                    {d.created_datetime_utc ? new Date(d.created_datetime_utc).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <DeleteButton id={d.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Add Domain</h2>
        <AddDomainForm />
      </div>
    </div>
  )
}
