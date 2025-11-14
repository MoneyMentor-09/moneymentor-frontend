"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleSession = async () => {
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        router.push("/dashboard")
      } else {
        router.push("/login")
      }
    }

    handleSession()
  }, [router])

  return <p>Signing you in...</p>
}
