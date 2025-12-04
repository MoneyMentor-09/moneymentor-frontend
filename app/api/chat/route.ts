// app/api/chat/route.ts
import { getSupabaseServerClient } from "@/lib/supabase/server";
import OpenAI from "openai";

export const maxDuration = 30;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Format number as USD currency
function fmtUSD(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(n || 0));
}

// Parse amount strings like "$1,234.56" or numbers
function parseAmount(amount: string | number) {
  if (typeof amount === "number") return amount;
  const cleaned = amount.replace(/[^0-9.-]+/g, "");
  return Number(cleaned) || 0;
}

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
    // Fetch Financial Summary (90-day)
    // -----------------------------
    let data = body.financialSummary;
    if (!data) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);
      const startISO = startDate.toISOString().split("T")[0];

      const { data: txData } = await supabase
        .from("transactions")
        .select("amount, type, category, date, description")
        .eq("user_id", user.id)
        .gte("date", startISO);

      const transactions = txData ?? [];

      const income = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + parseAmount(t.amount), 0);

      const expenses = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + Math.abs(parseAmount(t.amount)), 0);

      const balance = income + (expenses);

      // Correct savings rate
      const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;

      // Top expense categories
      const categoryTotals: Record<string, number> = {};
      for (const tx of transactions) {
        if (tx.type === "expense") {
          const cat = tx.category || "Other";
          categoryTotals[cat] = (categoryTotals[cat] ?? 0) + parseAmount(tx.amount);
        }
      }

      const topCategories = Object.entries(categoryTotals)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
        .slice(0, 10);

      // Budgets
      const { data: budgetData } = await supabase
        .from("budgets")
        .select("category, amount, spent")
        .eq("user_id", user.id);

      const budgets = budgetData ?? [];
      const budgetStatus = budgets.map(b => ({
        category: b.category,
        spent: Number(b.spent ?? 0),
        limit: Number(b.amount ?? 0),
      }));

      // Alerts
      const { data: alertData } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", user.id)
        .order("timestamp", { ascending: false })
        .limit(10);

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
    // Local fallback logic
    // -----------------------------
    const localFallback = () => {
      const savingsRateValue = Number(data.savingsRate) || 67;
      const totalBalance = Number(data.totalBalance);
      const transactions: any[] = Array.isArray(data.transactions) ? data.transactions : [];

      const normalize = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/gi, "");
      const categoryMap: Record<string, string> = {
        groceries: "Food & Dining",
        grocery: "Food & Dining",
        food: "Food & Dining",
        dining: "Food & Dining",
        entertainment: "Entertainment",
        transport: "Transportation",
        transportation: "Transportation",
        gas: "Transportation",
        rent: "Housing",
        housing: "Housing",
        internet: "Bills & Utilities",
        bills: "Bills & Utilities",
        utilities: "Bills & Utilities",
        health: "Health & Fitness",
        gym: "Health & Fitness",
      };

      // Biggest expense
      if (/biggest|largest|most spending|highest/.test(lowerMessage)) {
        const top = data.topCategories?.[4];
        if (top) return `Your biggest expense category in the last 90 days is ${top.category} at ${fmtUSD(top.amount)}.`;
        return "I don't have enough data to determine your biggest expense yet.";
      }

      // Smallest expense
      if (/smallest|least|lowest|less spending/.test(lowerMessage)) {
        const min = data.topCategories?.reduce((prev: any, curr: any) =>
          Math.abs(curr.amount) < Math.abs(prev.amount) ? curr : prev
        , data.topCategories[0]);
        if (min) return `Your smallest expense category in the last 90 days is ${min.category} at ${fmtUSD(min.amount)}.`;
        return "I don't have enough data to determine your smallest expense yet.";
      }

      // Spent on category
      if (/spent on|spend on/.test(lowerMessage)) {
        const match = lowerMessage.match(/(?:spent|spend) on (.+)/i);
        if (!match || !match[1]) return "Please specify a category to check spending.";

        let requested = match[1].replace(/\b(last week|last month|recently|this month|this week)\b/gi, "").replace(/[?.,!]/g, "").trim();
        if (!requested) return "Please specify a category.";

        const mapped = categoryMap[requested.toLowerCase()] ?? requested;
        const normRequested = normalize(mapped);

        const filtered = transactions.filter(t => t.type === "expense" && t.category && normalize(t.category) === normRequested);
        if (!filtered.length) return `No spending found for ${requested}.`;

        const totalSpent = filtered.reduce((sum, t) => sum + Math.abs(parseAmount(t.amount)), 0);
        return `You have spent a total of ${fmtUSD(totalSpent)} on ${requested}.`;
      }

      // Overbudget
      if (/overspending|over budget|overbudget/.test(lowerMessage)) {
        const over = data.budgetStatus?.filter((b: { spent: any; limit: any; }) => Number(b.spent) > Number(b.limit)) ?? [];
        return over.length
          ? `You're over budget in ${over.length} categories: ${over.map((b: { category: any; }) => b.category).join(", ")}. Consider adjusting your spending.`
          : "You are within all budget limits this month — great job!";
      }

      // Spending patterns
      if (/pattern|spending pattern|spending patterns/.test(lowerMessage)) {
        if (!data.topCategories?.length) return "Add more transactions to analyze your spending pattern.";
        return "Your top spending categories in the last 90 days are: " +
          data.topCategories.slice(0, 5).map((c: { category: any; amount: number; }) => `${c.category} (${fmtUSD(c.amount)})`).join(", ") + ".";
      }

      // Budget / savings status
      if (/budget|spending/.test(lowerMessage)) {
        return `You're saving ${savingsRateValue}% this period. ${savingsRateValue < 20 ? "You're spending a bit high — consider reducing discretionary expenses." : "Great job staying on track!"}`;
      }

      if (/save|saving/.test(lowerMessage)) {
        return `You're saving ${fmtUSD(totalBalance)} this period (${savingsRateValue}%). Try automating transfers or applying the 50/30/20 rule to increase savings.`;
      }

      // Greetings
      if (/hi|hello|hey/.test(lowerMessage)) {
        return `Hello! 👋 You're currently at a balance of ${fmtUSD(totalBalance)} with a savings rate of ${savingsRateValue}%. How can I help you today?`;
      }

      // Default fallback
      return `I'm here to help you understand your spending, budgeting, and savings. You're currently saving ${fmtUSD(totalBalance)} this period (${savingsRateValue}%). What would you like to know?`;
    };

    // ---------------------------------------
    // OpenAI fallback
    // ---------------------------------------
    let response = "";
    try {
      const openaiResp = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are MoneyMentor — short, factual financial assistant. Use only the provided financial_summary JSON." },
          { role: "user", content: JSON.stringify({ message, financialSummary: data }) }
        ],
        max_tokens: 300
      });
      response = openaiResp.choices?.[0]?.message?.content?.trim() ?? localFallback();
    } catch (err: any) {
      console.warn("OpenAI failed, using local fallback:", err?.message ?? err);
      response = localFallback();
    }

    return new Response(JSON.stringify({ response }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: "Failed to process chat request" }), { status: 500 });
  }
}
