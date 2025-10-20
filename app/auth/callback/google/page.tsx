"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export default function GoogleAuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleOAuth = async () => {
      const code = searchParams.get("code")
      if (!code) return

      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error("Error exchanging code:", error)
        return
      }

      router.push("/dashboard")
    }

    handleOAuth()
  }, [router, searchParams])

  return <p>Signing you in with Google...</p>
}
