"use client"

import { EyeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { AccessibilityDrawer } from "./accessibility-drawer"

export function AccessibilityButton() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <>
      <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => setIsDrawerOpen(true)}>
        <EyeIcon className="size-4" />
        <span>Accessibility</span>
      </Button>

      <AccessibilityDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  )
}
