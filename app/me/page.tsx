"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Edit, 
  Key, 
  Trash2, 
  Shield,
  LogOut,
  Save,
  Eye,
  EyeOff
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Profile {
  id: string
  full_name: string
  email: string
  phone?: string
  created_at: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: ""
  })
  
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: ""
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return
      setUser(user)

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (error && error.code !== "PGRST116") throw error

      const fallbackName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User"

      setProfile(
        profileData || {
          id: user.id,
          full_name: fallbackName,
          email: user.email || "",
          phone: user.phone || "",
          created_at: user.created_at
        }
      )

      setEditForm({
        full_name: profileData?.full_name || fallbackName,
        phone: profileData?.phone || ""
      })
    } catch (error) {
      toast.error("Failed to fetch profile")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const supabase = getSupabaseBrowserClient()
      
      await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: editForm.full_name,
          phone: editForm.phone || null,
          email: user.email
        })

      await supabase.auth.updateUser({
        data: {
          full_name: editForm.full_name,
          phone: editForm.phone
        }
      })

      toast.success("Profile updated successfully")
      setIsEditDialogOpen(false)
      fetchProfile()
    } catch (error) {
      toast.error("Failed to update profile")
      console.error(error)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    try {
      const supabase = getSupabaseBrowserClient()
      await supabase.auth.updateUser({ password: passwordForm.newPassword })

      toast.success("Password updated successfully")
      setIsPasswordDialogOpen(false)
      setPasswordForm({ newPassword: "", confirmPassword: "" })
    } catch (error) {
      toast.error("Failed to update password")
      console.error(error)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      const supabase = getSupabaseBrowserClient()

      await supabase.from("profiles").delete().eq("id", user.id)
      await supabase.from("transactions").delete().eq("user_id", user.id)
      await supabase.from("budgets").delete().eq("user_id", user.id)
      await supabase.from("alerts").delete().eq("user_id", user.id)

      const { error } = await supabase.auth.admin.deleteUser(user.id)
      if (error) throw error

      toast.success("Account deleted")
      router.push("/login")
    } catch (error) {
      toast.error("Failed to delete account")
      console.error(error)
    }
  }

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      await supabase.auth.signOut()
      toast.success("Logged out")
      router.push("/login")
    } catch (error) {
      toast.error("Failed to logout")
      console.error(error)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Profile</h1>
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
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
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="text-muted-foreground">Manage your account settings</p>
          </div>
        </div>

        {/* PERSONAL INFO */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">

            {/* Info grid responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              <InfoRow label="Full Name" icon={<User className="h-4 w-4" />} value={profile?.full_name} />
              <InfoRow label="Email" icon={<Mail className="h-4 w-4" />} value={profile?.email} />
              <InfoRow label="Phone" icon={<Phone className="h-4 w-4" />} value={profile?.phone || "Not set"} />
              <InfoRow 
                label="Member Since"
                icon={<Calendar className="h-4 w-4" />} 
                value={
                  profile?.created_at 
                    ? new Date(profile.created_at).toLocaleDateString()
                    : "Unknown"
                }
              />

            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(true)} className="w-full sm:w-auto">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>

              <Button variant="outline" onClick={() => setIsPasswordDialogOpen(true)} className="w-full sm:w-auto">
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ACCOUNT ACTIONS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Actions
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            {/* Sign Out */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Sign Out</h3>
                <p className="text-sm text-muted-foreground">Logout from your account</p>
              </div>
              <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>

            {/* Delete Account */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-destructive/40 rounded-lg bg-destructive/5">
              <div>
                <h3 className="font-medium text-destructive">Delete Account</h3>
                <p className="text-sm text-muted-foreground">Permanently delete everything</p>
              </div>

              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full sm:w-auto">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>

                <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Account</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. All your data will be deleted permanently.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount}>
                      Yes, Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

          </CardContent>
        </Card>

        {/* TECH INFO */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Technical details</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <TechRow label="User ID" value={user?.id} mono />
              <TechRow label="Last Sign In" value={user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "Unknown"} />
              <TechRow label="Email Confirmed" value={user?.email_confirmed_at ? "Yes" : "No"} />
              <TechRow label="Created At" value={new Date(user?.created_at).toLocaleString()} />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* EDIT PROFILE DIALOG */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <InputRow
              label="Full Name"
              id="full_name"
              value={editForm.full_name}
              onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
            />

            <InputRow
              label="Phone"
              id="phone"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              placeholder="+1234567890"
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PASSWORD DIALOG */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleChangePassword} className="space-y-4">

            {/* New Password */}
            <PasswordInput
              label="New Password"
              id="newPassword"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              show={showNewPassword}
              toggle={() => setShowNewPassword(!showNewPassword)}
            />

            {/* Confirm Password */}
            <PasswordInput
              label="Confirm Password"
              id="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              show={showConfirmPassword}
              toggle={() => setShowConfirmPassword(!showConfirmPassword)}
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Change Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  )
}

/* --- SMALL RESPONSIVE COMPONENT HELPERS --- */

function InfoRow({ label, icon, value }: { label: string, icon: any, value: any }) {
  return (
    <div className="space-y-1">
      <Label className="text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2 break-words text-sm">
        {icon}
        {value}
      </div>
    </div>
  )
}

function TechRow({ label, value, mono = false }: { label: string; value: any; mono?: boolean }) {
  return (
    <div>
      <Label className="text-muted-foreground">{label}</Label>
      <p className={`text-sm break-all ${mono ? "font-mono text-xs" : ""}`}>
        {value || "Unknown"}
      </p>
    </div>
  )
}

function InputRow(props: any) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      <Input {...props} />
    </div>
  )
}

function PasswordInput({ label, id, value, onChange, show, toggle }: any) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          required
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          onClick={toggle}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
