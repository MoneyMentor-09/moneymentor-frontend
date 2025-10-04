"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { ExpenseChart } from "@/components/expense-chart"
import { RecentTransactions } from "@/components/recent-transactions"
import { BudgetOverview } from "@/components/budget-overview"
import { MessageSquare, Shield, AlertCircle } from "lucide-react"
import { detectFraud, calculateFraudRiskScore } from "@/lib/fraud-detection"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface Profile {
  full_name: string
  email: string
}

interface Stats {
  balance: number
  income: number
  expenses: number
  balanceChange: number
  expensesChange: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fraudAlerts, setFraudAlerts] = useState(0)
  const [riskScore, setRiskScore] = useState(0)
  const [tablesExist, setTablesExist] = useState(true)

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

      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError && profileError.code === "42P01") {
          setTablesExist(false)
          setProfile({
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
            email: user.email || "",
          })
          setIsLoading(false)
          return
        }

        if (profileData) {
          setProfile({
            full_name: profileData.full_name || user.email?.split("@")[0] || "User",
            email: user.email || "",
          })
        }

        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
        const startOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
          .toISOString()
          .split("T")[0]
        const endOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split("T")[0]

        const { data: currentTransactions } = await supabase
          .from("transactions")
          .select("amount, type")
          .eq("user_id", user.id)
          .gte("date", startOfMonth)

        const { data: lastMonthTransactions } = await supabase
          .from("transactions")
          .select("amount, type")
          .eq("user_id", user.id)
          .gte("date", startOfLastMonth)
          .lte("date", endOfLastMonth)

        const currentIncome =
          currentTransactions?.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0) || 0
        const currentExpenses =
          currentTransactions
            ?.filter((t) => t.type === "expense")
            .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0

        const lastMonthIncome =
          lastMonthTransactions?.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0) || 0
        const lastMonthExpenses =
          lastMonthTransactions
            ?.filter((t) => t.type === "expense")
            .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0

        const balance = currentIncome - currentExpenses
        const lastMonthBalance = lastMonthIncome - lastMonthExpenses

        const balanceChange = lastMonthBalance > 0 ? ((balance - lastMonthBalance) / lastMonthBalance) * 100 : 0
        const expensesChange =
          lastMonthExpenses > 0 ? ((currentExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0

        setStats({
          balance,
          income: currentIncome,
          expenses: currentExpenses,
          balanceChange,
          expensesChange,
        })

        const alerts = detectFraud()
        setFraudAlerts(alerts.length)
        setRiskScore(calculateFraudRiskScore())
      } catch (error) {
        console.error("[v0] Error fetching dashboard data:", error)
        setTablesExist(false)
        setProfile({
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          email: user.email || "",
        })
      }

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

  const firstName = profile.full_name.split(" ")[0]

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
              <Link href="/dashboard" className="text-sm font-medium text-foreground hover:text-primary">
                Dashboard
              </Link>
              <Link href="/transactions" className="text-sm font-medium text-muted-foreground hover:text-primary">
                Transactions
              </Link>
              <Link href="/budget" className="text-sm font-medium text-muted-foreground hover:text-primary">
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back, {firstName}!</h2>
          <p className="text-muted-foreground">Here's your financial overview for this month</p>
        </div>

        {!tablesExist && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Database Setup Required</AlertTitle>
            <AlertDescription className="text-blue-700">
              To start tracking your finances, please run the SQL scripts to set up your database. Click the gear icon
              (⚙️) in the top right, then run the scripts in the Scripts section. After that, upload your bank statement
              CSV from the Transactions page.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">${stats?.balance.toFixed(2) || "0.00"}</div>
              {stats && stats.balanceChange !== 0 && (
                <p className={`text-xs mt-1 ${stats.balanceChange > 0 ? "text-green-600" : "text-red-600"}`}>
                  {stats.balanceChange > 0 ? "+" : ""}
                  {stats.balanceChange.toFixed(1)}% from last month
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">${stats?.income.toFixed(2) || "0.00"}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">${stats?.expenses.toFixed(2) || "0.00"}</div>
              {stats && stats.expensesChange !== 0 && (
                <p className={`text-xs mt-1 ${stats.expensesChange > 0 ? "text-red-600" : "text-green-600"}`}>
                  {stats.expensesChange > 0 ? "+" : ""}
                  {stats.expensesChange.toFixed(1)}% from last month
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Security Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Shield
                  className={`h-5 w-5 ${riskScore < 30 ? "text-green-600" : riskScore < 60 ? "text-yellow-600" : "text-red-600"}`}
                />
                <div className="text-2xl font-bold text-foreground">{Math.max(0, 100 - riskScore)}/100</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {riskScore < 30 ? "Excellent" : riskScore < 60 ? "Good" : "Needs attention"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Spending Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseChart />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Budget Status</CardTitle>
              </CardHeader>
              <CardContent>
                <BudgetOverview />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <Link href="/transactions">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <RecentTransactions />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
