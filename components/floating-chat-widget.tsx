"use client"

import { useState } from "react"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleOpenChat = () => {
    router.push("/chat")
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button size="lg" className="h-14 w-14 rounded-full shadow-lg" onClick={handleOpenChat}>
        <MessageSquare className="h-6 w-6" />
        <span className="sr-only">Open AI Chat</span>
      </Button>
    </div>
  )
}
