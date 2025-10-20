"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  LayoutDashboard, 
  CreditCard, 
  Target, 
  AlertTriangle, 
  User, 
  MessageSquare
} from "lucide-react"

export default function TestPage() {
  const router = useRouter()
  const [testResults, setTestResults] = useState<string[]>([])

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Transactions", href: "/transactions", icon: CreditCard },
    { name: "Budget", href: "/budget", icon: Target },
    { name: "Alerts", href: "/alerts", icon: AlertTriangle },
    { name: "Profile", href: "/me", icon: User },
    { name: "AI Chat", href: "/chat", icon: MessageSquare },
  ]

  const testNavigation = (item: typeof navigation[0]) => {
    addResult(`Testing navigation to ${item.name} (${item.href})`)
    
    // Test 1: Link component
    addResult(`Link component should navigate to ${item.href}`)
    
    // Test 2: Router push
    setTimeout(() => {
      addResult(`Using router.push to navigate to ${item.href}`)
      router.push(item.href)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>MoneyMentor Navigation Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This page tests navigation functionality without requiring authentication.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.name} className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => testNavigation(item)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      Test {item.name}
                    </Button>
                    <Link
                      href={item.href}
                      className="block w-full"
                      onClick={() => addResult(`Link clicked: ${item.name}`)}
                    >
                      <Button variant="secondary" className="w-full">
                        Link to {item.name}
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-muted-foreground">No tests run yet. Click the buttons above to test navigation.</p>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono bg-muted p-2 rounded">
                    {result}
                  </div>
                ))
              )}
            </div>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setTestResults([])}
            >
              Clear Results
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment Check</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <strong>NEXT_PUBLIC_SUPABASE_URL:</strong> 
                <span className={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}>
                  {process.env.NEXT_PUBLIC_SUPABASE_URL ? ' Set' : ' Not set'}
                </span>
              </div>
              <div>
                <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> 
                <span className={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'text-green-600' : 'text-red-600'}>
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? ' Set' : ' Not set'}
                </span>
              </div>
              <div>
                <strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Server-side'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
