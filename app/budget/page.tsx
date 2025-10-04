"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { MessageSquare } from "lucide-react"
import { detectFraud } from "@/lib/fraud-detection"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface Profile {
  full_name: string
}

interface Budget {
  category: string
  spent: number
  limit: number
  color: string
}

export default function BudgetPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fraudAlerts, setFraudAlerts] = useState(0)
  const [budgets, setBudgets] = useState<Budget[]>([])

  useEffect(() => {
    async function fetchData() {
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

      const { data: budgetData } = await supabase.from("budgets").select("*").eq("user_id", user.id)

      if (budgetData) {
        // Fetch transactions for current month to calculate spent amounts
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
        const { data: transactionData } = await supabase
          .from("transactions")
          .select("category, amount, type")
          .eq("user_id", user.id)
          .gte("date", startOfMonth)

        // Calculate spent amount per category
        const spentByCategory: Record<string, number> = {}
        transactionData?.forEach((t) => {
          if (t.type === "expense") {
            spentByCategory[t.category] = (spentByCategory[t.category] || 0) + Math.abs(Number(t.amount))
          }
        })

        // Map budgets with spent amounts
        const colors = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"]
        const mappedBudgets = budgetData.map((budget, index) => ({
          category: budget.category,
          spent: spentByCategory[budget.category] || 0,
          limit: Number(budget.amount),
          color: colors[index % colors.length],
        }))

        setBudgets(mappedBudgets)
      }

      // Check for fraud alerts
      const alerts = detectFraud()
      setFraudAlerts(alerts.length)

      setIsLoading(false)
    }

    fetchData()
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

  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
  const totalLimit = budgets.reduce((sum, b) => sum + b.limit, 0)

  return (
    <div className="min-h-screen bg-background">
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
              <Link href="/budget" className="text-sm font-medium text-foreground hover:text-primary">
                Budget
              </Link>
              <Link href="/alerts" className="text-sm font-medium text-muted-foreground hover:text-primary">
                Alerts
                {fraudAlerts > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                    {fraudAlerts}
                  </span>
                )}
              </Link>
              <Link href="/me" className="text-sm font-medium text-muted-foreground hover:text-primary">
                Profile
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/chat">
              <Button variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                AI Chat
              </Button>
            </Link>
            <Button variant="outline" onClick={handleLogout}>
              Log Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Budget Management</h2>
          <p className="text-muted-foreground">Track your spending across different categories</p>
        </div>

        {budgets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-lg text-muted-foreground mb-2">No budgets created yet</p>
              <p className="text-sm text-muted-foreground">
                Upload your bank statements to start tracking your spending by category
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Overall Budget Summary */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Overall Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-foreground">${totalSpent.toFixed(2)}</span>
                    <span className="text-muted-foreground">of ${totalLimit.toFixed(2)}</span>
                  </div>
                  <Progress value={(totalSpent / totalLimit) * 100} className="h-3" />
                  <p className="text-sm text-muted-foreground">
                    {((totalSpent / totalLimit) * 100).toFixed(1)}% of total budget used
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Category Budgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {budgets.map((budget) => {
                const percentage = (budget.spent / budget.limit) * 100
                const isOverBudget = percentage > 100
                const isNearLimit = percentage > 80 && percentage <= 100

                return (
                  <Card key={budget.category}>
                    <CardHeader>
                      <CardTitle className="text-lg">{budget.category}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-foreground">${budget.spent.toFixed(2)}</span>
                        <span className="text-muted-foreground">of ${budget.limit.toFixed(2)}</span>
                      </div>
                      <div className="space-y-2">
                        <Progress
                          value={Math.min(percentage, 100)}
                          className={`h-2 ${isOverBudget ? "[&>div]:bg-red-600" : isNearLimit ? "[&>div]:bg-yellow-600" : ""}`}
                        />
                        <div className="flex items-center justify-between text-sm">
                          <span
                            className={`font-medium ${isOverBudget ? "text-red-600" : isNearLimit ? "text-yellow-600" : "text-muted-foreground"}`}
                          >
                            {percentage.toFixed(1)}% used
                          </span>
                          <span className="text-muted-foreground">
                            ${(budget.limit - budget.spent).toFixed(2)} remaining
                          </span>
                        </div>
                      </div>
                      {isOverBudget && (
                        <p className="text-xs text-red-600 font-medium">
                          Over budget by ${(budget.spent - budget.limit).toFixed(2)}
                        </p>
                      )}
                      {isNearLimit && !isOverBudget && (
                        <p className="text-xs text-yellow-600 font-medium">Approaching budget limit</p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
