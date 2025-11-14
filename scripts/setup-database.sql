-- Complete database setup script for MoneyMentor
-- Run this script in your Supabase SQL Editor

-- ==============================================
-- 1. CREATE TABLES
-- ==============================================

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  limit DECIMAL(10, 2) NOT NULL,
  spent DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  period TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('weekly', 'monthly', 'yearly')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, period)
);

-- Create alerts table
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

-- ==============================================
-- 2. CREATE INDEXES
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(read);

-- ==============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ==============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 4. CREATE RLS POLICIES
-- ==============================================

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Transactions policies
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Budgets policies
CREATE POLICY "Users can view their own budgets"
  ON budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets"
  ON budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
  ON budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
  ON budgets FOR DELETE
  USING (auth.uid() = user_id);

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

-- ==============================================
-- 5. CREATE FUNCTIONS
-- ==============================================

-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 6. CREATE TRIGGERS
-- ==============================================

-- Trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_transactions
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_budgets
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ==============================================
-- 7. INSERT SAMPLE DATA (Optional)
-- ==============================================

-- This will only work after you create a user account
-- Uncomment and run after creating your first user

/*
-- Get the current user ID (replace with your actual user ID)
-- You can find this in the Supabase Auth dashboard

-- Sample transactions
INSERT INTO transactions (user_id, description, amount, category, type, date) VALUES
('your-user-id-here', 'Salary', 5000.00, 'Salary', 'income', '2024-01-01'),
('your-user-id-here', 'Grocery Store', -150.00, 'Groceries', 'expense', '2024-01-02'),
('your-user-id-here', 'Gas Station', -45.00, 'Gas', 'expense', '2024-01-03'),
('your-user-id-here', 'Restaurant', -75.00, 'Food & Dining', 'expense', '2024-01-04'),
('your-user-id-here', 'Freelance Work', 800.00, 'Freelance', 'income', '2024-01-05');

-- Sample budgets
INSERT INTO budgets (user_id, category, limit, spent, notes) VALUES
('your-user-id-here', 'Groceries', 500.00, 150.00, 'Monthly grocery budget'),
('your-user-id-here', 'Gas', 200.00, 45.00, 'Monthly gas budget'),
('your-user-id-here', 'Food & Dining', 300.00, 75.00, 'Restaurants and takeout'),
('your-user-id-here', 'Entertainment', 200.00, 0.00, 'Movies, games, etc.');

-- Sample alerts
INSERT INTO alerts (user_id, message, risk_score, type) VALUES
('your-user-id-here', 'Unusual spending detected in Food & Dining category', 25, 'unusual_spending'),
('your-user-id-here', 'You are approaching your Groceries budget limit', 15, 'budget_warning');
*/

-- ==============================================
-- SETUP COMPLETE!
-- ==============================================

-- Verify tables were created
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'transactions', 'budgets', 'alerts')
ORDER BY tablename;
