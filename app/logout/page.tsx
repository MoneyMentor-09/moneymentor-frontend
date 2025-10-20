"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function LogoutPage() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push("/") // Redirect to root (main page)
  }

  useEffect(() => {
    handleLogout() // Optional: auto-logout on page load
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-2xl font-semibold mb-4">You've been logged out</h1>
      <p className="text-muted-foreground mb-6">
        You were logged out due to inactivity.
      </p>
      <Button onClick={handleLogout}>Log in again</Button>
    </div>
  )
}
