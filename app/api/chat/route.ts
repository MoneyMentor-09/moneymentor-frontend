import { getSupabaseServerClient } from "@/lib/supabase/server"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { message, financialSummary } = await req.json()
    
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

    // Use financial summary if provided, otherwise fetch data
    let data = financialSummary
    if (!data) {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount, type, category")
        .eq("user_id", user.id)
        .gte("date", startOfMonth)

      const income = transactions?.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0) || 0
      const expenses = transactions?.filter((t) => t.type === "expense").reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0
      const balance = income - expenses
      const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0

      data = {
        totalIncome: income,
        totalExpenses: expenses,
        totalBalance: balance,
        savingsRate,
        topCategories: [],
        recentTransactions: [],
        budgetStatus: [],
        alerts: []
      }
    }

    // Generate contextual response based on keywords
    const lowerMessage = message.toLowerCase()
    let response = ""

    if (lowerMessage.includes("budget") || lowerMessage.includes("spending")) {
      const savingsRate = data.totalIncome > 0 ? Math.round((data.totalBalance / data.totalIncome) * 100) : 0
      response = `Based on your current spending patterns, you're ${savingsRate > 20 ? "doing well" : "spending quite a bit"}! You're saving ${savingsRate}% of your income ($${Math.abs(data.totalBalance)}/month). ${savingsRate < 20 ? "Consider reviewing your expenses to increase your savings rate." : "Keep up the good work!"}`
    } else if (lowerMessage.includes("save") || lowerMessage.includes("saving")) {
      const savingsRate = data.totalIncome > 0 ? Math.round((data.totalBalance / data.totalIncome) * 100) : 0
      response = `Great question! You're currently saving $${Math.abs(data.totalBalance)} per month (${savingsRate}% of income). To boost this, try the 50/30/20 rule: 50% needs, 30% wants, 20% savings. ${savingsRate < 20 ? "You could potentially save more by reducing discretionary expenses." : "You're already on a great savings track!"}`
    } else if (lowerMessage.includes("biggest") || lowerMessage.includes("largest") || lowerMessage.includes("expense")) {
      if (data.topCategories && data.topCategories.length > 0) {
        const topCategory = data.topCategories[0]
        response = `Your largest expense category is ${topCategory.category} at $${topCategory.amount.toLocaleString()}. Consider reviewing this category for potential savings opportunities.`
      } else {
        response = `I don't have enough transaction data to identify your biggest expense. Try uploading more transactions or adding them manually.`
      }
    } else if (lowerMessage.includes("groceries") || lowerMessage.includes("grocery")) {
      const grocerySpending = data.topCategories?.find((c: { category: string }) => c.category.toLowerCase().includes('grocery'))?.amount || 0
      if (grocerySpending > 0) {
        response = `You've spent $${grocerySpending.toLocaleString()} on groceries this month. That's ${data.totalIncome > 0 ? Math.round((grocerySpending / data.totalIncome) * 100) : 0}% of your income. Consider meal planning and buying in bulk to reduce grocery costs.`
      } else {
        response = `I don't see any grocery transactions in your data. Make sure to categorize your grocery purchases properly.`
      }
    } else if (lowerMessage.includes("security") || lowerMessage.includes("fraud") || lowerMessage.includes("risk")) {
      const highRiskAlerts = data.alerts?.filter((a: { risk_score: number }) => a.risk_score > 70).length || 0
      if (highRiskAlerts > 0) {
        response = `You have ${highRiskAlerts} high-risk alerts. Your security score is low due to unusual spending patterns. Review your recent transactions and consider setting up spending alerts.`
      } else {
        response = `Your security score looks good! I don't see any high-risk transactions. Keep monitoring your accounts regularly.`
      }
    } else if (lowerMessage.includes("overspending") || lowerMessage.includes("over budget")) {
      const overBudgetCategories = data.budgetStatus?.filter((b: { spent: number; limit: number }) => b.spent > b.limit).length || 0
      if (overBudgetCategories > 0) {
        response = `You're over budget in ${overBudgetCategories} categories. Consider adjusting your spending or increasing your budget limits for those categories.`
      } else {
        response = `Great job! You're staying within your budget limits. Keep up the good work!`
      }
    } else if (lowerMessage.includes("track") || lowerMessage.includes("budget")) {
      const budgetProgress = data.budgetStatus?.map((b: { category: any; spent: number; limit: number }) => ({
        category: b.category,
        percentage: Math.round((b.spent / b.limit) * 100)
      })) || []
      
      if (budgetProgress.length > 0) {
        const avgProgress = Math.round(budgetProgress.reduce((sum: any, b: { percentage: any }) => sum + b.percentage, 0) / budgetProgress.length)
        response = `You're ${avgProgress}% through your budgets on average. ${avgProgress > 80 ? "You're approaching your limits - consider reducing spending." : "You're doing well with your budget management."}`
      } else {
        response = `You don't have any budgets set up yet. Create budgets to track your spending and stay on target.`
      }
    } else if (lowerMessage.includes("pattern") || lowerMessage.includes("spending pattern")) {
      if (data.topCategories && data.topCategories.length > 0) {
        const top3 = data.topCategories.slice(0, 3)
        response = `Your top spending categories are: ${top3.map((c: { category: any; amount: { toLocaleString: () => any } }) => `${c.category} ($${c.amount.toLocaleString()})`).join(', ')}. This shows where most of your money goes each month.`
      } else {
        response = `I need more transaction data to analyze your spending patterns. Add more transactions to get better insights.`
      }
    } else if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
      response = `Hello! I'm your MoneyMentor AI assistant. I can help you understand your spending, manage budgets, and reach your financial goals. Your current balance is $${data.totalBalance.toLocaleString()} with ${data.totalIncome > 0 ? Math.round((data.totalBalance / data.totalIncome) * 100) : 0}% savings rate. What would you like to know?`
    } else {
      response = `I'm here to help with your finances! You currently have a balance of $${data.totalBalance.toLocaleString()} and are saving $${Math.abs(data.totalBalance)}/month. I can provide insights on your budget, spending patterns, savings strategies, or help you set financial goals. What would you like to explore?`
    }

    return new Response(JSON.stringify({ response }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("[v0] Chat API error:", error)
    return new Response(JSON.stringify({ error: "Failed to process chat request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
