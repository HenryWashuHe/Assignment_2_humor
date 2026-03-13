import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

const createSchema = z.object({
  apex_domain: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const validated = createSchema.parse(body)

    const { data, error } = await supabase
      .from('allowed_signup_domains')
      .insert(validated)
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
