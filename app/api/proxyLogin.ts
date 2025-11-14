// pages/api/proxyLogin.ts
import type { NextApiRequest, NextApiResponse } from "next";
import fetch from "node-fetch";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email, password } = req.body;
  try {
    const response = await fetch("https://gabzswsmyehmunuufdum.supabase.co/auth/v1/token", {
      method: "POST",
      headers: {
        "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      // bypass SSL locally
      agent: new (require("https").Agent)({ rejectUnauthorized: false })
    });
    const data = await response.json();
    res.status(200).json(data);
  }catch (err: unknown) {
  if (err instanceof Error) {
    res.status(500).json({ error: err.message });
  } else {
    res.status(500).json({ error: "Unknown error" });
  }
}

}
