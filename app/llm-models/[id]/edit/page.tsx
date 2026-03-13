import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import LlmModelForm from '../../LlmModelForm'

export const dynamic = 'force-dynamic'

export default async function EditLlmModelPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: model }, { data: providers }] = await Promise.all([
    supabase
      .from('llm_models')
      .select('id, name, provider_model_id, llm_provider_id, is_temperature_supported')
      .eq('id', id)
      .single(),
    supabase.from('llm_providers').select('id, name').order('name'),
  ])

  if (!model) notFound()

  return (
    <div className="animate-fade-up max-w-lg">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">LLM Models</p>
        <h1 className="mt-0.5 text-2xl font-bold text-zinc-900">Edit Model</h1>
      </div>
      <LlmModelForm model={model} providers={providers ?? []} />
    </div>
  )
}
