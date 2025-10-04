"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChatInterface } from "@/components/chat-interface"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface Profile {
  full_name: string
}

export default function ChatPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchProfile() {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (profileData) {
        setProfile({
          full_name: profileData.full_name || user.email?.split("@")[0] || "User",
        })
      }

      setIsLoading(false)
    }

    fetchProfile()
  }, [router])

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard">
              <h1 className="font-serif text-2xl font-bold text-foreground">MoneyMentor</h1>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary">
                Dashboard
              </Link>
              <Link href="/transactions" className="text-sm font-medium text-muted-foreground hover:text-primary">
                Transactions
              </Link>
              <Link href="/budget" className="text-sm font-medium text-muted-foreground hover:text-primary">
                Budget
              </Link>
              <Link href="/me" className="text-sm font-medium text-muted-foreground hover:text-primary">
                Profile
              </Link>
            </nav>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Log Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-foreground mb-2">AI Financial Assistant</h2>
          <p className="text-muted-foreground">Ask me anything about your finances, budgets, or spending habits</p>
        </div>

        <ChatInterface userName={profile.full_name.split(" ")[0]} />
      </main>
    </div>
  )
}
