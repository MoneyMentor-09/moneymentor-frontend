-- Create alerts table for fraud detection and notifications
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  type TEXT NOT NULL DEFAULT 'fraud' CHECK (type IN ('fraud', 'unusual_spending', 'budget_warning', 'low_balance')),
  read BOOLEAN DEFAULT FALSE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on alerts table
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Alerts policies
CREATE POLICY "Users can view their own alerts"
  ON alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alerts"
  ON alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
  ON alerts FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(read);

-- Add phone column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update budgets table to match the app expectations
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS limit DECIMAL(10, 2);
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update the budgets table to use 'limit' instead of 'amount'
UPDATE budgets SET limit = amount WHERE limit IS NULL;
