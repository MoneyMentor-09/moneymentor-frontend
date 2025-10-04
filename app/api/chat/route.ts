import { getSupabaseServerClient } from "@/lib/supabase/server"

export const maxDuration = 30

export async function POST(req: Request) {
  console.log("[v0] Chat API route called")

  try {
    const { messages }: { messages: Array<{ role: string; content: string }> } = await req.json()
    console.log("[v0] Received messages:", messages.length)

    const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || ""

    const supabase = await getSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Fetch real financial data
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]

    const { data: transactions } = await supabase
      .from("transactions")
      .select("amount, type, category")
      .eq("user_id", user.id)
      .gte("date", startOfMonth)

    const income = transactions?.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0) || 0
    const expenses =
      transactions?.filter((t) => t.type === "expense").reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0
    const balance = income - expenses
    const savings = balance
    const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0

    const financialContext = {
      balance: Math.round(balance),
      income: Math.round(income),
      expenses: Math.round(expenses),
      savings: Math.round(savings),
      savingsRate,
    }

    // Generate contextual response based on keywords
    let response = ""

    if (lastMessage.includes("budget") || lastMessage.includes("spending")) {
      response = `Based on your current spending patterns, you're ${savingsRate > 20 ? "doing well" : "spending quite a bit"}! You're saving ${savingsRate}% of your income ($${financialContext.savings}/month). ${savingsRate < 20 ? "Consider reviewing your expenses to increase your savings rate." : "Keep up the good work!"}`
    } else if (lastMessage.includes("save") || lastMessage.includes("saving")) {
      response = `Great question! You're currently saving $${financialContext.savings} per month (${financialContext.savingsRate}% of income). To boost this, try the 50/30/20 rule: 50% needs, 30% wants, 20% savings. ${financialContext.savingsRate < 20 ? "You could potentially save more by reducing discretionary expenses." : "You're already on a great savings track!"}`
    } else if (lastMessage.includes("transaction") || lastMessage.includes("spent")) {
      const categorySpending: Record<string, number> = {}
      transactions?.forEach((t) => {
        if (t.type === "expense") {
          categorySpending[t.category] = (categorySpending[t.category] || 0) + Math.abs(Number(t.amount))
        }
      })
      const topCategory = Object.entries(categorySpending).sort((a, b) => b[1] - a[1])[0]
      response = topCategory
        ? `Looking at your recent transactions, your largest expense category is ${topCategory[0]} at $${topCategory[1].toFixed(0)}. Consider reviewing this category for potential savings opportunities.`
        : `You don't have many transactions yet. Upload a bank statement to get personalized insights!`
    } else if (lastMessage.includes("goal") || lastMessage.includes("plan")) {
      response = `With your current savings rate of $${financialContext.savings}/month, you could build a $10,000 emergency fund in about ${Math.ceil(10000 / Math.max(financialContext.savings, 1))} months. I recommend setting up automatic transfers to a high-yield savings account. Would you like help creating a specific savings goal?`
    } else if (lastMessage.includes("hello") || lastMessage.includes("hi") || lastMessage.includes("hey")) {
      response = `Hello! I'm your MoneyMentor AI assistant. I can help you understand your spending, manage budgets, and reach your financial goals. Your current balance is $${financialContext.balance.toLocaleString()} with a savings rate of ${financialContext.savingsRate}%. What would you like to know?`
    } else {
      response = `I'm here to help with your finances! You currently have a balance of $${financialContext.balance.toLocaleString()} and are saving $${financialContext.savings}/month. I can provide insights on your budget, spending patterns, savings strategies, or help you set financial goals. What would you like to explore?`
    }

    // Simulate streaming by breaking response into chunks
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial message start
        controller.enqueue(encoder.encode(`0:{"type":"message_start","role":"assistant"}\n`))

        // Stream the response in chunks
        const words = response.split(" ")
        for (let i = 0; i < words.length; i++) {
          const chunk = words[i] + (i < words.length - 1 ? " " : "")
          controller.enqueue(encoder.encode(`0:{"type":"text_delta","text":"${chunk}"}\n`))
          // Small delay to simulate streaming
          await new Promise((resolve) => setTimeout(resolve, 30))
        }

        // Send message end
        controller.enqueue(encoder.encode(`0:{"type":"message_end"}\n`))
        controller.close()
      },
    })

    console.log("[v0] Returning stream response with real data")
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("[v0] Chat API error:", error)
    return new Response(JSON.stringify({ error: "Failed to process chat request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
