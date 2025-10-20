import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const PUBLIC_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = body?.email

    if (!email || typeof email !== "string") {
      console.error("Invalid or missing email:", email)
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Query auth.users table for this email
    const { data: user, error: userError } = await adminClient
      .from("auth.users")
      .select("id")
      .eq("email", email)
      .limit(1)
      .single()

    if (userError) {
      console.error("Error querying user:", userError)
      // If no rows found, userError.code will be 'PGRST116' (or similar)
      if (userError.code === "PGRST116") {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!user) {
      // Defensive fallback in case .single() returns null
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Public client for sending reset email
    const publicClient = createClient(SUPABASE_URL, PUBLIC_ANON_KEY)
    const { error: resetError } = await publicClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${BASE_URL}/reset-password`,
    })

    if (resetError) {
      console.error("Error sending reset email:", resetError)
      return NextResponse.json({ error: resetError.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Reset link sent successfully" }, { status: 200 })
  } catch (err: any) {
    console.error("Unexpected error in forgot-password route:", err)
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 })
  }
}
