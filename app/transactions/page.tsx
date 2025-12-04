"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Search,
  Filter,
  Upload,
  Edit,
  Trash2,
  Download,
  Calendar,
  DollarSign,
  Tag,
  Type,
} from "lucide-react"
import { toast } from "sonner"
import { UploadCSVDialog } from "@/components/upload-csv-dialog"
import { UploadHistoryButton } from "@/components/transactions/UploadHistoryButton"
import { useSearchParams } from "next/navigation"
import {
  analyzeSuspiciousTransactions,
  type Transaction as SuspiciousTx,
} from "@/lib/transactions/suspicious"

interface Transaction {
  id: string
  date: string
  description: string
  category: string
  type: "income" | "expense"
  amount: number
  created_at: string
}

const CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Education",
  "Travel",
  "Groceries",
  "Gas",
  "Rent/Mortgage",
  "Insurance",
  "Salary",
  "Freelance",
  "Investment",
  "Other",
]

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    category: "",
    type: "expense" as "income" | "expense",
    amount: "",
  })
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])

  // New: pattern/suspicious highlighting support
  const searchParams = useSearchParams()
  const [highlightIds, setHighlightIds] = useState<string[]>([])
  const [highlightDialogOpen, setHighlightDialogOpen] = useState(false)
  const [highlightMessage, setHighlightMessage] = useState<string | null>(null)
  const [highlightTxs, setHighlightTxs] = useState<Transaction[]>([])

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })

      if (error) throw error
      setTransactions(data || [])
      setSelectedTransactions([])
    } catch (error) {
      toast.error("Failed to fetch transactions")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // New: react to ?pattern= or ?highlight= in the URL
  useEffect(() => {
    if (!transactions.length) {
      // nothing loaded yet
      return
    }

    const patternId = searchParams.get("pattern")
    const singleId = searchParams.get("highlight")

    if (!patternId && !singleId) {
      setHighlightIds([])
      setHighlightTxs([])
      setHighlightMessage(null)
      setHighlightDialogOpen(false)
      return
    }

    if (patternId) {
      // Re-run suspicious analysis to find the matching pattern
      const suspicious = analyzeSuspiciousTransactions(
        transactions as unknown as SuspiciousTx[],
        {
          highAmountThreshold: 1000,
          smallAmountThreshold: 10,
          manySmallCountThreshold: 5,
        }
      )

      const match = suspicious.find((s) => s.id === patternId)
      if (match) {
        const ids = match.transactions.map((t) => t.id)
        setHighlightIds(ids)

        const txMap = new Map(transactions.map((t) => [t.id, t]))
        const list = ids.map((id) => txMap.get(id)).filter(Boolean) as Transaction[]

        setHighlightTxs(list)
        setHighlightMessage(match.message)
        setHighlightDialogOpen(true)
      } else {
        // pattern not found
        setHighlightIds([])
        setHighlightTxs([])
        setHighlightMessage(null)
        setHighlightDialogOpen(false)
      }
    } else if (singleId) {
      // old behavior: a single highlighted transaction
      setHighlightIds([singleId])
      const tx = transactions.find((t) => t.id === singleId)
      if (tx) {
        setHighlightTxs([tx])
        setHighlightMessage("Suspicious transaction")
        setHighlightDialogOpen(true)
      } else {
        setHighlightTxs([])
        setHighlightMessage(null)
        setHighlightDialogOpen(false)
      }
    }
  }, [transactions, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const transactionData = {
        user_id: user.id,
        date: form.date,
        description: form.description,
        category: form.category,
        type: form.type,
        amount: parseFloat(form.amount),
      }

      if (editingTransaction) {
        const { error } = await supabase.from("transactions").update(transactionData).eq("id", editingTransaction.id)

        if (error) throw error
        toast.success("Transaction updated successfully")
      } else {
        const { error } = await supabase.from("transactions").insert(transactionData)

        if (error) throw error
        toast.success("Transaction added successfully")
      }

      setForm({
        date: new Date().toISOString().split("T")[0],
        description: "",
        category: "",
        type: "expense",
        amount: "",
      })
      setEditingTransaction(null)
      setIsAddDialogOpen(false)
      setIsEditDialogOpen(false)
      fetchTransactions()
    } catch (error) {
      toast.error("Failed to save transaction")
      console.error(error)
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setForm({
      date: transaction.date,
      description: transaction.description,
      category: transaction.category,
      type: transaction.type,
      amount: transaction.amount.toString(),
    })
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.from("transactions").delete().eq("id", id)

      if (error) throw error
      toast.success("Transaction deleted successfully")
      fetchTransactions()
    } catch (error) {
      toast.error("Failed to delete transaction")
      console.error(error)
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedTransactions.length === 0) return
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.from("transactions").delete().in("id", selectedTransactions)

      if (error) throw error
      toast.success("Selected transactions deleted successfully")
      fetchTransactions()
    } catch (error) {
      toast.error("Failed to delete selected transactions")
      console.error(error)
    }
  }

  const handleDeleteAll = async () => {
    if (transactions.length === 0) return
    try {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from("transactions").delete().eq("user_id", user.id)

      if (error) throw error
      toast.success("All transactions deleted successfully")
      fetchTransactions()
    } catch (error) {
      toast.error("Failed to delete all transactions")
      console.error(error)
    }
  }

  const handleExport = () => {
    const csvContent = [
      ["Date", "Description", "Category", "Type", "Amount"],
      ...transactions.map((t) => [t.date, t.description, t.category, t.type, t.amount.toString()]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || transaction.type === filterType
    const matchesCategory = filterCategory === "all" || transaction.category === filterCategory

    return matchesSearch && matchesType && matchesCategory
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Transactions</h1>
              <p className="text-muted-foreground">Manage your financial transactions</p>
            </div>
          </div>
          <div className="h-96 bg-muted rounded-lg animate-pulse" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Transactions</h1>
            <p className="text-muted-foreground">Manage your financial transactions</p>
          </div>

          {/* Buttons responsive */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>

            <Button variant="outline" onClick={() => setIsUploadDialogOpen(true)} className="w-full sm:w-auto">
              <Upload className="h-4 w-4 mr-2" />
              Upload CSV
            </Button>

            <div className="w-full sm:w-auto">
              <UploadHistoryButton onChange={fetchTransactions} />
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Transaction</DialogTitle>
                  <DialogDescription>Enter the details for your new transaction.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Transaction description"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={form.type}
                        onValueChange={(value: "income" | "expense") => setForm({ ...form, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="expense">Expense</SelectItem>
                          <SelectItem value="income">Income</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Transaction</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* FILTERS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type-filter">Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-filter">Category</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Results</Label>
                <div className="flex items-center h-10 px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md">
                  {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TRANSACTION TABLE */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>View and manage all your financial transactions</CardDescription>
            </div>

            {transactions.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={selectedTransactions.length === 0} className="w-full sm:w-auto">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Selected Transactions</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedTransactions.length} selected transaction
                        {selectedTransactions.length !== 1 ? "s" : ""}? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteSelected}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={transactions.length === 0} className="w-full sm:w-auto">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete All
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete All Transactions</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete all transactions? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAll}>
                        Delete All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {/* Empty State */}
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No transactions found</h3>

                <p className="text-muted-foreground mb-4">
                  {transactions.length === 0
                    ? "Start by adding your first transaction or uploading a CSV file."
                    : "Try adjusting your search or filter criteria."}
                </p>

                {transactions.length === 0 && (
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Transaction
                    </Button>

                    <Button variant="outline" onClick={() => setIsUploadDialogOpen(true)} className="w-full sm:w-auto">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload CSV
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              /* RESPONSIVE TABLE WRAPPER */
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <input
                          type="checkbox"
                          checked={selectedTransactions.length === transactions.length && transactions.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTransactions(transactions.map((t) => t.id))
                            } else {
                              setSelectedTransactions([])
                            }
                          }}
                        />
                      </TableHead>

                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow
                        key={transaction.id}
                        className={
                          highlightIds.includes(transaction.id)
                            ? "bg-yellow-50 border-l-4 border-l-yellow-500"
                            : ""
                        }
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedTransactions.includes(transaction.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTransactions((prev) => [...prev, transaction.id])
                              } else {
                                setSelectedTransactions((prev) => prev.filter((id) => id !== transaction.id))
                              }
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(transaction.date).toLocaleDateString()}
                          </div>
                        </TableCell>

                        <TableCell className="whitespace-normal break-words max-w-[200px] font-medium">
                          {transaction.description}
                        </TableCell>

                        <TableCell className="whitespace-normal break-words max-w-[150px]">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            {transaction.category}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant={transaction.type === "income" ? "default" : "secondary"}>
                            <Type className="h-3 w-3 mr-1" />
                            {transaction.type}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <span
                            className={`font-medium ${
                              transaction.type === "income" ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {transaction.amount < 0 ? "-" : "+"}$
                            {Math.abs(transaction.amount).toLocaleString()}
                          </span>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(transaction)}>
                              <Edit className="h-4 w-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>

                              <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this transaction? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>

                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(transaction.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* EDIT TRANSACTION DIALOG */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Transaction</DialogTitle>
              <DialogDescription>Update the details for this transaction.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-amount">Amount</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  placeholder="Transaction description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(value: "income" | "expense") => setForm({ ...form, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Transaction</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Upload CSV Dialog */}
        <UploadCSVDialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen} onSuccess={fetchTransactions} />
      </div>

      {/* Suspicious transactions popup (pattern or single) */}
      <Dialog open={highlightDialogOpen} onOpenChange={setHighlightDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Suspicious transactions</DialogTitle>
            <DialogDescription>
              {highlightMessage ?? "These transactions were flagged as suspicious for this alert."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-auto mt-2">
            {highlightTxs.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded border px-3 py-2 text-sm"
              >
                <div>
                  <div className="font-medium">{tx.description}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(tx.date).toLocaleDateString()} • {tx.category} • {tx.type}
                  </div>
                </div>
                <div
                  className={
                    tx.type === "income"
                      ? "text-green-600 font-semibold"
                      : "text-red-600 font-semibold"
                  }
                >
                  {tx.type === "income" ? "+" : "-"}$
                  {Math.abs(tx.amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            ))}
            {highlightTxs.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No matching transactions found. They may have been deleted.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setHighlightDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
