'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export default function GoogleAuthCallback() {
  const router = useRouter()

  // useSearchParams can return null if window isn't ready,
  // so only call it inside useEffect
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const code = searchParams.get('code')
    if (!code) return

    const handleOAuth = async () => {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('Error exchanging code:', error)
        return
      }

      router.push('/dashboard')
    }

    handleOAuth()
  }, [router])

  return <p>Signing you in with Google...</p>
}
