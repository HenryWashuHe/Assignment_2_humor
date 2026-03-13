import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

const updateSchema = z.object({
  caption_count: z.number().int().min(0).max(100),
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
      .from('humor_flavor_mix')
      .update({ caption_count: validated.caption_count })
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
