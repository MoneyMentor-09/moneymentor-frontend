import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // ✅ Directly request password reset — Supabase will handle checking the user
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${BASE_URL}/reset-password`,
    })

    if (error) {
      console.error("Error sending reset email:", error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: "Password reset link sent successfully" }, { status: 200 })
  } catch (err) {
    console.error("Unexpected error in forgot-password route:", err)
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 })
  }
}
