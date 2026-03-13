import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import CaptionExampleForm from '../../CaptionExampleForm'

export const dynamic = 'force-dynamic'

export default async function EditCaptionExamplePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: example } = await supabase
    .from('caption_examples')
    .select('id, image_description, caption, explanation, priority, image_id')
    .eq('id', id)
    .single()

  if (!example) notFound()

  return (
    <div className="animate-fade-up max-w-lg">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Caption Examples</p>
        <h1 className="mt-0.5 text-2xl font-bold text-zinc-900">Edit Caption Example</h1>
      </div>
      <CaptionExampleForm example={example} />
    </div>
  )
}
