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
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">Edit Image</h1>
      <EditImageForm image={image} />
    </div>
  )
}
