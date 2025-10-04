import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { MessageSquare, AlertCircle } from "lucide-react"
import { LogoutButton } from "@/components/logout-button"

export default async function ProfilePage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  let profile = null
  let budgetCount = 0
  let monthlySavings = 0
  let daysActive = 0
  let tablesExist = true

  try {
    // Fetch profile data
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError) {
      // Check if table doesn't exist (PGRST205) or any other error
      if (profileError.code === "PGRST205" || profileError.code === "PGRST116") {
        tablesExist = false
      } else {
        console.error("[v0] Profile fetch error:", profileError)
      }
    } else {
      profile = profileData
    }

    if (tablesExist) {
      // Fetch user stats
      const { count, error: budgetError } = await supabase
        .from("budgets")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

      if (budgetError?.code === "PGRST205") {
        tablesExist = false
      } else {
        budgetCount = count || 0
      }

      const { data: transactions, error: transError } = await supabase
        .from("transactions")
        .select("amount, type")
        .eq("user_id", user.id)
        .gte("date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0])

      if (transError?.code === "PGRST205") {
        tablesExist = false
      } else {
        monthlySavings =
          transactions?.reduce((acc, t) => {
            return t.type === "income" ? acc + Number(t.amount) : acc - Number(t.amount)
          }, 0) || 0
      }

      // Calculate days active
      daysActive = profile?.created_at
        ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0
    }
  } catch (error) {
    console.error("[v0] Error fetching profile data:", error)
    tablesExist = false
  }

  const fullName = profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User"
  const firstName = fullName.split(" ")[0]

  return (
    <div className="min-h-screen bg-background">
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
              <Link href="/alerts" className="text-sm font-medium text-muted-foreground hover:text-primary">
                Alerts
              </Link>
              <Link href="/me" className="text-sm font-medium text-foreground hover:text-primary">
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
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
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

        {/* Welcome Section */}
        <div className="bg-primary text-primary-foreground rounded-lg p-8 mb-6">
          <h2 className="text-3xl font-semibold mb-2">Welcome back, {firstName}!</h2>
          <p className="text-primary-foreground/90">Ready to take control of your financial future?</p>
        </div>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Name</p>
                <p className="font-medium">{fullName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary mb-1">${Math.abs(monthlySavings).toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">Monthly {monthlySavings >= 0 ? "Savings" : "Spending"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-chart-1 mb-1">{budgetCount || 0}</p>
                <p className="text-sm text-muted-foreground">Active Budgets</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-chart-3 mb-1">{daysActive}</p>
                <p className="text-sm text-muted-foreground">Days Active</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
