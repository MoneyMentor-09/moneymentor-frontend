import { getSupabaseServerClient } from "@/lib/supabase/server";
import OpenAI from "openai";

export const maxDuration = 30;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body.message ?? body.messages?.[body.messages.length - 1]?.content ?? "";

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Invalid message format" }), { status: 400 });
    }

    const lowerMessage = message.toLowerCase();
    const supabase = await getSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const user = authData.user;

    // -----------------------------
    // Fetch Financial Summary
    // -----------------------------
    let data = body.financialSummary;

    if (!data) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);
      const startISO = startDate.toISOString().split("T")[0];

      const { data: txData } = await supabase
        .from("transactions")
        .select("amount, type, category, date")
        .eq("user_id", user.id)
        .gte("date", startISO);

      const transactions = txData ?? [];

      const income = transactions
        .filter((t: { type: string; }) => t.type === "income")
        .reduce((s: number, t: { amount: any; }) => s + Number(t.amount), 0);

      const expenses = transactions
        .filter((t: { type: string; }) => t.type === "expense")
        .reduce((s: number, t: { amount: any; }) => s + Math.abs(Number(t.amount)), 0);

      const balance = income - expenses;
      const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;

      // --- Top Categories (keep negative amounts) ---
      const categoryTotals: Record<string, number> = {};
      for (const tx of transactions) {
        if (tx.type === "expense") {
          const cat = tx.category || "Other";
          categoryTotals[cat] = (categoryTotals[cat] ?? 0) + Number(tx.amount);
        }
      }

      const topCategories = Object.entries(categoryTotals)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)) // largest spending first
        .slice(0, 5);

      // --- Budgets ---
      const { data: budgetData } = await supabase
        .from("budgets")
        .select("category, amount, spent")
        .eq("user_id", user.id);

      const budgets = budgetData ?? [];
      const budgetStatus = budgets.map((b: { category: any; spent: any; amount: any; }) => ({
        category: b.category,
        spent: Number(b.spent ?? 0),
        limit: Number(b.amount ?? 0),
      }));

      // --- Alerts ---
      const { data: alertData } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", user.id)
        .order("timestamp", { ascending: false })
        .limit(5);

      const alerts = alertData ?? [];

      data = {
        totalIncome: income,
        totalExpenses: expenses,
        totalBalance: balance,
        savingsRate,
        topCategories,
        budgetStatus,
        alerts,
        transactions,
      };
    }

    // -----------------------------
    // Local Fallback Logic
    // -----------------------------
    const localFallback = () => {
      // Ensure savingsRate and totalBalance exist
      const savingsRate = typeof data.savingsRate === "number" ? data.savingsRate : 0;
      const totalBalance = typeof data.totalBalance === "number" ? data.totalBalance : 0;

      // Biggest / largest / most spending
      if (lowerMessage.includes("biggest") || lowerMessage.includes("largest") || lowerMessage.includes("most spending") || lowerMessage.includes("highest")) {
        if (data.topCategories.length > 0) {
          const top = data.topCategories[4]; // already sorted by largest abs(amount)
          return `Your biggest expense category in the last 90 days is ${top.category} at $${top.amount.toLocaleString()}.`;
        }
        return "I don't have enough data to determine your biggest expense yet.";
      }

      // Smallest / least / lowest / less spending
      if (lowerMessage.includes("smallest") || lowerMessage.includes("least") || lowerMessage.includes("lowest") || lowerMessage.includes("less spending")) {
        if (data.topCategories.length > 0) {
          const min = data.topCategories.reduce((prev: any, curr: any) => {
            return Math.abs(curr.amount) < Math.abs(prev.amount) ? curr : prev;
          }, data.topCategories[0]);
          return `Your smallest expense category in the last 90 days is ${min.category} at $${min.amount.toLocaleString()}.`;
        }
        return "I don't have enough data to determine your smallest expense yet.";
      }


      // Spent on and Spend on logic 

        if (lowerMessage.includes("spent on") || lowerMessage.includes("spend on")) {
  if (!data?.transactions || data.transactions.length === 0) {
    return "No transaction data available to check spending.";
  }

  // Extract category text from the message
  const match = lowerMessage.match(/(?:spent|spend) on (.+)/i);
  if (!match || !match[1]) return "Please specify a category to check spending.";

  let inputCategory = match[1].trim().toLowerCase();

  // Map common synonyms to actual categories
  const categoryMap: Record<string, string> = {
    "groceries": "Food & Dining",
    "food": "Food & Dining",
    "dining": "Food & Dining",
    "entertainment": "Entertainment",
    "transportation": "Transportation",
    "rent": "Housing",
    "housing": "Housing",
    "internet": "Bills & Utilities",
    "bills": "Bills & Utilities",
    "health": "Health & Fitness",
    "gym": "Health & Fitness"
  };

  if (categoryMap[inputCategory]) {
    inputCategory = categoryMap[inputCategory];
  }

  // Normalize for comparison (lowercase, remove special characters)
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/gi, "");

  const filtered = data.transactions.filter((t: { type: string; category: string; }) =>
    t.type === "expense" &&
    t.category &&
    normalize(t.category) === normalize(inputCategory)
  );

  if (filtered.length === 0) {
    return `No spending found for ${match[1].trim()}.`;
  }

  const totalSpent = filtered.reduce((sum: number, t: { amount: any; }) => sum + Math.abs(Number(t.amount)), 0);

  return `You have spent a total of $${totalSpent.toLocaleString()} on ${match[1].trim()}.`;
}


      // Overbudget
      if (lowerMessage.includes("overspending") || lowerMessage.includes("over budget")) {
        const over = data.budgetStatus.filter((b: any) => b.spent > b.limit);
        return over.length > 0
          ? `You're over budget in ${over.length} categories: ${over.map((b: any) => b.category).join(", ")}. Consider adjusting your spending.`
          : "You are within all budget limits this month — great job!";
      }

      // Spending patterns
      if (lowerMessage.includes("pattern") || lowerMessage.includes("spending pattern")) {
        if (data.topCategories.length === 0) return "Add more transactions to analyze your spending pattern.";
        return "Your top spending categories in the last 90 days are: " +
          data.topCategories.slice(0, 5).map((c: any) => `${c.category} ($${c.amount.toLocaleString()})`).join(", ") + ".";
      }

      // Budget / savings
      if (lowerMessage.includes("budget") || lowerMessage.includes("spending")) {
        return `You're saving ${savingsRate}% this month. ${
          savingsRate < 20 ? "You're spending a bit high — consider reducing discretionary expenses." : "Great job staying on track!"
        }`;
      }
      if (lowerMessage.includes("save") || lowerMessage.includes("saving")) {
        return `You're saving $${Math.abs(totalBalance)} this month (${savingsRate}%). Try automating transfers or applying the 50/30/20 rule to increase savings.`;
      }

      // Greetings
      if (lowerMessage.includes("hi") || lowerMessage.includes("hello") || lowerMessage.includes("hey")) {
        return `Hello! 👋 You're currently at a balance of $${totalBalance.toLocaleString()} with a savings rate of ${savingsRate}%. How can I help you today?`;
      }

      // Default fallback
      return `I'm here to help you understand your spending, budgeting, and savings. You're currently saving $${Math.abs(totalBalance)} this month (${savingsRate}%). What would you like to know?`;
    };

    // ---------------------------------------
    // OpenAI Fallback
    // ---------------------------------------
    let response = "";
    try {
      const openaiResp = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful AI financial assistant. Answer questions using the user's financial data." },
          { role: "user", content: JSON.stringify({ message, financialSummary: data }) }
        ],
        max_tokens: 300
      });
      response = openaiResp.choices[0].message?.content ?? localFallback();
    } catch (err: any) {
      console.warn("OpenAI failed, using local fallback:", err.message);
      response = localFallback();
    }

    return new Response(JSON.stringify({ response }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: "Failed to process chat request" }), { status: 500 });
  }
}
