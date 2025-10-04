"use client"

import { useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface Transaction {
  id: string
  description: string
  category: string
  amount: number
  date: string
}

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchTransactions() {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(5)

      if (!error && data) {
        setTransactions(data)
      }
      setIsLoading(false)
    }

    fetchTransactions()
  }, [])

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No transactions yet</p>
        <p className="text-sm text-muted-foreground mt-1">Upload a bank statement to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between py-3 border-b border-border last:border-0"
        >
          <div className="flex-1">
            <p className="font-medium text-foreground">{transaction.description}</p>
            <p className="text-sm text-muted-foreground">{transaction.category}</p>
          </div>
          <div className="text-right">
            <p className={`font-semibold ${transaction.amount > 0 ? "text-green-600" : "text-foreground"}`}>
              {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">{transaction.date}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
