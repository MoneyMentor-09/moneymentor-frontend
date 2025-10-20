import { getSupabaseBrowserClient } from '@/lib/supabase/client'

async function signInWithGoogle() {
  const supabase = getSupabaseBrowserClient()

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  })

  if (error) {
    console.error('Error signing in with Google:', error.message)
  }
}
