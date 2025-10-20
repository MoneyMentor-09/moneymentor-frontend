"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface Alert {
  id: string
  type: "budget_exceeded" | "large_transaction" | "unusual_spending" | "low_balance" | "custom"
  message: string
  threshold_amount?: number
  category_id?: string
}

interface EditAlertDialogProps {
  alert: Alert
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface Category {
  id: string
  name: string
}

export function EditAlertDialog({ alert, open, onOpenChange, onSuccess }: EditAlertDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({
    type: alert.type,
    message: alert.message,
    threshold_amount: alert.threshold_amount ? String(alert.threshold_amount) : "",
    category_id: alert.category_id || "",
  })
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchCategories()
      setForm({
        type: alert.type,
        message: alert.message,
        threshold_amount: alert.threshold_amount ? String(alert.threshold_amount) : "",
        category_id: alert.category_id || "",
      })
    }
  }, [open, alert])

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

      const { error } = await supabase
        .from("alerts")
        .update({
          type: form.type,
          message: form.message,
          threshold_amount: form.threshold_amount ? Number(form.threshold_amount) : null,
          category_id: form.category_id || null,
        })
        .eq("id", alert.id)
        .eq("user_id", user.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Alert updated successfully",
      })

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update alert",
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
          <DialogTitle>Edit Alert</DialogTitle>
          <DialogDescription>Update your alert settings</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Alert Type</Label>
            <Select value={form.type} onValueChange={(value: any) => setForm({ ...form, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="budget_exceeded">Budget Exceeded</SelectItem>
                <SelectItem value="large_transaction">Large Transaction</SelectItem>
                <SelectItem value="unusual_spending">Unusual Spending</SelectItem>
                <SelectItem value="low_balance">Low Balance</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Alert Message</Label>
            <Textarea
              id="message"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="threshold">Threshold Amount (optional)</Label>
            <Input
              id="threshold"
              type="number"
              step="0.01"
              value={form.threshold_amount}
              onChange={(e) => setForm({ ...form, threshold_amount: e.target.value })}
              placeholder="0.00"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category (optional)</Label>
            <Select value={form.category_id} onValueChange={(value) => setForm({ ...form, category_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Button type="submit" className="flex-1" disabled={!form.message || isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
