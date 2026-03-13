import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${user.id}/${Date.now()}.${ext}`
    const bucket = process.env.SUPABASE_STORAGE_IMAGES_BUCKET ?? 'images'

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadError) throw new Error(uploadError.message)

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
