"use client"

import { useState, useEffect, JSXElementConstructor, ReactElement, ReactNode, ReactPortal } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Target, 
  Edit, 
  Trash2, 
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from "lucide-react"
import { toast } from "sonner"

interface Budget {
  id: string
  category: string
  amount: number
  spent: number
  period: string
  purpose?: string
  created_at: string
}

interface Transaction {
  id: string
  category: string
  type: 'income' | 'expense'
  amount: number
}

const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Groceries',
  'Gas',
  'Rent/Mortgage',
  'Insurance',
  'Other'
]

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [form, setForm] = useState({ category: "", limit: "", notes: "", purpose: "" })
  
  // New state for filter
  const [selectedCategory, setSelectedCategory] = useState<string>("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('category')
      if (budgetsError) throw budgetsError
      setBudgets(budgetsData || [])

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('category, type, amount')
        .eq('user_id', user.id)
        .eq('type', 'expense')
      if (transactionsError) throw transactionsError
      setTransactions(transactionsData || [])
    } catch (error: unknown) {
      toast.error("Failed to fetch budget data")
      if (error instanceof Error) console.error(error.message)
      else console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const calculateSpentAmount = (category: string) => {
    return transactions
      .filter(t => t.category === category)
      .reduce((sum, t) => sum + t.amount, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const budgetData = {
        user_id: user.id,
        category: form.category,
        amount: parseFloat(form.limit),
        spent: calculateSpentAmount(form.category),
        purpose: form.purpose
      }

      if (editingBudget) {
        const { error } = await supabase
          .from('budgets')
          .update(budgetData)
          .eq('id', editingBudget.id)
        if (error) throw error
        toast.success("Budget updated successfully")
      } else {
        const { error } = await supabase
          .from('budgets')
          .upsert(budgetData, { onConflict: ['user_id', 'category', 'period'] })
        if (error) throw error
        toast.success("Budget created successfully")
      }

      setForm({ category: "", limit: "", notes: "", purpose: "" })
      setEditingBudget(null)
      setIsAddDialogOpen(false)
      setIsEditDialogOpen(false)
      fetchData()
    } catch (error: unknown) {
      toast.error("Failed to save budget")
      if (error instanceof Error) console.error(error.message)
      else console.error(error)
    }
  }

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget)
    setForm({
      category: budget.category,
      limit: budget.amount.toString(),
      notes: "",
      purpose: budget.purpose || ""
    })
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
      if (error) throw error
      toast.success("Budget deleted successfully")
      fetchData()
    } catch (error: unknown) {
      toast.error("Failed to delete budget")
      if (error instanceof Error) console.error(error.message)
      else console.error(error)
    }
  }

  const getBudgetStatus = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100
    if (percentage >= 100) return { status: 'over', color: 'text-red-600' }
    if (percentage >= 80) return { status: 'warning', color: 'text-yellow-600' }
    return { status: 'good', color: 'text-green-600' }
  }

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
  const totalRemaining = totalBudgeted + (totalSpent)
  const overBudgetCount = budgets.filter(b => b.spent > b.amount).length

  // Apply category filter 
  const filteredBudgets = selectedCategory
    ? budgets.filter(b => b.category === selectedCategory)
    : budgets

  if (loading) return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Budget</h1>
            <p className="text-muted-foreground">Manage your spending limits and track progress</p>
          </div>

          <div className="flex items-center gap-3">

            
          <div className="flex items-center gap-2">
            {/* Show Clear Filter button only if a category is selected */}
            {selectedCategory && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setSelectedCategory("")}
              >
                Clear Filter
              </Button>
            )}

            {/* Filter Dropdown */}
            <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

            {/* Add Budget Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Budget
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Budget</DialogTitle>
                  <DialogDescription>Set a spending limit for a specific category.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Monthly Limit</Label>
                    <Input type="number" step="0.01" placeholder="0.00" value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Purpose</Label>
                    <Input type="text" placeholder="Why are you creating this budget?" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                    <Button type="submit">Create Budget</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Budget Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Budgeted</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalBudgeted.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{budgets.length} categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalSpent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{((totalSpent / totalBudgeted) * 100).toFixed(1)}% of budget</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm font-medium">Remaining</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(totalRemaining).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">{totalRemaining >= 0 ? 'Available to spend' : 'Over budget'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm font-medium">Over Budget</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overBudgetCount}</div>
              <p className="text-xs text-muted-foreground">Categories over limit</p>
            </CardContent>
          </Card>
        </div>

        {/* Budget Cards */}
        {filteredBudgets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No budgets set up yet</h3>
              <p className="text-muted-foreground mb-4">Create your first budget to start tracking your spending limits.</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Budget
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredBudgets.map((budget) => {
              const status = getBudgetStatus(budget.spent, budget.amount)
              const percentage = Math.min((budget.spent / budget.amount) * 100, 100)
              return (
                <Card key={budget.id} className={`${budget.spent > budget.amount ? 'border-red-600 bg-red-50/80' : ''}`}>
                  <CardHeader className="pb-3 flex justify-between items-center">
                    <CardTitle className="text-lg">{budget.category}</CardTitle>
                    <div className="flex items-center gap-2">
                      {budget.spent > budget.amount && (
                        <Badge variant="destructive" className="text-xs">Over Budget</Badge>
                      )}
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(budget)}><Edit className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Budget</AlertDialogTitle>
                              <AlertDialogDescription>Are you sure you want to delete the budget for {budget.category}? This cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(budget.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                  

                    {/* Amounts */}
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-sm text-muted-foreground">Spent</span><span className="font-medium">${budget.spent.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-sm text-muted-foreground">Limit</span><span className="font-medium">${budget.amount.toLocaleString()}</span></div>
                      <div className="flex justify-between border-t pt-2"><span className="text-sm font-medium">Remaining</span>
                        <span className={`font-bold ${budget.spent > budget.amount ? 'text-red-600' : 'text-green-600'}`}>
                          ${Math.abs(budget.amount + budget.spent).toLocaleString()}
                        </span>
                      </div>
                      {budget.purpose && (
                        <div className="text-sm text-muted-foreground pt-1 italic">Purpose: {budget.purpose}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Edit Budget Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Budget</DialogTitle>
              <DialogDescription>Update the details for this budget.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monthly Limit</Label>
                <Input type="number" step="0.01" value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} required/>
              </div>
              <div className="space-y-2">
                <Label>Purpose</Label>
                <Input type="text" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Update Budget</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
