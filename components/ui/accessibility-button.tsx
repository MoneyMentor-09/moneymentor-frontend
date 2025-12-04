"use client"

import { useState } from "react"
import { EyeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AccessibilityDrawer } from "./accessibility-drawer"

export function AccessibilityButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(true)}
        aria-label="Open accessibility settings"
      >
        <EyeIcon className="h-5 w-5" />
      </Button>

      <AccessibilityDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
