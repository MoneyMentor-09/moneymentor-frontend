"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface Budget {
  id: string
  category_id: string
  amount: number
  month: number
  year: number
  category?: {
    name: string
  }
}

interface EditBudgetDialogProps {
  budget: Budget
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditBudgetDialog({ budget, open, onOpenChange, onSuccess }: EditBudgetDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [amount, setAmount] = useState(String(budget.amount))
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setAmount(String(budget.amount))
    }
  }, [open, budget])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("You must be logged in")
      }

      const { error } = await supabase
        .from("budgets")
        .update({
          amount: Number(amount),
        })
        .eq("id", budget.id)
        .eq("user_id", user.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Budget updated successfully",
      })

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update budget",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Budget</DialogTitle>
          <DialogDescription>Update the budget amount for {budget.category?.name}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Budget Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={!amount || isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
