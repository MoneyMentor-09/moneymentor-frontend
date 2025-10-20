"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export function useAuthListener() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (event === "SIGNED_IN") {
        router.push("/dashboard")
      }
      if (event === "SIGNED_OUT") {
        router.push("/login")
      }
    })

    return () => {
      authListener?.unsubscribe()
    }
  }, [router, supabase])
}
