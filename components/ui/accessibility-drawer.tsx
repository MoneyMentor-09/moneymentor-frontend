"use client"

import { useAccessibility, type ColorScheme } from "@/contexts/accessibility-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckIcon, EyeIcon, MoonIcon, SunIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

const colorSchemes: Array<{
  id: ColorScheme
  name: string
  description: string
  icon: string
}> = [
  {
    id: "default",
    name: "Default",
    description: "Standard color scheme",
    icon: "🎨",
  },
  {
    id: "protanopia",
    name: "Protanopia",
    description: "Red-blind (blue-yellow)",
    icon: "🔴",
  },
  {
    id: "deuteranopia",
    name: "Deuteranopia",
    description: "Green-blind (blue-purple)",
    icon: "🟢",
  },
  {
    id: "tritanopia",
    name: "Tritanopia",
    description: "Blue-blind (red-green)",
    icon: "🔵",
  },
  {
    id: "monochrome",
    name: "Monochrome",
    description: "Grayscale only",
    icon: "⚫",
  },
  {
    id: "high-contrast",
    name: "High Contrast",
    description: "Enhanced visibility",
    icon: "⚡",
  },
]

interface AccessibilityDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function AccessibilityDrawer({ isOpen, onClose }: AccessibilityDrawerProps) {
  const { colorScheme, setColorScheme, isDarkMode, toggleDarkMode } = useAccessibility()

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} aria-hidden="true" />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-border z-50 overflow-y-auto shadow-2xl">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <EyeIcon className="size-6 text-primary" />
              <div>
                <h2 className="text-2xl font-bold text-foreground">Accessibility</h2>
                <p className="text-sm text-muted-foreground">Customize your viewing experience</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
              <XIcon className="size-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* Dark Mode Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {isDarkMode ? <MoonIcon className="size-4" /> : <SunIcon className="size-4" />}
                Dark Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode" className="text-sm text-muted-foreground">
                  {isDarkMode ? "Dark mode is on" : "Light mode is on"}
                </Label>
                <Switch id="dark-mode" checked={isDarkMode} onCheckedChange={toggleDarkMode} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50 border-2 border-dashed">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <EyeIcon className="size-4" />
                Live Preview
              </CardTitle>
              <CardDescription className="text-xs">See how colors look with the current theme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Color Swatches */}
              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-1">
                  <div className="h-12 rounded-md bg-background border border-border" />
                  <p className="text-xs text-center text-muted-foreground">Background</p>
                </div>
                <div className="space-y-1">
                  <div className="h-12 rounded-md bg-primary" />
                  <p className="text-xs text-center text-muted-foreground">Primary</p>
                </div>
                <div className="space-y-1">
                  <div className="h-12 rounded-md bg-secondary" />
                  <p className="text-xs text-center text-muted-foreground">Secondary</p>
                </div>
                <div className="space-y-1">
                  <div className="h-12 rounded-md bg-accent" />
                  <p className="text-xs text-center text-muted-foreground">Accent</p>
                </div>
              </div>

              {/* Sample UI Elements */}
              <div className="space-y-2 pt-2">
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1">
                    Primary Button
                  </Button>
                  <Button size="sm" variant="secondary" className="flex-1">
                    Secondary
                  </Button>
                </div>
                <Card>
                  <CardHeader className="p-3">
                    <CardTitle className="text-xs">Sample Card</CardTitle>
                    <CardDescription className="text-xs">This shows how text and cards look</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Color Schemes */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Color Schemes</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select a color scheme optimized for different types of color vision
            </p>
            <div className="space-y-2">
              {colorSchemes.map((scheme) => (
                <Card
                  key={scheme.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    colorScheme === scheme.id && "ring-2 ring-primary bg-accent",
                  )}
                  onClick={() => setColorScheme(scheme.id)}
                >
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{scheme.icon}</span>
                        <div>
                          <CardTitle className="text-sm font-semibold">{scheme.name}</CardTitle>
                          <CardDescription className="text-xs">{scheme.description}</CardDescription>
                        </div>
                      </div>
                      {colorScheme === scheme.id && <CheckIcon className="size-5 text-primary shrink-0" />}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* Info Card */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm">About These Settings</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>These accessibility settings will persist across all pages and browser sessions.</p>
              <p>Color schemes are designed to help users with different types of color vision deficiency.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
