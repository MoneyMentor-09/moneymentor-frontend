"use client"

import { SimpleDashboardLayout } from "@/components/simple-dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SimpleDashboardPage() {
  return (
    <SimpleDashboardLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Simple Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This is a simplified version of the dashboard to test navigation.
              If you can see this page and navigate to other pages, the basic navigation is working.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">No data available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">No data available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">No data available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Fraud Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">No data available</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </SimpleDashboardLayout>
  )
}
