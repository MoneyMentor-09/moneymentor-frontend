# MoneyMentor - Smart Personal Finance Assistant

MoneyMentor is an AI-powered personal finance web application that helps users understand, manage, and optimize their finances through smart data visualization, AI-driven insights, and seamless user experience.

## Features

### 🔐 Authentication System
- Email + Password login
- Google OAuth integration
- Phone number (OTP-based) authentication
- Secure session management with inactivity timers
- Password reset functionality

### 📊 Dashboard
- Financial overview with total balance, income, expenses, and fraud score
- Interactive charts (Pie, Bar, and Line) using Recharts
- Recent transactions feed
- Budget progress visualization
- Fraud risk summary

### 💳 Transactions Management
- Full CRUD operations for transactions
- CSV/Excel file upload for bank statements
- Advanced filtering and search
- Category management
- Export functionality

### 💰 Budget Management
- Create and manage budgets by category
- Visual progress tracking with color-coded indicators
- Over-budget alerts
- Spending limit monitoring

### ⚠️ Smart Alerts
- Fraud detection alerts
- Unusual spending notifications
- Budget warning alerts
- Risk score assessment

### 👤 Profile Management
- User profile editing
- Password change functionality
- Account deletion with confirmation
- Session management

### 🤖 AI Financial Assistant
- Context-aware financial insights
- Personalized recommendations
- Spending pattern analysis
- Budget optimization suggestions

## Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **UI Framework**: Tailwind CSS + ShadCN/UI + Lucide-react Icons
- **Backend & Auth**: Supabase (Auth, Database, Row-Level Security)
- **AI Engine**: OpenAI GPT API for chat-based financial analysis
- **Charts**: Recharts for data visualization
- **Styling**: Tailwind CSS with custom animations

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Supabase account
- OpenAI API key (optional, for AI features)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd moneymentor-frontend
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

4. Set up Supabase database:
Run the SQL scripts in the `scripts/` directory:
- `01-create-tables.sql` - Creates the database tables
- `02-enable-rls.sql` - Enables Row Level Security
- `03-create-functions.sql` - Creates database functions

5. Start the development server:
```bash
npm run dev
# or
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Tables

- **profiles**: User profile information
- **transactions**: Financial transactions
- **budgets**: User budget categories and limits
- **alerts**: Fraud detection and spending alerts

### Row Level Security (RLS)
All tables have RLS enabled to ensure users can only access their own data.

## Features Overview

### Dashboard
- Real-time financial metrics
- Interactive charts and visualizations
- Recent activity feed
- Budget progress tracking

### Transactions
- Add, edit, delete transactions
- Bulk upload via CSV
- Advanced filtering and search
- Category management

### Budget
- Create spending limits by category
- Visual progress indicators
- Over-budget warnings
- Monthly tracking

### Alerts
- Fraud detection
- Unusual spending patterns
- Budget warnings
- Risk assessment

### AI Chat
- Personalized financial insights
- Spending pattern analysis
- Budget recommendations
- Goal setting assistance

## Security Features

- Supabase Row-Level Security (RLS)
- Secure authentication with JWT tokens
- Automatic session timeout (5 minutes inactivity)
- Password strength validation
- CSRF protection

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@moneymentor.com or create an issue in the GitHub repository.
