"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function AnalyzePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedBank, setSelectedBank] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (selectedFile && selectedBank) {
      setIsUploading(true)
      console.log("[v0] Uploading file:", selectedFile.name, "for bank:", selectedBank)

      try {
        const formData = new FormData()
        formData.append("file", selectedFile)
        formData.append("bankType", selectedBank)

        const response = await fetch("/api/analyze-csv", {
          method: "POST",
          body: formData,
        })

        const result = await response.json()
        console.log("[v0] Analysis result:", result)

        if (result.success) {
          // Redirect to results page or show results
          alert("Analysis complete! Check console for results.")
        }
      } catch (error) {
        console.error("[v0] Upload error:", error)
        alert("Failed to upload file. Please try again.")
      } finally {
        setIsUploading(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border py-4 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <h1 className="font-serif font-bold text-xl text-foreground">Money Mentor</h1>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-foreground hover:bg-primary/10 transition-all duration-300">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-primary text-secondary hover:bg-primary/90 hover:scale-105 transition-all duration-300">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h2 className="font-serif font-bold text-4xl md:text-5xl text-foreground mb-4">
              Analyze Your Banking Data
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload your bank statement CSV file to get comprehensive insights into your spending patterns and
              financial health.
            </p>
          </div>

          {/* Upload Section */}
          <Card className="bg-card border-border shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="font-serif text-2xl text-card-foreground">Upload Bank Statement</CardTitle>
              <CardDescription className="text-muted-foreground">
                Select your bank and upload a CSV file containing your transaction history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bank Selection */}
              <div className="space-y-3">
                <Label htmlFor="bank-select" className="text-foreground font-medium">
                  Select Your Bank
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedBank("visa")}
                    className={`p-6 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                      selectedBank === "visa"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                        <span className="text-2xl">💳</span>
                      </div>
                      <div className="text-left">
                        <h3 className="font-serif font-bold text-lg text-card-foreground">Visa</h3>
                        <p className="text-sm text-muted-foreground">Visa credit/debit cards</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedBank("mastercard")}
                    className={`p-6 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                      selectedBank === "mastercard"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                        <span className="text-2xl">💳</span>
                      </div>
                      <div className="text-left">
                        <h3 className="font-serif font-bold text-lg text-card-foreground">Mastercard</h3>
                        <p className="text-sm text-muted-foreground">Mastercard credit/debit cards</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-3">
                <Label htmlFor="csv-upload" className="text-foreground font-medium">
                  Upload CSV File
                </Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <input id="csv-upload" type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-3xl">📄</span>
                      </div>
                      <div>
                        <p className="text-foreground font-medium mb-1">
                          {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
                        </p>
                        <p className="text-sm text-muted-foreground">CSV files only (max 10MB)</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || !selectedBank || isUploading}
                className="w-full bg-primary text-secondary hover:bg-primary/90 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                size="lg"
              >
                {isUploading ? "Analyzing..." : "Analyze My Banking Data"}
              </Button>
            </CardContent>
          </Card>

          {/* What Happens Next */}
          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <CardTitle className="font-serif text-2xl text-card-foreground">What Happens Next?</CardTitle>
              <CardDescription className="text-muted-foreground">
                After uploading your CSV file, here's what you can expect
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🔍</span>
                </div>
                <div>
                  <h4 className="font-serif font-bold text-lg text-card-foreground mb-1">Instant Analysis</h4>
                  <p className="text-muted-foreground">
                    Our AI will immediately process your transactions and categorize your spending across different
                    areas.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">📊</span>
                </div>
                <div>
                  <h4 className="font-serif font-bold text-lg text-card-foreground mb-1">Monthly Spending Breakdown</h4>
                  <p className="text-muted-foreground">
                    You'll be taken to a detailed dashboard showing your monthly spending habits, trends, and patterns
                    across categories like groceries, entertainment, utilities, and more.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">💡</span>
                </div>
                <div>
                  <h4 className="font-serif font-bold text-lg text-card-foreground mb-1">Personalized Insights</h4>
                  <p className="text-muted-foreground">
                    Get AI-powered recommendations on how to optimize your spending and save more money based on your
                    unique financial patterns.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-muted-foreground py-6 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <span className="font-serif font-bold text-primary-foreground">Money Mentor</span>
          </div>
          <p className="text-primary-foreground text-sm">© 2025 Money Mentor. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
