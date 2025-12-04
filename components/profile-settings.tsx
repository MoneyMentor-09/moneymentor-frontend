"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Save, Shield, Trash2 } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
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
import { useAccessibility, type ColorScheme } from "@/contexts/accessibility-context"

// 🎨 Emoji-based color scheme presets
const colorSchemes: Array<{
  id: ColorScheme
  name: string
  description: string
  icon: string
}> = [
  {
    id: "default",
    name: "Default",
    description: "Standard color palette",
    icon: "🎨",
  },
  {
    id: "protanopia",
    name: "Protanopia",
    description: "Red-blind friendly scheme",
    icon: "🔴",
  },
  {
    id: "deuteranopia",
    name: "Deuteranopia",
    description: "Green-blind friendly scheme",
    icon: "🟢",
  },
  {
    id: "tritanopia",
    name: "Tritanopia",
    description: "Blue-blind friendly scheme",
    icon: "🔵",
  },
  {
    id: "monochrome",
    name: "Monochrome",
    description: "Grayscale, no color reliance",
    icon: "⚫",
  },
  {
    id: "high-contrast",
    name: "High Contrast",
    description: "Extra-strong contrast for low vision",
    icon: "⚡",
  },
]

interface ProfileSettingsProps {
  user: any
  profile: any
  stats: {
    monthlySavings: number
    budgetCount: number
    daysActive: number
  }
}

export function ProfileSettings({ user, profile, stats }: ProfileSettingsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const [firstName, setFirstName] = useState(profile?.first_name || "")
  const [lastName, setLastName] = useState(profile?.last_name || "")
  const [phone, setPhone] = useState(profile?.phone || "")
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "")

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(profile?.two_factor_enabled || false)
  const [sessionTimeout, setSessionTimeout] = useState(profile?.session_timeout || "30")

  // 🌈 Accessibility + theme state (from context)
  const { colorScheme, setColorScheme, isDarkMode, toggleDarkMode } = useAccessibility()

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please upload an image file" })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image must be less than 2MB" })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const supabase = getSupabaseBrowserClient()

      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
        upsert: true,
      })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath)

      setAvatarUrl(publicUrl)
      setMessage({ type: "success", text: "Avatar uploaded successfully!" })
    } catch (error) {
      console.error("Avatar upload error:", error)
      setMessage({ type: "error", text: "Failed to upload avatar" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const supabase = getSupabaseBrowserClient()

      if (!profile) {
        const { error: insertError } = await supabase.from("profiles").insert({
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          phone,
          avatar_url: avatarUrl,
          full_name: `${firstName} ${lastName}`.trim(),
          email: user.email,
        })

        if (insertError) throw insertError
      } else {
        const { error } = await supabase
          .from("profiles")
          .update({
            first_name: firstName,
            last_name: lastName,
            phone,
            avatar_url: avatarUrl,
            full_name: `${firstName} ${lastName}`.trim(),
          })
          .eq("id", user.id)

        if (error) throw error
      }

      setMessage({ type: "success", text: "Profile updated successfully!" })
      router.refresh()
    } catch (error) {
      console.error("Profile update error:", error)
      setMessage({ type: "error", text: "Failed to update profile" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSecuritySettings = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase
        .from("profiles")
        .update({
          two_factor_enabled: twoFactorEnabled,
          session_timeout: sessionTimeout,
        })
        .eq("id", user.id)

      if (error) throw error

      setMessage({ type: "success", text: "Security settings updated successfully!" })
      router.refresh()
    } catch (error) {
      console.error("Security settings update error:", error)
      setMessage({ type: "error", text: "Failed to update security settings" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setMessage({ type: "error", text: 'Please type "DELETE" to confirm' })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const supabase = getSupabaseBrowserClient()

      const { error: deleteError } = await supabase.from("profiles").delete().eq("id", user.id)

      if (deleteError) throw deleteError

      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Account deletion error:", error)
      setMessage({ type: "error", text: "Failed to delete account" })
      setIsLoading(false)
    }
  }

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || user.email?.charAt(0).toUpperCase()

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary mb-1">${Math.abs(stats.monthlySavings).toFixed(0)}</p>
              <p className="text-sm text-muted-foreground">
                Monthly {stats.monthlySavings >= 0 ? "Savings" : "Spending"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-chart-1 mb-1">{stats.budgetCount || 0}</p>
              <p className="text-sm text-muted-foreground">Active Budgets</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-chart-3 mb-1">{stats.daysActive}</p>
              <p className="text-sm text-muted-foreground">Days Active</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile info */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal information and avatar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={`${firstName} ${lastName}`} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                  <Upload className="h-4 w-4" />
                  <span>Upload Avatar</span>
                </div>
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-2">JPG, PNG or GIF (max 2MB)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              disabled={isLoading}
            />
          </div>

          <Button onClick={handleSaveProfile} disabled={isLoading} className="w-full md:w-auto">
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Saving..." : "Save Profile"}
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>Manage your account security and session preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="2fa">Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
            </div>
            <Switch id="2fa" checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} disabled={isLoading} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Session Timeout</Label>
            <Select value={sessionTimeout} onValueChange={setSessionTimeout} disabled={isLoading}>
              <SelectTrigger id="sessionTimeout">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="240">4 hours</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Automatically log out after this period of inactivity</p>
          </div>

          <Button onClick={handleSaveSecuritySettings} disabled={isLoading} className="w-full md:w-auto">
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Saving..." : "Save Security Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* 🌈 Accessibility & Theme (NEW) */}
      <Card>
        <CardHeader>
          <CardTitle>Accessibility & Theme</CardTitle>
          <CardDescription>
            Adjust dark mode and WCAG-aligned color schemes to better match your vision needs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dark mode toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode-toggle">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark backgrounds for better comfort.
              </p>
            </div>
            <Switch
              id="dark-mode-toggle"
              checked={isDarkMode}
              onCheckedChange={toggleDarkMode}
            />
          </div>

          {/* Color schemes */}
          <div className="space-y-3">
            <div>
              <Label>Color scheme</Label>
              <p className="text-xs text-muted-foreground">
                These presets are designed to support different types of color vision while keeping contrast at or
                above WCAG AA.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {colorSchemes.map((scheme) => (
                <button
                  key={scheme.id}
                  type="button"
                  onClick={() => setColorScheme(scheme.id)}
                  className={`flex items-start gap-3 rounded-md border px-3 py-2 text-left text-sm transition ${
                    colorScheme === scheme.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/60"
                  }`}
                  aria-pressed={colorScheme === scheme.id}
                >
                  <span className="text-xl" aria-hidden="true">
                    {scheme.icon}
                  </span>
                  <span>
                    <span className="font-medium block">{scheme.name}</span>
                    <span className="text-xs text-muted-foreground">{scheme.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions that affect your account</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full md:w-auto">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p>
                    This action cannot be undone. This will permanently delete your account and remove all your data
                    from our servers including:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>All transactions and financial records</li>
                    <li>Budget settings and goals</li>
                    <li>Alerts and notifications</li>
                    <li>Profile information and preferences</li>
                  </ul>
                  <div className="pt-4">
                    <Label htmlFor="delete-confirm" className="text-foreground">
                      Type <span className="font-bold">DELETE</span> to confirm:
                    </Label>
                    <Input
                      id="delete-confirm"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="mt-2"
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "DELETE" || isLoading}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isLoading ? "Deleting..." : "Delete Account"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <p className="text-sm text-muted-foreground mt-2">
            Once you delete your account, there is no going back. Please be certain.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

