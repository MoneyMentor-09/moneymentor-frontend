"use client"

export function FloatingBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* Large floating circles */}
      <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-primary/5 blur-3xl animate-float" />
      <div className="absolute -right-32 top-1/4 h-[500px] w-[500px] rounded-full bg-accent/5 blur-3xl animate-float-slow" />
      <div
        className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-primary/5 blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />

      {/* Smaller accent circles */}
      <div className="absolute right-1/4 top-1/2 h-40 w-40 rounded-full bg-accent/10 blur-2xl animate-pulse-glow" />
      <div
        className="absolute left-1/2 bottom-1/4 h-32 w-32 rounded-full bg-primary/10 blur-2xl animate-pulse-glow"
        style={{ animationDelay: "1.5s" }}
      />
    </div>
  )
}
