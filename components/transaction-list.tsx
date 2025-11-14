"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Pencil, Trash2 } from "lucide-react"
import { EditTransactionDialog } from "@/components/edit-transaction-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: "income" | "expense"
  category_id?: string
  category?: {
    id: string
    name: string
    color?: string
  }
}

interface TransactionListProps {
  searchQuery: string
  filters?: {
    categoryId?: string
    type?: "income" | "expense"
    startDate?: string
    endDate?: string
  }
  onRefresh?: () => void
}

export function TransactionList({ searchQuery, filters, onRefresh }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchTransactions()
  }, [filters])

  async function fetchTransactions() {
    const supabase = getSupabaseBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setIsLoading(false)
      return
    }

    let query = supabase
      .from("transactions")
      .select(`
        *,
        category:categories(*)
      `)
      .eq("user_id", user.id)
      .order("date", { ascending: false })

    // Apply filters
    if (filters?.categoryId) {
      query = query.eq("category_id", filters.categoryId)
    }
    if (filters?.type) {
      query = query.eq("type", filters.type)
    }
    if (filters?.startDate) {
      query = query.gte("date", filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte("date", filters.endDate)
    }

    const { data, error } = await query

    if (!error && data) {
      setTransactions(data)
    }
    setIsLoading(false)
  }

  const handleDelete = async (id: string) => {
    const supabase = getSupabaseBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase.from("transactions").delete().eq("id", id).eq("user_id", user.id)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      })
      fetchTransactions()
      onRefresh?.()
    }

    setDeletingId(null)
  }

  const filteredTransactions = transactions.filter(
    (t) =>
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading transactions...</p>
      </div>
    )
  }

  return (
    <>
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
                  {transaction.category && (
                    <Badge
                      variant="outline"
                      style={{
                        backgroundColor: transaction.category.color + "20",
                        borderColor: transaction.category.color,
                      }}
                    >
                      {transaction.category.name}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-4">
                <p
                  className={`text-lg font-semibold ${transaction.type === "income" ? "text-green-600" : "text-foreground"}`}
                >
                  {transaction.type === "income" ? "+" : "-"}${Math.abs(Number(transaction.amount)).toFixed(2)}
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditingTransaction(transaction)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeletingId(transaction.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      {editingTransaction && (
        <EditTransactionDialog
          transaction={editingTransaction}
          open={!!editingTransaction}
          onOpenChange={(open) => !open && setEditingTransaction(null)}
          onSuccess={() => {
            fetchTransactions()
            onRefresh?.()
            setEditingTransaction(null)
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
