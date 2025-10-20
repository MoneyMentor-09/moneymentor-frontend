"use client"

import { AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface InactivityWarningModalProps {
  open: boolean
  countdown: number
  onContinue: () => void
}

export function InactivityWarningModal({ open, countdown, onContinue }: InactivityWarningModalProps) {
  return (
    <Dialog open={open} onOpenChange={onContinue}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>Inactivity Warning</DialogTitle>
          </div>
          <DialogDescription>
            You've been inactive for a while. You will be logged out in{" "}
            <span className="font-semibold text-foreground">{countdown} seconds</span> unless you continue.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onContinue} className="w-full">
            Continue Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
