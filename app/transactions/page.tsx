"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Upload, Search, Filter, MessageSquare, AlertCircle } from "lucide-react"
import { TransactionList } from "@/components/transaction-list"
import { UploadCSVDialog } from "@/components/upload-csv-dialog"
import { detectFraud } from "@/lib/fraud-detection"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Profile {
  full_name: string
}

interface TransactionStats {
  totalCount: number
  averageAmount: number
  largestExpense: {
    amount: number
    description: string
  }
}

export default function TransactionsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<TransactionStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [fraudAlerts, setFraudAlerts] = useState(0)
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
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError && profileError.code === "42P01") {
          // Table doesn't exist
          setTablesExist(false)
          setProfile({
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          })
          setIsLoading(false)
          return
        }

        if (profileData) {
          setProfile({
            full_name: profileData.full_name || user.email?.split("@")[0] || "User",
          })
        }

        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]

        const { data: transactions } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .gte("date", startOfMonth)

        if (transactions && transactions.length > 0) {
          const totalCount = transactions.length
          const totalAmount = transactions.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
          const averageAmount = totalAmount / totalCount

          const expenses = transactions.filter((t) => t.type === "expense")
          const largestExpense = expenses.reduce(
            (max, t) => {
              const amount = Math.abs(Number(t.amount))
              return amount > max.amount ? { amount, description: t.description } : max
            },
            { amount: 0, description: "N/A" },
          )

          setStats({
            totalCount,
            averageAmount,
            largestExpense,
          })
        } else {
          setStats({
            totalCount: 0,
            averageAmount: 0,
            largestExpense: { amount: 0, description: "N/A" },
          })
        }

        // Check for fraud alerts
        const alerts = detectFraud()
        setFraudAlerts(alerts.length)
      } catch (error) {
        console.error("[v0] Error fetching transactions data:", error)
        setTablesExist(false)
        setProfile({
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        })
        setStats({
          totalCount: 0,
          averageAmount: 0,
          largestExpense: { amount: 0, description: "N/A" },
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
              <Link href="/transactions" className="text-sm font-medium text-foreground hover:text-primary">
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Transactions</h2>
          <p className="text-muted-foreground">View and manage all your financial transactions</p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload CSV
          </Button>
        </div>

        {/* Transaction Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats?.totalCount || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">${stats?.averageAmount.toFixed(2) || "0.00"}</div>
              <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Largest Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${stats?.largestExpense.amount.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stats?.largestExpense.description || "N/A"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Setup Alert */}
        {!tablesExist && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Database Setup Required</AlertTitle>
            <AlertDescription className="text-blue-700">
              Please run the SQL scripts to set up your database tables. Click the gear icon (⚙️) in the top right, then
              run the scripts in the Scripts section.
            </AlertDescription>
          </Alert>
        )}

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionList searchQuery={searchQuery} />
          </CardContent>
        </Card>
      </main>

      {/* Upload Dialog */}
      <UploadCSVDialog open={showUploadDialog} onOpenChange={setShowUploadDialog} />
    </div>
  )
}
