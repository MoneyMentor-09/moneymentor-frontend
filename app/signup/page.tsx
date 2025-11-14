"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Check, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast" // ✅ useToast is now wrapped with Sonner

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast() // ✅ initialize toast
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [signupMethod, setSignupMethod] = useState<"email" | "phone">("email")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const validatePassword = (password: string) => {
    const hasMinLength = password.length >= 8
    const hasUppercase = /[A-Z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    return {
      hasMinLength,
      hasUppercase,
      hasNumber,
      hasSpecialChar,
      isValid: hasMinLength && hasUppercase && hasNumber
    }
  }

  const passwordValidation = validatePassword(form.password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (form.password !== form.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Please make sure both password fields match.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (!passwordValidation.isValid) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 8 characters, include one uppercase letter and one number.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const supabase = getSupabaseBrowserClient()

      if (signupMethod === "phone") {
        const { error: signUpError } = await supabase.auth.signUp({
          phone: form.phone,
          password: form.password,
          options: { data: { full_name: form.fullName } }
        })

        if (signUpError) {
          if (signUpError.message?.toLowerCase().includes("already registered")) {
            toast({
              title: "Phone Already Registered",
              description: "This phone number already exists. Try signing in or reset your password.",
              variant: "destructive",
            })
          } else {
            toast({
              title: "Signup Error",
              description: signUpError.message,
              variant: "destructive",
            })
          }
          setIsLoading(false)
          return
        }

        toast({
          title: "Verification Required",
          description: "Check your phone for a verification code to complete signup.",
        })
        return
      }

      // Email signup
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.fullName } }
      })

      if (signUpError) {
        if (
          signUpError.message?.includes("already registered") ||
          signUpError.message?.toLowerCase().includes("user already exists")
        ) {
          toast({
            title: "Account Already Exists",
            description: (
              <>
                An account with this email already exists.{" "}
                <Link href="/forgot-password" className="underline text-primary font-medium">
                  Forgot Password?
                </Link>
              </>
            ),
            variant: "destructive",
          })
        } else {
          toast({
            title: "Signup Failed",
            description: signUpError.message,
            variant: "destructive",
          })
        }
        setIsLoading(false)
        return
      }

      // Create profile safely
      const user = (await supabase.auth.getUser()).data.user
      if (user?.id) {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single()

        if (!existingProfile) {
          const { error: profileError } = await supabase.from("profiles").insert({
            id: user.id,
            full_name: form.fullName,
            email: form.email,
            phone: form.phone || null
          })

          if (profileError) console.error("Profile creation error:", profileError)
        }
      }

      toast({
        title: "Account Created 🎉",
        description: "Please check your email to verify your account.",
      })

      setTimeout(() => {
        router.push("/login")
        router.refresh()
      }, 2500)
    } catch (err) {
      console.error("Signup failed:", err)
      toast({
        title: "Unexpected Error",
        description: err instanceof Error ? err.message : "Signup failed. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/me` },
      })
      if (error) throw error
    } catch (err) {
      toast({
        title: "Google Signup Failed",
        description: err instanceof Error ? err.message : "Google sign up failed",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-400/15 to-orange-400/15 rounded-full blur-3xl animate-float-slow" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent mb-2">
            MoneyMentor
          </h1>
          <p className="text-muted-foreground">Create your account</p>
        </div>

        <Card className="bg-card/80 backdrop-blur-sm shadow-xl border border-border">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Sign Up</CardTitle>
            <CardDescription className="text-center">
              Join thousands of users taking control of their finances
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              type="button"
              variant="outline"
              className="w-full bg-transparent"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant={signupMethod === "email" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setSignupMethod("email")}
              >
                Email
              </Button>
              <Button
                type="button"
                variant={signupMethod === "phone" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setSignupMethod("phone")}
              >
                Phone
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              {signupMethod === "email" ? (
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
                  <p className="text-xs text-muted-foreground">We'll send you a verification code</p>
                </div>
              )}

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="space-y-1 text-xs">
                  <div className={`flex items-center gap-2 ${passwordValidation.hasMinLength ? "text-green-600" : "text-muted-foreground"}`}>
                    {passwordValidation.hasMinLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    At least 8 characters
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasUppercase ? "text-green-600" : "text-muted-foreground"}`}>
                    {passwordValidation.hasUppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    One uppercase letter
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasNumber ? "text-green-600" : "text-muted-foreground"}`}>
                    {passwordValidation.hasNumber ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    One number
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !passwordValidation.isValid}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
