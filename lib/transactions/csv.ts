import { z } from 'zod';

export const CsvRowSchema = z.object({
  date: z.string().min(4),               // e.g., 2025-09-28
  description: z.string().min(1),
  amount: z.string().refine(v => !Number.isNaN(Number(v)), 'amount must be a number'),
  category: z.string().min(1),
});
export type CsvRow = z.infer<typeof CsvRowSchema>;

/** Parse the raw CSV text into normalized rows (number amount, ISO date, trimmed fields). */
export function parseTransactionsCsv(text: string) {
  const [headerLine, ...rows] = text.split(/\r?\n/).filter(Boolean);
  const header = headerLine.split(',').map(s => s.trim().toLowerCase());
  const required = ['date', 'description', 'amount', 'category'];
  for (const h of required) {
    if (!header.includes(h)) throw new Error(`CSV missing required column: ${h}`);
  }

  const idx = Object.fromEntries(header.map((h, i) => [h, i]));

  const normalized = rows.map((line, lineNo) => {
    const parts = line.split(',');
    const raw: CsvRow = {
      date: (parts[idx.date] ?? '').trim(),
      description: (parts[idx.description] ?? '').trim(),
      amount: (parts[idx.amount] ?? '').trim(),
      category: (parts[idx.category] ?? '').trim(),
    };

    const parsed = CsvRowSchema.safeParse(raw);
    if (!parsed.success) {
      const msg = parsed.error.issues.map(i => i.message).join('; ');
      throw new Error(`Row ${lineNo + 2}: ${msg}`);
    }

    // Normalize fields for DB
    const amountNum = Number(raw.amount);
    const dateISO = raw.date;
    return {
    date: raw.date,                       
    description: raw.description,
    amount: Number(raw.amount),            
    category: raw.category,
  };
  });

  return normalized;
}
