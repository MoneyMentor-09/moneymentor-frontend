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

interface AddBudgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface Category {
  id: string
  name: string
  type: "income" | "expense"
}

export function AddBudgetDialog({ open, onOpenChange, onSuccess }: AddBudgetDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({
    category_id: "",
    amount: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  })
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchCategories()
    }
  }, [open])

  async function fetchCategories() {
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase.from("categories").select("*").eq("type", "expense").order("name")
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

      // Check if budget already exists for this category and month
      const { data: existing } = await supabase
        .from("budgets")
        .select("id")
        .eq("user_id", user.id)
        .eq("category_id", form.category_id)
        .eq("month", form.month)
        .eq("year", form.year)
        .single()

      if (existing) {
        throw new Error("A budget for this category already exists for this month")
      }

      const { error } = await supabase.from("budgets").insert({
        user_id: user.id,
        category_id: form.category_id,
        amount: Number(form.amount),
        month: form.month,
        year: form.year,
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Budget created successfully",
      })

      setForm({
        category_id: "",
        amount: "",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      })

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create budget",
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
          <DialogTitle>Create Budget</DialogTitle>
          <DialogDescription>Set a spending limit for a category</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={form.category_id} onValueChange={(value) => setForm({ ...form, category_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Budget Amount</Label>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Select value={String(form.month)} onValueChange={(value) => setForm({ ...form, month: Number(value) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={String(month)}>
                      {new Date(2000, month - 1).toLocaleDateString("en-US", { month: "long" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select value={String(form.year)} onValueChange={(value) => setForm({ ...form, year: Number(value) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <Button type="submit" className="flex-1" disabled={!form.category_id || !form.amount || isLoading}>
              {isLoading ? "Creating..." : "Create Budget"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
