"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react"
import { parseCSV } from "@/lib/csv-parser"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface UploadCSVDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UploadCSVDialog({ open, onOpenChange }: UploadCSVDialogProps) {
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

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setUploadStatus("idle")

    try {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("You must be logged in to upload transactions")
      }

      const text = await file.text()
      const transactions = parseCSV(text)

      const transactionsToInsert = transactions.map((t) => ({
        user_id: user.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        category: t.category,
        type: t.amount >= 0 ? "income" : "expense",
      }))

      const { error } = await supabase.from("transactions").insert(transactionsToInsert)

      if (error) {
        throw new Error(error.message)
      }

      setUploadStatus("success")
      toast({
        title: "Upload successful",
        description: `${transactions.length} transactions imported successfully`,
      })

      setTimeout(() => {
        onOpenChange(false)
        setFile(null)
        setUploadStatus("idle")
        window.location.reload() // Refresh to show new transactions
      }, 2000)
    } catch (error) {
      setUploadStatus("error")
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to parse CSV file",
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
            Upload a CSV file containing your transaction data. The file should include columns for date, description,
            amount, and category.
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
              <p className="text-sm font-medium text-foreground mb-1">Click to upload CSV file</p>
              <p className="text-xs text-muted-foreground">or drag and drop</p>
            </label>
          </div>

          {/* Selected File */}
          {file && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
              {uploadStatus === "success" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              {uploadStatus === "error" && <AlertCircle className="h-5 w-5 text-red-600" />}
            </div>
          )}

          {/* CSV Format Example */}
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-xs font-medium text-foreground mb-2">Expected CSV format:</p>
            <pre className="text-xs text-muted-foreground font-mono">
              date,description,amount,category{"\n"}
              2025-09-28,Grocery Store,-85.32,Food & Dining{"\n"}
              2025-09-27,Salary,5200.00,Income
            </pre>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={isUploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} className="flex-1" disabled={!file || isUploading}>
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
