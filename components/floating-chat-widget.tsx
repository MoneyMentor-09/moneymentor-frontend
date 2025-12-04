"use client"

import { useState, useRef, useEffect } from "react"
import { MessageSquare, X, Bot, User } from "lucide-react"
import { Button } from "@/components/ui/button"

// Helper to format numbers as USD
function fmtUSD(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(n || 0))
}

// Helper to parse strings or numbers into numeric amounts
function parseAmount(amount: string | number) {
  if (typeof amount === "number") return amount
  const cleaned = amount.replace(/[^0-9.-]+/g, "")
  return Number(cleaned) || 0
}

export function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your MoneyMentor AI. How can I help you today?" }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage = { role: "user", content: input }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const response = await fetch("/api/ch at", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      })

      const data = await response.json()

      // Ensure numeric savingsRate and totalBalance
      let content = data.response ?? "Sorry, I couldn't process that."
      if (content.includes("NaN%")) {
        content = content.replace("NaN%", "0%")
      }

      setMessages(prev => [
        ...prev,
        { role: "assistant", content }
      ])
    } catch (error) {
      console.error(error)
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </div>

      {/* Chat Popup */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-96 bg-white rounded-xl shadow-xl border z-50 flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b bg-blue-600 text-white rounded-t-xl">
            <span className="font-semibold">MoneyMentor AI</span>
            <button onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && <Bot className="h-5 w-5 text-blue-600 mt-1" />}
                <div className={`px-3 py-2 rounded-lg max-w-[70%] text-sm ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-white border"}`}>
                  {msg.content}
                </div>
                {msg.role === "user" && <User className="h-5 w-5 text-gray-500 mt-1" />}
              </div>
            ))}
            {loading && <div className="text-gray-500 text-sm italic px-2">MoneyMentor is typing...</div>}
            <div ref={bottomRef} />
          </div>

          {/* Input Bar */}
          <div className="p-2 border-t flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
              placeholder="Ask something..."
              onKeyDown={e => e.key === "Enter" && sendMessage()}
            />
            <Button onClick={sendMessage} className="px-4">Send</Button>
          </div>
        </div>
      )}
    </>
  )
}
