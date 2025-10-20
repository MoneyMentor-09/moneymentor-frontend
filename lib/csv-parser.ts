interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  category: string
}

export function parseCSV(csvText: string): Transaction[] {
  const lines = csvText.trim().split("\n")

  if (lines.length < 2) {
    throw new Error("CSV file is empty or invalid")
  }

  // Parse header
  const header = lines[0]
    .toLowerCase()
    .split(",")
    .map((h) => h.trim().replace(/['"]/g, ""))

  // Try to detect column mappings (support various bank formats)
  const columnMappings = {
    date: findColumn(header, ["date", "transaction date", "posted date", "trans date"]),
    description: findColumn(header, ["description", "merchant", "payee", "details", "memo"]),
    amount: findColumn(header, ["amount", "transaction amount", "debit", "credit"]),
    category: findColumn(header, ["category", "type", "transaction type"]),
  }

  // Validate that we found the essential columns
  if (columnMappings.date === -1 || columnMappings.description === -1 || columnMappings.amount === -1) {
    throw new Error(
      "Could not find required columns. Please ensure your CSV has date, description, and amount columns.",
    )
  }

  // Parse data rows
  const transactions: Transaction[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Handle quoted values that may contain commas
    const values = parseCSVLine(line)

    if (values.length < 3) {
      console.warn(`Skipping invalid row ${i + 1}: insufficient columns`)
      continue
    }

    try {
      const dateStr = values[columnMappings.date]?.trim()
      const description = values[columnMappings.description]?.trim()
      const amount = Number.parseFloat(values[columnMappings.amount]?.replace(/[$,]/g, "") || "0")

      // Auto-categorize if category column doesn't exist or is empty
      let category = columnMappings.category !== -1 ? values[columnMappings.category]?.trim() : ""
      if (!category) {
        category = autoCategorize(description)
      }

      // Validate transaction data
      if (!dateStr || !description || isNaN(amount)) {
        console.warn(`Skipping invalid row ${i + 1}: invalid data`)
        continue
      }

      // Normalize date format to YYYY-MM-DD
      const normalizedDate = normalizeDate(dateStr)

      const transaction: Transaction = {
        id: `csv-${Date.now()}-${i}`,
        date: normalizedDate,
        description,
        amount,
        category,
      }

      transactions.push(transaction)
    } catch (error) {
      console.warn(`Skipping row ${i + 1}: ${error}`)
    }
  }

  if (transactions.length === 0) {
    throw new Error("No valid transactions found in CSV file")
  }

  return transactions
}

// Helper function to find column index by multiple possible names
function findColumn(header: string[], possibleNames: string[]): number {
  for (const name of possibleNames) {
    const index = header.findIndex((h) => h.includes(name))
    if (index !== -1) return index
  }
  return -1
}

// Helper function to parse CSV line with quoted values
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      values.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  values.push(current.trim())
  return values
}

// Helper function to normalize various date formats to YYYY-MM-DD
function normalizeDate(dateStr: string): string {
  // Try parsing common date formats
  const formats = [
    // MM/DD/YYYY or M/D/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // DD/MM/YYYY or D/M/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // YYYY-MM-DD (already correct)
    /^(\d{4})-(\d{2})-(\d{2})$/,
    // MM-DD-YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/,
  ]

  // If already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr
  }

  // Try MM/DD/YYYY format (most common in US)
  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (match) {
    const month = match[1].padStart(2, "0")
    const day = match[2].padStart(2, "0")
    const year = match[3]
    return `${year}-${month}-${day}`
  }

  // Try parsing with Date object as fallback
  const date = new Date(dateStr)
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // If all else fails, return as-is and let validation catch it
  return dateStr
}

// Helper function to auto-categorize transactions based on description
function autoCategorize(description: string): string {
  const desc = description.toLowerCase()

  // Food & Dining
  if (
    desc.includes("restaurant") ||
    desc.includes("cafe") ||
    desc.includes("coffee") ||
    desc.includes("food") ||
    desc.includes("grocery") ||
    desc.includes("market") ||
    desc.includes("pizza") ||
    desc.includes("burger")
  ) {
    return "Food & Dining"
  }

  // Transportation
  if (
    desc.includes("gas") ||
    desc.includes("fuel") ||
    desc.includes("uber") ||
    desc.includes("lyft") ||
    desc.includes("taxi") ||
    desc.includes("parking") ||
    desc.includes("transit")
  ) {
    return "Transportation"
  }

  // Utilities
  if (
    desc.includes("electric") ||
    desc.includes("water") ||
    desc.includes("gas bill") ||
    desc.includes("internet") ||
    desc.includes("phone") ||
    desc.includes("utility")
  ) {
    return "Utilities"
  }

  // Shopping
  if (
    desc.includes("amazon") ||
    desc.includes("walmart") ||
    desc.includes("target") ||
    desc.includes("shopping") ||
    desc.includes("store")
  ) {
    return "Shopping"
  }

  // Entertainment
  if (
    desc.includes("movie") ||
    desc.includes("theater") ||
    desc.includes("netflix") ||
    desc.includes("spotify") ||
    desc.includes("game") ||
    desc.includes("entertainment")
  ) {
    return "Entertainment"
  }

  // Health & Fitness
  if (
    desc.includes("gym") ||
    desc.includes("fitness") ||
    desc.includes("doctor") ||
    desc.includes("pharmacy") ||
    desc.includes("health") ||
    desc.includes("medical")
  ) {
    return "Health & Fitness"
  }

  // Income
  if (
    desc.includes("salary") ||
    desc.includes("payroll") ||
    desc.includes("deposit") ||
    desc.includes("payment received") ||
    desc.includes("income")
  ) {
    return "Income"
  }

  // Default category
  return "Other"
}

// Helper function to generate sample CSV for download
export function generateSampleCSV(): string {
  const header = "date,description,amount,category"
  const rows = [
    "2025-09-28,Grocery Store,-85.32,Food & Dining",
    "2025-09-27,Salary Deposit,5200.00,Income",
    "2025-09-26,Electric Bill,-120.50,Utilities",
    "2025-09-25,Coffee Shop,-12.50,Food & Dining",
    "2025-09-24,Gas Station,-45.00,Transportation",
  ]

  return [header, ...rows].join("\n")
}
