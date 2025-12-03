"use client"

import { useAccessibility, type ColorScheme } from "@/app/contexts/accessibility-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckIcon, EyeIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const colorSchemes: Array<{
  id: ColorScheme
  name: string
  description: string
  icon: string
}> = [
  {
    id: "default",
    name: "Default",
    description: "Standard color scheme with full color spectrum",
    icon: "🎨",
  },
  {
    id: "protanopia",
    name: "Protanopia",
    description: "Red-blind color scheme (difficulty seeing red)",
    icon: "🔴",
  },
  {
    id: "deuteranopia",
    name: "Deuteranopia",
    description: "Green-blind color scheme (difficulty seeing green)",
    icon: "🟢",
  },
  {
    id: "tritanopia",
    name: "Tritanopia",
    description: "Blue-blind color scheme (difficulty seeing blue)",
    icon: "🔵",
  },
  {
    id: "monochrome",
    name: "Monochrome",
    description: "Grayscale color scheme for complete color blindness",
    icon: "⚫",
  },
  {
    id: "high-contrast",
    name: "High Contrast",
    description: "Enhanced contrast for better visibility",
    icon: "⚡",
  },
]

export function AccessibilityPanel() {
  const { colorScheme, setColorScheme } = useAccessibility()

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <EyeIcon className="size-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Accessibility Settings</h1>
          <p className="text-muted-foreground">Choose a color scheme optimized for your vision</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {colorSchemes.map((scheme) => (
          <Card
            key={scheme.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg",
              colorScheme === scheme.id && "ring-2 ring-primary",
            )}
            onClick={() => setColorScheme(scheme.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{scheme.icon}</span>
                  <CardTitle className="text-lg">{scheme.name}</CardTitle>
                </div>
                {colorScheme === scheme.id && <CheckIcon className="size-5 text-primary" />}
              </div>
              <CardDescription className="text-sm">{scheme.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant={colorScheme === scheme.id ? "default" : "outline"}
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  setColorScheme(scheme.id)
                }}
              >
                {colorScheme === scheme.id ? "Active" : "Apply"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">About Color Blindness Support</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Protanopia:</strong> Affects ~1% of males. Difficulty distinguishing red from green.
          </p>
          <p>
            <strong>Deuteranopia:</strong> Affects ~1% of males. Difficulty distinguishing green from red.
          </p>
          <p>
            <strong>Tritanopia:</strong> Rare condition. Difficulty distinguishing blue from yellow.
          </p>
          <p>
            <strong>Monochrome:</strong> Complete color blindness. All colors appear as shades of gray.
          </p>
          <p>
            <strong>High Contrast:</strong> Enhanced contrast ratios for low vision users.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
