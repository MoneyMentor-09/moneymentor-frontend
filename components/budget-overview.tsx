"use client"

import { useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface Budget {
  category: string
  spent: number
  limit: number
  color: string
}

export function BudgetOverview() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchBudgets() {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      // Fetch budgets
      const { data: budgetData, error: budgetError } = await supabase.from("budgets").select("*").eq("user_id", user.id)

      if (budgetError || !budgetData) {
        setIsLoading(false)
        return
      }

      // Fetch transactions for current month
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
      setIsLoading(false)
    }

    fetchBudgets()
  }, [])

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (budgets.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No budgets set</p>
        <p className="text-sm text-muted-foreground mt-1">Create a budget to track your spending</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {budgets.map((budget) => {
        const percentage = (budget.spent / budget.limit) * 100
        const isOverBudget = percentage > 100

        return (
          <div key={budget.category} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{budget.category}</span>
              <span className={`font-semibold ${isOverBudget ? "text-red-600" : "text-muted-foreground"}`}>
                ${budget.spent.toFixed(0)} / ${budget.limit}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${isOverBudget ? "bg-red-600" : budget.color} transition-all`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{percentage.toFixed(0)}% of budget used</p>
          </div>
        )
      })}
    </div>
  )
}
