"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { 
  AlertTriangle, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Clock,
  TrendingUp,
  DollarSign,
  MapPin,
  CreditCard
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { analyzeSuspiciousTransactions, SuspiciousAlert, Transaction as Tx } from "@/lib/transactions/suspicious"


interface Alert {
  id: string
  message: string
  risk_score: number
  timestamp: string
  read: boolean
  type: 'fraud' | 'unusual_spending' | 'budget_warning' | 'low_balance'
  transaction_id?: string
  synthetic?: boolean
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'fraud' | 'budget'>('all')
  const [suspiciousAlerts, setSuspiciousAlerts] = useState<SuspiciousAlert[]>([])


  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
  try {
    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    // 1) Load existing alerts from DB (unchanged logic)
    const { data: alertData, error: alertError } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })

    if (alertError) throw alertError
    setAlerts(alertData || [])

    // 2) Load recent transactions for suspicious analysis
    //    Example: last 90 days
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const cutoff = ninetyDaysAgo.toISOString().split('T')[0] // 'YYYY-MM-DD'

    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', cutoff)
      .order('date', { ascending: false })

    if (txError) throw txError

    const txs = (txData || []) as Tx[]

    // 3) Run suspicious analysis
    const suspicious = analyzeSuspiciousTransactions(txs, {
      highAmountThreshold: 1000,
      smallAmountThreshold: 10,
      manySmallCountThreshold: 5,
    })

    setSuspiciousAlerts(suspicious)
  } catch (error) {
    toast.error("Failed to fetch alerts")
    console.error(error)
  } finally {
    setLoading(false)
  }
}

  const markAsRead = async (alertId: string) => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase
        .from('alerts')
        .update({ read: true })
        .eq('id', alertId)

      if (error) throw error
      
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, read: true } : alert
      ))
    } catch (error) {
      toast.error("Failed to mark alert as read")
      console.error(error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { error } = await supabase
        .from('alerts')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) throw error
      
      setAlerts(alerts.map(alert => ({ ...alert, read: true })))
      toast.success("All alerts marked as read")
    } catch (error) {
      toast.error("Failed to mark all alerts as read")
      console.error(error)
    }
  }

  const deleteAlert = async (alertId: string) => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId)

      if (error) throw error
      
      setAlerts(alerts.filter(alert => alert.id !== alertId))
      toast.success("Alert deleted")
    } catch (error) {
      toast.error("Failed to delete alert")
      console.error(error)
    }
  }

  const getAlertIcon = (type: string, riskScore: number) => {
    switch (type) {
      case 'fraud':
        return <Shield className="h-5 w-5 text-red-500" />
      case 'unusual_spending':
        return <TrendingUp className="h-5 w-5 text-orange-500" />
      case 'budget_warning':
        return <DollarSign className="h-5 w-5 text-yellow-500" />
      case 'low_balance':
        return <CreditCard className="h-5 w-5 text-blue-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />
    }
  }

  const getAlertBadge = (type: string, riskScore: number) => {
    if (type === 'fraud' || riskScore > 70) {
      return <Badge variant="destructive">High Risk</Badge>
    } else if (riskScore > 30) {
      return <Badge variant="default">Medium Risk</Badge>
    } else {
      return <Badge variant="secondary">Low Risk</Badge>
    }
  }

  const getAlertColor = (type: string, riskScore: number) => {
    if (type === 'fraud' || riskScore > 70) {
      return 'border-red-200 bg-red-50/50'
    } else if (riskScore > 30) {
      return 'border-orange-200 bg-orange-50/50'
    } else {
      return 'border-yellow-200 bg-yellow-50/50'
    }
  }

    // Map suspicious transaction patterns into alert-like objects for the UI
  const suspiciousAsAlerts: Alert[] = suspiciousAlerts.map((s) => ({
    id: `suspicious-${s.id}`,
    message: s.message,
    risk_score: s.riskScore,
    // Use the date of the first transaction involved, or "now" as fallback
    timestamp:
      s.transactions[0]?.date
        ? new Date(s.transactions[0].date).toISOString()
        : new Date().toISOString(),
    read: false,
    // classify them so they show up under "fraud"/"unusual spending"
    type: s.rule === "high-amount" ? "fraud" : "unusual_spending",
    transaction_id: s.transactions[0]?.id,
    synthetic: true,
  }))

  // Combined "view" of alerts: synthetic suspicious + real DB alerts
  const combinedAlerts: Alert[] = [...suspiciousAsAlerts, ...alerts]

  // Filter alerts (DB + synthetic suspicious)
  const filteredAlerts = combinedAlerts.filter(alert => {
    switch (filter) {
      case "unread":
        return !alert.read
      case "fraud":
        return alert.type === "fraud" || alert.risk_score > 70
      case "budget":
        // keep this strictly to budget warnings
        return alert.type === "budget_warning"
      default:
        return true
    }
  })
  .sort((a, b) => {
      // unread first
      if (a.read === b.read) {
        // if both same read status, newest first
        return (
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime()
        )
      }
      return a.read ? 1 : -1 // a.read=true goes after unread
    })

  const unreadCount = alerts.filter(alert => !alert.read).length
  const highRiskCount = alerts.filter(alert => alert.risk_score > 70).length

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Alerts</h1>
              <p className="text-muted-foreground">Security and spending notifications</p>
            </div>
          </div>
          <div className="h-96 bg-muted rounded-lg animate-pulse" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Alerts</h1>
            <p className="text-muted-foreground">Security and spending notifications</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
          )}
        </div>

        {/* Alert Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreadCount}</div>
              <p className="text-xs text-muted-foreground">
                Require your attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{highRiskCount}</div>
              <p className="text-xs text-muted-foreground">
                Potential fraud detected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{combinedAlerts.length}</div>
              <p className="text-xs text-muted-foreground">
                All time alerts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({combinedAlerts.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === 'fraud' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('fraud')}
              >
                Fraud ({highRiskCount})
              </Button>
              <Button
                variant={filter === 'budget' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('budget')}
              >
                Budget ({alerts.filter(a => a.type === 'budget_warning').length})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alerts List */}
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {filter === 'all' ? 'No alerts yet' : `No ${filter} alerts`}
              </h3>
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? "You're all caught up! New alerts will appear here when detected."
                  : `No ${filter} alerts found. Try selecting a different filter.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <Card 
                key={alert.id} 
                className={`transition-all hover:shadow-md ${getAlertColor(alert.type, alert.risk_score)} ${
                  !alert.read ? 'border-l-4 border-l-primary' : ''
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getAlertIcon(alert.type, alert.risk_score)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-sm font-medium text-foreground">
                            {alert.message}
                          </h3>
                          {!alert.read && (
                            <Badge variant="outline" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(alert.timestamp).toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            Risk Score: {alert.risk_score}%
                          </div>
                        </div>
                        {alert.transaction_id && (
                          <div className="mt-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/transactions?highlight=${alert.transaction_id}`}>
                                View Transaction
                              </Link>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {getAlertBadge(alert.type, alert.risk_score)}
                      <div className="flex items-center gap-1">
                        {!alert.read && !alert.synthetic && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(alert.id)}
                            title="Mark as read"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        {!alert.synthetic && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title="Delete alert">
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Alert</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this alert? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteAlert(alert.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}