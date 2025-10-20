"use client"

import { SimpleDashboardLayout } from "@/components/simple-dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestNavigationPage() {
  return (
    <SimpleDashboardLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Navigation Test Page</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This is a test page to verify that navigation is working properly.
              Try clicking on the navigation links in the sidebar to switch between pages.
            </p>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Debug Information:</h3>
              <ul className="text-sm space-y-1">
                <li>• Check the browser console for navigation click logs</li>
                <li>• Verify that the URL changes when clicking navigation links</li>
                <li>• Ensure the active state updates correctly</li>
                <li>• Test both desktop and mobile navigation</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </SimpleDashboardLayout>
  )
}
