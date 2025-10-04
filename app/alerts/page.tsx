"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { MessageSquare, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { detectFraud, type FraudAlert } from "@/lib/fraud-detection"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface Profile {
  full_name: string
}

export default function AlertsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [alerts, setAlerts] = useState<FraudAlert[]>([])

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

      // Run fraud detection
      const detectedAlerts = detectFraud()
      setAlerts(detectedAlerts)

      setIsLoading(false)
    }

    fetchData()
  }, [router])

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleDismissAlert = (alertId: string) => {
    setAlerts(alerts.filter((alert) => alert.id !== alertId))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!profile) return null

  const criticalAlerts = alerts.filter((a) => a.severity === "critical")
  const warningAlerts = alerts.filter((a) => a.severity === "warning")
  const infoAlerts = alerts.filter((a) => a.severity === "info")

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
              <Link href="/budget" className="text-sm font-medium text-muted-foreground hover:text-primary">
                Budget
              </Link>
              <Link href="/alerts" className="text-sm font-medium text-foreground hover:text-primary">
                Alerts
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
          <h2 className="text-3xl font-bold text-foreground mb-2">Security Alerts</h2>
          <p className="text-muted-foreground">Monitor suspicious activity and fraud detection alerts</p>
        </div>

        {/* Alert Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Critical Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{criticalAlerts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Require immediate attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Warnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{warningAlerts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Review recommended</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{infoAlerts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">For your information</p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts List */}
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold text-foreground mb-2">All Clear!</h3>
              <p className="text-muted-foreground">No suspicious activity detected. Your account is secure.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => {
              const severityConfig = {
                critical: {
                  icon: XCircle,
                  bgColor: "bg-red-50 border-red-200",
                  iconColor: "text-red-600",
                  badgeColor: "bg-red-100 text-red-800 border-red-200",
                },
                warning: {
                  icon: AlertTriangle,
                  bgColor: "bg-yellow-50 border-yellow-200",
                  iconColor: "text-yellow-600",
                  badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-200",
                },
                info: {
                  icon: AlertTriangle,
                  bgColor: "bg-blue-50 border-blue-200",
                  iconColor: "text-blue-600",
                  badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
                },
              }

              const config = severityConfig[alert.severity]
              const Icon = config.icon

              return (
                <Card key={alert.id} className={`${config.bgColor} border`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 ${config.iconColor}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className="font-semibold text-foreground mb-1">{alert.title}</h3>
                            <Badge variant="outline" className={config.badgeColor}>
                              {alert.type}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{alert.timestamp}</span>
                        </div>
                        <p className="text-sm text-foreground/80 mb-3">{alert.description}</p>
                        {alert.transaction && (
                          <div className="bg-background/50 rounded-md p-3 mb-3 text-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-muted-foreground">Amount:</span>
                                <span className="font-medium ml-2">
                                  ${Math.abs(alert.transaction.amount).toFixed(2)}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Location:</span>
                                <span className="font-medium ml-2">{alert.transaction.location}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Merchant:</span>
                                <span className="font-medium ml-2">{alert.transaction.merchant}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Date:</span>
                                <span className="font-medium ml-2">{alert.transaction.date}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Review Transaction
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDismissAlert(alert.id)}>
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
