// Deno code for Supabase Edge Function: calculate-streaks
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { habit_id, user_id } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 1. Fetch all check-ins for this habit
  const { data: checkIns, error: fetchError } = await supabase
    .from('check_ins')
    .select('checked_date')
    .eq('habit_id', habit_id)
    .order('checked_date', { ascending: false })

  if (fetchError) return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 })

  // 2. Calculate streak
  const dates = checkIns.map((ci: any) => ci.checked_date)
  const streak = calculateStreak(dates)

  // 3. (Optional) Update a 'habit_stats' table or similar
  // For now, we'll just return it
  return new Response(
    JSON.stringify({ streak }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  
  const unique = [...new Set(dates)].sort().reverse()
  
  if (unique[0] !== today && unique[0] !== yesterday) return 0
  
  let streak = 1
  for (let i = 1; i < unique.length; i++) {
    const d1 = new Date(unique[i-1])
    const d2 = new Date(unique[i])
    const diff = Math.floor((d1.getTime() - d2.getTime()) / 86400000)
    
    if (diff === 1) streak++
    else break
  }
  
  return streak
}
