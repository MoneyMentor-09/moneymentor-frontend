"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface Transaction {
  id: string
  amount: number
  type: "income" | "expense"
  date: string
  category_id?: string
}

interface Budget {
  id: string
  amount: number
  category_id: string
  category?: {
    name: string
    color?: string
  }
}

interface DashboardChartsProps {
  transactions: Transaction[]
  budgets: Budget[]
  spendingByCategory: Record<string, number>
}

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#14b8a6"]

export function DashboardCharts({ transactions, budgets, spendingByCategory }: DashboardChartsProps) {
  // Prepare spending by category data for pie chart
  const categoryData = Object.entries(spendingByCategory).map(([categoryId, amount], index) => ({
    name: `Category ${index + 1}`,
    value: amount,
    fill: COLORS[index % COLORS.length],
  }))

  // Prepare income vs expenses over time (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toISOString().split("T")[0]
  })

  const dailyData = last7Days.map((date) => {
    const dayTransactions = transactions.filter((t) => t.date === date)
    const income = dayTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0)
    const expenses = dayTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0)

    return {
      date: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
      income,
      expenses,
    }
  })

  return (
    <>
      {/* Income vs Expenses Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Income vs Expenses (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyData.every((d) => d.income === 0 && d.expenses === 0) ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No transaction data for the last 7 days
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" fill="#10b981" name="Income" />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Spending by Category Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No expense data to display
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </>
  )
}
