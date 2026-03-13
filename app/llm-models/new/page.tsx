import { createClient } from '@/lib/supabase-server'
import LlmModelForm from '../LlmModelForm'

export const dynamic = 'force-dynamic'

export default async function NewLlmModelPage() {
  const supabase = await createClient()
  const { data: providers } = await supabase
    .from('llm_providers')
    .select('id, name')
    .order('name')

  return (
    <div className="animate-fade-up max-w-lg">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">LLM Models</p>
        <h1 className="mt-0.5 text-2xl font-bold text-zinc-900">New Model</h1>
      </div>
      <LlmModelForm providers={providers ?? []} />
    </div>
  )
}
