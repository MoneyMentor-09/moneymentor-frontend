import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border py-4 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <h1 className="font-serif font-bold text-xl text-foreground">Money Mentor</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-foreground hover:bg-primary/10 transition-all duration-300">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-primary text-secondary hover:bg-primary/90 hover:scale-105 transition-all duration-300">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 md:px-8 bg-gradient-to-br from-background via-background to-secondary/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif font-bold text-4xl md:text-5xl lg:text-6xl text-foreground mb-6">
            Take Control of Your <span className="text-primary">Financial Future</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Smart budgeting, intelligent insights, and AI-powered guidance to help you achieve your financial goals.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-primary text-secondary hover:bg-primary/90 hover:scale-105 transition-all duration-300"
              >
                Get Started Free
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="border-primary text-foreground bg-transparent hover:bg-primary/10 hover:scale-105 transition-all duration-300"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="font-serif font-bold text-3xl md:text-4xl text-foreground mb-4">
              Everything you need to manage your money
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to give you complete visibility and control over your finances.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Smart Budgeting */}
            <Card className="bg-card border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-2xl">💡</span>
                </div>
                <CardTitle className="font-serif text-xl text-card-foreground">Smart Budgeting</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Create and track budgets across multiple categories. Get real-time alerts when you're approaching
                  limits.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Transaction Tracking */}
            <Card className="bg-card border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <span className="text-2xl">🔄</span>
                </div>
                <CardTitle className="font-serif text-xl text-card-foreground">Transaction Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Automatically categorize and track all your expenses. Understand where your money goes with detailed
                  insights.
                </CardDescription>
              </CardContent>
            </Card>

            {/* AI Financial Advisor */}
            <Card className="bg-card border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-secondary/30 flex items-center justify-center mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <CardTitle className="font-serif text-xl text-card-foreground">AI Financial Advisor</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Get personalized financial advice powered by AI. Ask questions and receive instant, actionable
                  guidance.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Savings Goals */}
            <Card className="bg-card border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <CardTitle className="font-serif text-xl text-card-foreground">Savings Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Set and track progress toward your financial goals. Stay motivated with visual progress indicators.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Smart Alerts */}
            <Card className="bg-card border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <span className="text-2xl">💡</span>
                </div>
                <CardTitle className="font-serif text-xl text-card-foreground">Smart Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Receive intelligent notifications about unusual spending, upcoming bills, and investment
                  opportunities.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Financial Dashboard */}
            <Card className="bg-card border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-secondary/30 flex items-center justify-center mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <CardTitle className="font-serif text-xl text-card-foreground">Financial Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  View all your financial data at a glance. Beautiful charts and insights help you make better
                  decisions.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-card border-border shadow-xl">
            <CardContent className="p-12 text-center">
              <h3 className="font-serif font-bold text-3xl md:text-4xl text-card-foreground mb-4">
                Ready to transform your financial life?
              </h3>
              <p className="text-muted-foreground mb-8 text-lg">
                Join thousands of users who are taking control of their finances with Money Mentor.
              </p>
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-primary text-secondary hover:bg-primary/90 hover:scale-105 transition-all duration-300"
                >
                  Start Your Journey Today
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-muted-foreground py-6 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <span className="font-serif font-bold text-primary-foreground">Money Mentor</span>
          </div>
          <p className="text-primary-foreground text-sm">© 2025 Money Mentor. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
