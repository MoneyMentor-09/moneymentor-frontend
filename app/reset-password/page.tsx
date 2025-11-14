"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Lock, Loader2 } from "lucide-react"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export default function ResetPasswordPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const validatePassword = (password: string) => {
    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSymbol = /[^A-Za-z0-9]/.test(password)
    return password.length >= 8 && hasUpper && hasLower && hasNumber && hasSymbol
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" })
      return
    }

    if (!validatePassword(password)) {
      toast({
        title: "Invalid password",
        description:
          "Password must be at least 8 characters long and include upper, lower, number, and symbol.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      toast({
        title: "Error resetting password",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Password updated",
      description: "Your password has been successfully reset.",
    })

    router.push("/login")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Reset Your Password</CardTitle>
        </CardHeader>
        <form onSubmit={handleReset}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Added spacing between confirm block and button */}
            <div className="pt-4"></div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
