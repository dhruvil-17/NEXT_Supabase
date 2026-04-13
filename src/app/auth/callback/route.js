import { supabase } from '@/lib/supabase/supabaseClient'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  
  if (code) {
   console.log("CODE " , code)
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/task-manager`)
}