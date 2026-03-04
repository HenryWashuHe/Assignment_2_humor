import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import EditImageForm from './EditImageForm'

export const dynamic = 'force-dynamic'

export default async function EditImagePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: image } = await supabase
    .from('images')
    .select('id, url, additional_context, is_public, is_common_use')
    .eq('id', id)
    .single()

  if (!image) notFound()

  return (
    <div className="animate-fade-up max-w-lg">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Images</p>
        <h1 className="mt-0.5 text-2xl font-bold text-zinc-900">Edit Image</h1>
      </div>
      <EditImageForm image={image} />
    </div>
  )
}
