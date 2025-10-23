import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const PUBLIC_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

// POST /api/auth/forgot-password
export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "A valid email is required." },
        { status: 400 }
      )
    }

    // Create a Supabase admin client (Service Role) to check user existence
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const { data: user, error: userError } = await adminClient
      .from("auth.users")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (userError) {
      console.error("Error fetching user:", userError)
      return NextResponse.json(
        { error: "Database lookup failed." },
        { status: 500 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: "No account found with that email." },
        { status: 404 }
      )
    }

    // Use the public client to send the password reset email
    const publicClient = createClient(SUPABASE_URL, PUBLIC_ANON_KEY)

    const { error: resetError } = await publicClient.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${BASE_URL}/reset-password`,
      }
    )

    if (resetError) {
      console.error("Error sending reset email:", resetError)
      return NextResponse.json(
        { error: resetError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: "Password reset email sent successfully." },
      { status: 200 }
    )
  } catch (err: any) {
    console.error("Unexpected error in forgot-password API:", err)
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    )
  }
}
