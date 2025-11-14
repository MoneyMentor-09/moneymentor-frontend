"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface FilterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApply: (filters: FilterState) => void
  currentFilters: FilterState
}

interface FilterState {
  categoryId?: string
  type?: "income" | "expense"
  startDate?: string
  endDate?: string
}

interface Category {
  id: string
  name: string
}

export function FilterDialog({ open, onOpenChange, onApply, currentFilters }: FilterDialogProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [filters, setFilters] = useState<FilterState>(currentFilters)

  useEffect(() => {
    if (open) {
      fetchCategories()
      setFilters(currentFilters)
    }
  }, [open, currentFilters])

  async function fetchCategories() {
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase.from("categories").select("*").order("name")
    if (data) {
      setCategories(data)
    }
  }

  const handleApply = () => {
    onApply(filters)
  }

  const handleClear = () => {
    setFilters({})
    onApply({})
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filter Transactions</DialogTitle>
          <DialogDescription>Filter transactions by category, type, or date range</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Transaction Type</Label>
            <Select
              value={filters.type || "all"}
              onValueChange={(value) =>
                setFilters({ ...filters, type: value === "all" ? undefined : (value as "income" | "expense") })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={filters.categoryId || "all"}
              onValueChange={(value) => setFilters({ ...filters, categoryId: value === "all" ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate || ""}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate || ""}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined })}
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={handleClear} className="flex-1 bg-transparent">
              Clear Filters
            </Button>
            <Button onClick={handleApply} className="flex-1">
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
