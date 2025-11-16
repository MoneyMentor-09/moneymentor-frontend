"use client"

import { useState } from "react"
import type React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
} from "lucide-react"
import { parseCSV, generateSampleCSV } from "@/lib/csv-parser"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface UploadCSVDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function UploadCSVDialog({
  open,
  onOpenChange,
  onSuccess,
}: UploadCSVDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile)
      setUploadStatus("idle")
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      })
    }
  }

  const handleDownloadSample = () => {
    const csv = generateSampleCSV()
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sample-transactions.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast({
      title: "Sample downloaded",
      description: "Use this format for your transaction CSV",
    })
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setUploadStatus("idle")

    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user }, error: userErr } = await supabase.auth.getUser()

      if (userErr || !user) {
        throw new Error("You must be logged in to upload transactions")
      }

      // 1) Parse CSV text
      const text = await file.text()
      const transactions = parseCSV(text)

      if (!Array.isArray(transactions) || transactions.length === 0) {
        throw new Error("CSV appears empty or invalid.")
      }

      // 2) Map to DB rows (DATE column expects 'YYYY-MM-DD' string)
      const transactionsToInsert = transactions.map((t) => {
        const amt = Number(t.amount)
        return {
          user_id: user.id,
          date: t.date, // keep as 'YYYY-MM-DD' since your DB column is DATE
          description: t.description,
          amount: amt,
          type: amt >= 0 ? "income" : "expense",
          category: (t.category || "").trim(),
        }
      })

      // 3) Insert and RETURN the new IDs (this is key!)
      const { data: inserted, error: insertErr } = await supabase
        .from("transactions")
        .insert(transactionsToInsert)
        .select("id") // <-- ensure IDs are returned

      if (insertErr) {
        throw new Error(insertErr.message)
      }

      const insertedIds = (inserted ?? []).map((r: { id: string }) => r.id)

      // Optional sanity: if nothing inserted, bail early
      if (insertedIds.length === 0) {
        // Not throwing—still show success for UX, but warn in console.
        console.warn("Insert returned no IDs; manifest will not be written.")
      } else {
        // 4) Tell the server to write the manifest for History view
        // (If this fails, transactions are still in DB; only history list is affected.)
        const res = await fetch("/api/transactions/manifest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            insertedIds,
            rowCount: insertedIds.length,
          }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          console.error("Manifest write failed:", body?.error || res.statusText)
        }
      }

      setUploadStatus("success")
      toast({
        title: "Upload successful",
        description: `${transactions.length} transactions imported successfully`,
      })

      // Close dialog + refresh parent after a short delay (kept your UX)
      setTimeout(() => {
        onOpenChange(false)
        setFile(null)
        setUploadStatus("idle")
        onSuccess?.()
      }, 2000)
    } catch (error) {
      setUploadStatus("error")
      toast({
        title: "Upload failed",
        description:
          error instanceof Error ? error.message : "Failed to parse CSV file",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Transaction CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing your transaction data. The file should
            include columns for date, description, amount, and category.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Area */}
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
              disabled={isUploading}
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground mb-1">
                Click to upload CSV file
              </p>
              <p className="text-xs text-muted-foreground">or drag and drop</p>
            </label>
          </div>

          {/* Selected File */}
          {file && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              {uploadStatus === "success" && (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
              {uploadStatus === "error" && (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
          )}

          {/* CSV Format Example */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-foreground">
                Expected CSV format:
              </p>
              <Button variant="ghost" size="sm" onClick={handleDownloadSample}>
                <Download className="h-3 w-3 mr-1" />
                Download Sample
              </Button>
            </div>
            <pre className="text-xs text-muted-foreground font-mono">
              date,description,amount,category{"\n"}
              2025-09-28,Grocery Store,-85.32,Groceries{"\n"}
              2025-09-27,Salary,5200.00,Salary
            </pre>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              className="flex-1"
              disabled={!file || isUploading}
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
