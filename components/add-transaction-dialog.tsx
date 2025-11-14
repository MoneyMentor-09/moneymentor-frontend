"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface AddTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface Category {
  id: string
  name: string
  type: "income" | "expense"
}

export function AddTransactionDialog({ open, onOpenChange, onSuccess }: AddTransactionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({
    description: "",
    amount: "",
    type: "expense" as "income" | "expense",
    category_id: "",
    date: new Date().toISOString().split("T")[0],
  })
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchCategories()
    }
  }, [open])

  async function fetchCategories() {
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase.from("categories").select("*").order("name")
    if (data) {
      setCategories(data)
    }
  }

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

      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        description: form.description,
        amount: Number(form.amount),
        type: form.type,
        category_id: form.category_id || null,
        date: form.date,
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Transaction added successfully",
      })

      setForm({
        description: "",
        amount: "",
        type: "expense",
        category_id: "",
        date: new Date().toISOString().split("T")[0],
      })

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add transaction",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCategories = categories.filter((c) => c.type === form.type)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>Enter the details of your transaction</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={form.type}
              onValueChange={(value: "income" | "expense") => setForm({ ...form, type: value, category_id: "" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g., Grocery shopping"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0.00"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={form.category_id} onValueChange={(value) => setForm({ ...form, category_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
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
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
