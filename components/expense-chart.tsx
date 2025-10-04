"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface ChartData {
  month: string
  amount: number
}

const chartConfig = {
  amount: {
    label: "Spending",
    color: "hsl(var(--chart-1))",
  },
}

export function ExpenseChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchExpenses() {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      // Get last 6 months of data
      const months = []
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const now = new Date()

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const startDate = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split("T")[0]
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split("T")[0]

        const { data: transactions } = await supabase
          .from("transactions")
          .select("amount, type")
          .eq("user_id", user.id)
          .eq("type", "expense")
          .gte("date", startDate)
          .lte("date", endDate)

        const total = transactions?.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0

        months.push({
          month: monthNames[date.getMonth()],
          amount: total,
        })
      }

      setData(months)
      setIsLoading(false)
    }

    fetchExpenses()
  }, [])

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading chart...</p>
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="month" className="text-xs" />
          <YAxis className="text-xs" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="amount" fill="var(--color-amount)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
