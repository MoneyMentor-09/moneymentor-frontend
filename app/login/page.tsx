"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email")
  const [form, setForm] = useState({ email: "", phone: "", password: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const supabase = getSupabaseBrowserClient()

      if (loginMethod === "phone") {
        const redirectUrl =
          process.env.NODE_ENV === "development"
            ? "http://localhost:3000/dashboard"
            : "https://moneymentor-09.vercel.app/dashboard"

        const { data, error } = await supabase.auth.signInWithOtp({
          phone: form.phone,
          options: { redirectTo: redirectUrl },
        })

        if (error) throw error

        setError("OTP sent! Check your phone to continue.")
        return
      }

      // Email/password login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (signInError) throw signInError

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError("")

    try {
      const supabase = getSupabaseBrowserClient()
      const redirectUrl =
        process.env.NODE_ENV === "development"
          ? "http://localhost:3000/dashboard"
          : "https://moneymentor-09.vercel.app/dashboard"

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl },
      })

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign in failed.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent mb-2">
            MoneyMentor
          </h1>
          <p className="text-muted-foreground">Welcome back</p>
        </div>

        <div className="bg-card/80 backdrop-blur-sm rounded-lg shadow-xl shadow-primary/10 p-8 border border-border">
          <h2 className="text-2xl font-semibold mb-6 text-center">Log In</h2>

          {/* Google Login */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
            </div>
          </div>

          {/* Email / Phone toggle */}
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              variant={loginMethod === "email" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setLoginMethod("email")}
            >
              Email
            </Button>
            <Button
              type="button"
              variant={loginMethod === "phone" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setLoginMethod("phone")}
            >
              Phone
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {loginMethod === "email" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="forgot-password" className="text-xs text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">We'll send you a one-time code to verify your number</p>
              </div>
            )}

            {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Processing..." : loginMethod === "phone" ? "Send Code" : "Log In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link href="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
