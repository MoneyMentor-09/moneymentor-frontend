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
import { Eye, EyeOff, Check, X, ArrowLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

// ---------------------------
// ✅ VERIFY EMAIL MODAL
// ---------------------------
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

function VerifyEmailModal({
  open,
  email,
  onClose,
}: {
  open: boolean
  email: string
  onClose: () => void
}) {
  const router = useRouter()

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            Verify Your Email 📩
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            We sent a verification link to:
            <br />
            <span className="font-medium">{email}</span>
          </p>

          <Button
            className="w-full"
            onClick={() => {
              onClose()
              router.push("/login")
            }}
          >
            Go to Login
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------
// SIGNUP PAGE
// ---------------------------

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [userEmail, setUserEmail] = useState("")

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
    return {
      hasMinLength,
      hasUppercase,
      hasNumber,
      isValid: hasMinLength && hasUppercase && hasNumber
    }
  }

  const passwordValidation = validatePassword(form.password)
  const passwordsMatch =
    form.password === form.confirmPassword &&
    form.password !== "" &&
    form.confirmPassword !== ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!passwordValidation.isValid || !passwordsMatch) {
      toast({
        title: "Invalid Password",
        description: !passwordsMatch
          ? "Passwords do not match."
          : "Password must be at least 8 characters, include one uppercase letter and one number.",
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
          toast({
            title: "Signup Error",
            description: signUpError.message,
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        toast({
          title: "Verification Required",
          description: "Check your phone for a verification code to complete signup.",
        })
        setIsLoading(false)
        return
      }

      // ---------------------------
      // EMAIL SIGNUP
      // ---------------------------
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.fullName, phone: form.phone || null }
        }
      })

      if (signUpError) {
        if (
          signUpError.message?.toLowerCase().includes("already registered") ||
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

      // ---------------------------
      // 🎉 SHOW MODAL HERE
      // ---------------------------
      setUserEmail(form.email)
      setShowVerifyModal(true)

    } catch (err) {
      toast({
        title: "Unexpected Error",
        description:
          err instanceof Error ? err.message : "Signup failed. Please try again later.",
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
    <>
      {/* MODAL */}
      <VerifyEmailModal
        open={showVerifyModal}
        email={userEmail}
        onClose={() => setShowVerifyModal(false)}
      />

      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
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

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-200 top-0 flex items-center gap-2"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

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
                    <p className="text-xs text-muted-foreground">
                      We'll send you a verification code
                    </p>
                  </div>
                )}

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
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div
                      className={`flex items-center gap-2 ${
                        passwordValidation.hasMinLength
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {passwordValidation.hasMinLength ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      At least 8 characters
                    </div>
                    <div
                      className={`flex items-center gap-2 ${
                        passwordValidation.hasUppercase
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {passwordValidation.hasUppercase ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      One uppercase letter
                    </div>
                    <div
                      className={`flex items-center gap-2 ${
                        passwordValidation.hasNumber
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {passwordValidation.hasNumber ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      One number
                    </div>
                    <div
                      className={`flex items-center gap-2 ${
                        passwordsMatch
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {passwordsMatch ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      Passwords match
                    </div>
                  </div>
                </div>

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
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isLoading ||
                    !passwordValidation.isValid ||
                    !passwordsMatch
                  }
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  Already have an account?{" "}
                </span>
                <Link
                  href="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
