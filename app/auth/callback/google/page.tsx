"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default function GoogleAuthCallback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return; // client-only

    const handleOAuth = async () => {
      const supabase = getSupabaseBrowserClient();

      try {
        const { data, error } = await supabase.auth.getSessionFromUrl({
          storeSession: true,
        });

        if (error) {
          console.error("Error getting session from URL:", error.message);
          router.replace("/login");
          return;
        }

        if (data?.session) {
          router.replace("/dashboard");
        } else {
          console.error("No session found after OAuth redirect");
          router.replace("/login");
        }
      } catch (err) {
        console.error("Unexpected error during OAuth callback:", err);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    handleOAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg font-medium">Signing you in with Google...</p>
      </div>
    );
  }

  return null;
}
