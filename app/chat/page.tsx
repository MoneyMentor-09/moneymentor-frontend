"use client"

import { useState, useEffect, useRef } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Trash2,
  Loader2,
  AlertTriangle
} from "lucide-react"
import { toast } from "sonner"
import { ScrollArea } from "@radix-ui/react-scroll-area"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface FinancialSummary {
  totalIncome: number
  totalExpenses: number
  totalBalance: number
  topCategories: Array<{ category: string; amount: number }>
  recentTransactions: Array<{ description: string; amount: number; type: string }>
  budgetStatus: Array<{ category: string; spent: number; limit: number }>
  alerts: Array<{ message: string; risk_score: number }>
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const storedMessages = localStorage.getItem("chatMessages")
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages).map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) })))
    } else {
      const welcomeMsg: Message = {
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your AI financial assistant. I can help you understand your spending patterns, analyze your budget, and provide personalized financial advice. What would you like to know about your finances?",
        timestamp: new Date()
      }
      setMessages([welcomeMsg])
    }
    fetchFinancialData()
  }, [])

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages))
    // Auto-scroll to bottom when new messages appear
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const fetchFinancialData = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      const { data: budgets } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)

      const { data: alerts } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(5)

      if (transactions) {
        const totalIncome = transactions
          .filter((t: { type: string }) => t.type === 'income')
          .reduce((sum: number, t: { amount: number }) => sum + (t.amount as number), 0)

        const totalExpenses = transactions
          .filter((t: { type: string }) => t.type === 'expense')
          .reduce((sum: number, t: { amount: number }) => sum + (t.amount as number), 0)

        const totalBalance = totalIncome - totalExpenses

        const categorySpending = transactions
          .filter((t: { type: string }) => t.type === 'expense')
          .reduce((acc: Record<string, number>, t: { amount: number; category: string }) => {
            const amt = t.amount as number
            acc[t.category] = (acc[t.category] || 0) + amt
            return acc
          }, {})

        const topCategories = Object.entries(categorySpending)
          .map(([category, amount]) => ({ category, amount: amount as number }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5)

        const recentTransactions = transactions.slice(0, 5).map((t: { description: any; amount: number; type: any }) => ({
          description: t.description,
          amount: t.amount as number,
          type: t.type
        }))

        const budgetStatus = budgets?.map((budget: { category: any; spent: number; limit: number }) => ({
          category: budget.category,
          spent: budget.spent as number,
          limit: budget.limit as number
        })) || []

        setFinancialSummary({
          totalIncome,
          totalExpenses,
          totalBalance,
          topCategories,
          recentTransactions,
          budgetStatus,
          alerts: alerts || []
        })
      }

    } catch (error) {
      console.error('Failed to fetch financial data:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          financialSummary: financialSummary
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      toast.error("Failed to get AI response")
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    localStorage.removeItem("chatMessages")
    setMessages([{
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI financial assistant. I can help you understand your spending patterns, analyze your budget, and provide personalized financial advice. What would you like to know about your finances?",
      timestamp: new Date()
    }])
  }

  const suggestedQuestions = [
    "What's my biggest expense this month?",
    "How much did I spend on groceries last week?",
    "Why is my security score low?",
    "Which category am I overspending on?",
    "Am I on track with my budget?",
    "What are my spending patterns?",
    "How can I save more money?"
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">AI Financial Assistant</h1>
            <p className="text-muted-foreground">Get personalized insights about your finances</p>
          </div>
          <Button variant="outline" onClick={clearChat}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Chat
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Chat with AI Assistant
                </CardTitle>
                <CardDescription>
                  Ask questions about your financial data and get personalized insights
                </CardDescription>
              </CardHeader>

              {/* ✅ Updated layout: scrollable messages + fixed input */}
              <CardContent className="flex flex-col flex-1 relative">
  {/* Scrollable chat messages */}
  <ScrollArea
    className="flex-1 pr-4 overflow-y-auto"
    ref={scrollAreaRef}
    style={{ maxHeight: "500px" }}
  >
    <div className="space-y-4 pb-20"> {/* padding-bottom prevents overlap with input */}
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-3 ${
            message.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          {message.role === "assistant" && (
            <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
          <div
            className={`max-w-[80%] rounded-lg p-3 ${
              message.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            <p className="text-xs opacity-70 mt-1">
              {message.timestamp.toLocaleTimeString()}
            </p>
          </div>
          {message.role === "user" && (
            <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
          )}
        </div>
      ))}

      {isLoading && (
        <div className="flex gap-3 justify-start">
          <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">AI is thinking...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  </ScrollArea>

  {/* Fixed input bar */}
  <form
    onSubmit={handleSendMessage}
    className="absolute bottom-0 left-0 w-full flex gap-2 p-4 bg-background border-t"
  >
    <Input
      value={input}
      onChange={(e) => setInput(e.target.value)}
      placeholder="Ask about your finances..."
      disabled={isLoading}
      className="flex-1"
    />
    <Button type="submit" disabled={isLoading || !input.trim()}>
      <Send className="h-4 w-4" />
    </Button>
  </form>
</CardContent>
            </Card>
          </div>

          {/* Sidebar unchanged */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {financialSummary ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Balance</span>
                      <span className={`font-medium ${financialSummary.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${financialSummary.totalBalance.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Monthly Income</span>
                      <span className="font-medium text-green-600">
                        ${financialSummary.totalIncome.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Monthly Expenses</span>
                      <span className="font-medium text-red-600">
                        ${financialSummary.totalExpenses.toLocaleString()}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Loading financial data...</p>
                )}
              </CardContent>
            </Card>

            {/* Suggested Questions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Suggested Questions</CardTitle>
                <CardDescription>Click to ask the AI assistant</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left h-auto p-3"
                      onClick={() => setInput(question)}
                    >
                      <span className="text-xs">{question}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Categories */}
            {financialSummary && financialSummary.topCategories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Spending Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {financialSummary.topCategories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{category.category}</span>
                        <span className="text-sm font-medium">${category.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Alerts */}
            {financialSummary && financialSummary.alerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Recent Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {financialSummary.alerts.slice(0, 3).map((alert, index) => (
                      <div key={index} className="p-2 bg-muted rounded text-xs">
                        <p className="font-medium">{alert.message}</p>
                        <Badge variant={alert.risk_score > 70 ? 'destructive' : 'default'} className="mt-1">
                          {alert.risk_score}% risk
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
