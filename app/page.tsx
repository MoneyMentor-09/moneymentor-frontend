import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Wallet, TrendingUp, MessageSquare, PieChart, Target, Shield } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-br from-violet-400/20 to-indigo-400/20 rounded-full blur-3xl animate-float" />
      </div>

      {/* Header */}
      <header className="border-b border-border relative z-10 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">Money Mentor</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
            Take Control of Your Financial Future
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 text-pretty max-w-2xl mx-auto">
            Smart budgeting, intelligent insights, and AI-powered guidance to help you achieve your financial goals.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="text-lg px-8 py-6 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
              asChild
            >
              <Link href="/signup">Get Started Free</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 bg-transparent hover:bg-primary/5 transition-all"
              asChild
            >
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/30 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
            Everything you need to manage your money
          </h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Powerful features designed to give you complete visibility and control over your finances.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-border hover:shadow-lg hover:shadow-primary/10 transition-all hover:-translate-y-1 bg-gradient-to-br from-card to-card/50">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                  <PieChart className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Smart Budgeting</h3>
                <p className="text-muted-foreground">
                  Create and track budgets across multiple categories. Get real-time alerts when you're approaching
                  limits.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg hover:shadow-primary/10 transition-all hover:-translate-y-1 bg-gradient-to-br from-card to-card/50">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Transaction Tracking</h3>
                <p className="text-muted-foreground">
                  Automatically categorize and track all your expenses. Understand where your money goes with detailed
                  insights.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg hover:shadow-primary/10 transition-all hover:-translate-y-1 bg-gradient-to-br from-card to-card/50">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">AI Financial Advisor</h3>
                <p className="text-muted-foreground">
                  Get personalized financial advice powered by AI. Ask questions and receive instant, actionable
                  guidance.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg hover:shadow-primary/10 transition-all hover:-translate-y-1 bg-gradient-to-br from-card to-card/50">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Savings Goals</h3>
                <p className="text-muted-foreground">
                  Set and track progress toward your financial goals. Stay motivated with visual progress indicators.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg hover:shadow-primary/10 transition-all hover:-translate-y-1 bg-gradient-to-br from-card to-card/50">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-yellow-500/20 to-amber-500/20 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Smart Alerts</h3>
                <p className="text-muted-foreground">
                  Receive intelligent notifications about unusual spending, upcoming bills, and budget warnings.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg hover:shadow-primary/10 transition-all hover:-translate-y-1 bg-gradient-to-br from-card to-card/50">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center mb-4">
                  <Wallet className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Financial Dashboard</h3>
                <p className="text-muted-foreground">
                  View all your financial data at a glance. Beautiful charts and insights help you make better
                  decisions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-12 border-2 border-primary/30 shadow-xl shadow-primary/10">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            Ready to transform your financial life?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of users who are taking control of their finances with Money Mentor.
          </p>
          <Button
            size="lg"
            className="text-lg px-8 py-6 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
            asChild
          >
            <Link href="/signup">Start Your Journey Today</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-20 relative z-10 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold text-foreground">Money Mentor</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2025 Money Mentor. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
