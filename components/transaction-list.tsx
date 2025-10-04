"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  category: string
}

interface TransactionListProps {
  searchQuery: string
}

export function TransactionList({ searchQuery }: TransactionListProps) {
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

      if (!error && data) {
        setTransactions(data)
      }
      setIsLoading(false)
    }

    fetchTransactions()
  }, [])

  const filteredTransactions = transactions.filter(
    (t) =>
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Income: "bg-green-100 text-green-800 border-green-200",
      "Food & Dining": "bg-orange-100 text-orange-800 border-orange-200",
      Transportation: "bg-blue-100 text-blue-800 border-blue-200",
      Utilities: "bg-purple-100 text-purple-800 border-purple-200",
      Shopping: "bg-pink-100 text-pink-800 border-pink-200",
      "Health & Fitness": "bg-teal-100 text-teal-800 border-teal-200",
      Entertainment: "bg-indigo-100 text-indigo-800 border-indigo-200",
    }
    return colors[category] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading transactions...</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No transactions found</p>
        </div>
      ) : (
        filteredTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between py-4 px-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <p className="font-medium text-foreground">{transaction.description}</p>
                <Badge variant="outline" className={getCategoryColor(transaction.category)}>
                  {transaction.category}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{transaction.date}</p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-semibold ${transaction.amount > 0 ? "text-green-600" : "text-foreground"}`}>
                {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
