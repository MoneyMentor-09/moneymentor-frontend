# MoneyMentor Setup Guide

This guide will help you set up the MoneyMentor application with Supabase backend.

## 🚀 **Quick Setup**

### **Step 1: Create Supabase Project**

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `moneymentor`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your location
5. Click "Create new project"
6. Wait for the project to be created (2-3 minutes)

### **Step 2: Get Supabase Credentials**

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

### **Step 3: Set Up Environment Variables**

1. Create a `.env.local` file in your project root:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key

# Optional: OpenAI API Key for AI features
OPENAI_API_KEY=your-openai-api-key
```

2. Replace the values with your actual Supabase credentials

### **Step 4: Set Up Database**

1. In your Supabase dashboard, go to **SQL Editor**
2. Run the following SQL scripts **in order**:

#### **Script 1: Create Tables**
Copy and paste the contents of `scripts/01-create-tables.sql`:

```sql
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(read);
```

#### **Script 2: Enable Row Level Security**
Copy and paste the contents of `scripts/02-enable-rls.sql`:

```sql
-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

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
```

#### **Script 3: Create Functions**
Copy and paste the contents of `scripts/03-create-functions.sql`:

```sql
-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
```

### **Step 5: Configure Google OAuth (Optional)**

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click **Enable**
3. You'll need to create a Google OAuth app:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable Google+ API
   - Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Set **Application type** to **Web application**
   - Add **Authorized redirect URIs**:
     - `https://your-project-id.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client Secret**
4. Back in Supabase, paste the Client ID and Client Secret
5. Click **Save**

### **Step 6: Install Dependencies and Run**

```bash
# Install dependencies
npm install
# or
pnpm install

# Start development server
npm run dev
# or
pnpm dev
```

## 🔧 **Troubleshooting**

### **Navigation Not Working**
- Check browser console for errors
- Verify environment variables are set correctly
- Try the test pages: `/test-navigation` or `/dashboard-simple`

### **Dark Mode Not Working**
- Check browser console for theme-related errors
- Verify `next-themes` is installed
- Try refreshing the page

### **Google Login Not Working**
- Verify Google OAuth is configured in Supabase
- Check that redirect URIs are correct
- Look for OAuth errors in browser console

### **Database Errors**
- Verify all SQL scripts were run successfully
- Check that RLS policies are created
- Ensure user is authenticated before accessing protected data

### **Environment Variables**
Make sure your `.env.local` file contains:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
```

## 📱 **Testing the App**

1. **Sign Up**: Create a new account with email/password
2. **Add Transactions**: Go to Transactions page and add some sample data
3. **Create Budgets**: Set up spending limits in the Budget page
4. **Test Navigation**: Click through all the navigation links
5. **Test Dark Mode**: Toggle the theme in the sidebar
6. **Test AI Chat**: Ask questions about your financial data

## 🚀 **Deployment**

For production deployment:

1. **Vercel** (Recommended):
   - Connect your GitHub repository
   - Add environment variables in Vercel dashboard
   - Deploy automatically

2. **Other Platforms**:
   - Ensure environment variables are set
   - Build the app: `npm run build`
   - Start the app: `npm start`

## 📞 **Support**

If you encounter issues:
1. Check the browser console for errors
2. Verify all setup steps were completed
3. Check Supabase dashboard for any errors
4. Review the troubleshooting section above
