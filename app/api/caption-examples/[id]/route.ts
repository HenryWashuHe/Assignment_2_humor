import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

const updateSchema = z.object({
  image_description: z.string().min(1).optional(),
  caption: z.string().min(1).optional(),
  explanation: z.string().min(1).optional(),
  priority: z.number().int().optional(),
  image_id: z.string().uuid().nullable().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const validated = updateSchema.parse(body)

    const { data, error } = await supabase
      .from('caption_examples')
      .update({ ...validated, modified_datetime_utc: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { error } = await supabase.from('caption_examples').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}
