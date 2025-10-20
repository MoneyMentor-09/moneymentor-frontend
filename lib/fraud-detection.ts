export interface FraudAlert {
  id: string
  type: "unusual_amount" | "unusual_location" | "duplicate_transaction" | "high_frequency" | "unusual_time"
  severity: "critical" | "warning" | "info"
  title: string
  description: string
  timestamp: string
  transaction?: {
    amount: number
    merchant: string
    location: string
    date: string
  }
}

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  category: string
}

// Fraud detection rules
export function detectFraud(): FraudAlert[] {
  const alerts: FraudAlert[] = []

  // Get transactions from localStorage
  const storedTransactions = localStorage.getItem("transactions")
  const transactions: Transaction[] = storedTransactions ? JSON.parse(storedTransactions) : []

  // Rule 1: Detect unusually large transactions (>$1000)
  const largeTransactions = transactions.filter((t) => Math.abs(t.amount) > 1000)
  largeTransactions.forEach((transaction) => {
    alerts.push({
      id: `large-${transaction.id}`,
      type: "unusual_amount",
      severity: "warning",
      title: "Unusually Large Transaction Detected",
      description: `A transaction of $${Math.abs(transaction.amount).toFixed(2)} was detected, which is significantly higher than your average spending.`,
      timestamp: new Date(transaction.date).toLocaleString(),
      transaction: {
        amount: transaction.amount,
        merchant: transaction.description,
        location: "Unknown",
        date: transaction.date,
      },
    })
  })

  // Rule 2: Detect duplicate transactions (same amount and description within 24 hours)
  for (let i = 0; i < transactions.length; i++) {
    for (let j = i + 1; j < transactions.length; j++) {
      const t1 = transactions[i]
      const t2 = transactions[j]

      if (
        Math.abs(t1.amount) === Math.abs(t2.amount) &&
        t1.description === t2.description &&
        Math.abs(new Date(t1.date).getTime() - new Date(t2.date).getTime()) < 24 * 60 * 60 * 1000
      ) {
        alerts.push({
          id: `duplicate-${t1.id}-${t2.id}`,
          type: "duplicate_transaction",
          severity: "critical",
          title: "Potential Duplicate Transaction",
          description: `Two identical transactions of $${Math.abs(t1.amount).toFixed(2)} at ${t1.description} were detected within 24 hours. This could indicate fraudulent activity.`,
          timestamp: new Date(t2.date).toLocaleString(),
          transaction: {
            amount: t2.amount,
            merchant: t2.description,
            location: "Unknown",
            date: t2.date,
          },
        })
        break
      }
    }
  }

  // Rule 3: Detect high-frequency transactions (>10 transactions in a day)
  const transactionsByDate: Record<string, Transaction[]> = {}
  transactions.forEach((t) => {
    const date = t.date.split("T")[0]
    if (!transactionsByDate[date]) {
      transactionsByDate[date] = []
    }
    transactionsByDate[date].push(t)
  })

  Object.entries(transactionsByDate).forEach(([date, dayTransactions]) => {
    if (dayTransactions.length > 10) {
      alerts.push({
        id: `high-freq-${date}`,
        type: "high_frequency",
        severity: "warning",
        title: "High Transaction Frequency",
        description: `${dayTransactions.length} transactions were detected on ${date}, which is unusually high. Please verify these transactions.`,
        timestamp: new Date(date).toLocaleString(),
      })
    }
  })

  // Rule 4: Detect unusual spending patterns (spending >2x average in a category)
  const categorySpending: Record<string, number[]> = {}
  transactions.forEach((t) => {
    if (t.amount < 0) {
      // Only expenses
      if (!categorySpending[t.category]) {
        categorySpending[t.category] = []
      }
      categorySpending[t.category].push(Math.abs(t.amount))
    }
  })

  Object.entries(categorySpending).forEach(([category, amounts]) => {
    if (amounts.length > 2) {
      const average = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length
      const unusualTransactions = transactions.filter(
        (t) => t.category === category && Math.abs(t.amount) > average * 2,
      )

      unusualTransactions.forEach((transaction) => {
        alerts.push({
          id: `unusual-${transaction.id}`,
          type: "unusual_amount",
          severity: "info",
          title: "Unusual Spending Pattern",
          description: `A transaction of $${Math.abs(transaction.amount).toFixed(2)} in ${category} is more than twice your average spending in this category.`,
          timestamp: new Date(transaction.date).toLocaleString(),
          transaction: {
            amount: transaction.amount,
            merchant: transaction.description,
            location: "Unknown",
            date: transaction.date,
          },
        })
      })
    }
  })

  // Sort alerts by severity (critical first)
  const severityOrder = { critical: 0, warning: 1, info: 2 }
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  return alerts
}

// Function to calculate fraud risk score (0-100)
export function calculateFraudRiskScore(): number {
  const alerts = detectFraud()
  const criticalCount = alerts.filter((a) => a.severity === "critical").length
  const warningCount = alerts.filter((a) => a.severity === "warning").length
  const infoCount = alerts.filter((a) => a.severity === "info").length

  // Calculate weighted score
  const score = Math.min(100, criticalCount * 30 + warningCount * 15 + infoCount * 5)

  return score
}
