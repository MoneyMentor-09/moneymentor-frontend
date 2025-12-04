"use client"
 
import { useEffect, useState } from "react"

 import { EyeIcon, CheckIcon, MinusIcon, PlusIcon } from "lucide-react"

 import { Button } from "@/components/ui/button"

 import {

   DropdownMenu,

   DropdownMenuTrigger,

   DropdownMenuContent,

   DropdownMenuLabel,

   DropdownMenuItem,

   DropdownMenuSeparator,

 } from "@/components/ui/dropdown-menu"
 
export function AccessibilityButton() {

   // Accessibility States -----------------------------

   const [fontScale, setFontScale] = useState(1)

   const [dyslexiaFont, setDyslexiaFont] = useState(false)

   const [reducedMotion, setReducedMotion] = useState(false)

   const [colorScheme, setColorScheme] = useState("default")
 
  // Load settings initially ---------------------------

   useEffect(() => {

     const savedScale = localStorage.getItem("a11y-font-scale")

     const savedDyslexia = localStorage.getItem("a11y-dyslexia-font")

     const savedMotion = localStorage.getItem("a11y-reduced-motion")

     const savedScheme = localStorage.getItem("a11y-color-scheme")
 
    if (savedScale) setFontScale(Number(savedScale))

     if (savedDyslexia) setDyslexiaFont(savedDyslexia === "true")

     if (savedMotion) setReducedMotion(savedMotion === "true")

     if (savedScheme) setColorScheme(savedScheme)

   }, [])
 
  // APPLY CHANGES LIVE --------------------------------

   useEffect(() => {

     document.documentElement.style.fontSize = `${fontScale * 100}%`

   }, [fontScale])
 
  useEffect(() => {

     document.body.classList.toggle("dyslexia-font", dyslexiaFont)

   }, [dyslexiaFont])
 
  useEffect(() => {

     document.body.classList.toggle("reduced-motion", reducedMotion)

   }, [reducedMotion])
 
  useEffect(() => {

     document.documentElement.setAttribute("data-color-scheme", colorScheme)

   }, [colorScheme])
 
  // SAVE SETTINGS -------------------------------------

   const saveSettings = () => {

     localStorage.setItem("a11y-font-scale", fontScale.toString())

     localStorage.setItem("a11y-dyslexia-font", String(dyslexiaFont))

     localStorage.setItem("a11y-reduced-motion", String(reducedMotion))

     localStorage.setItem("a11y-color-scheme", colorScheme)

   }
 
  // Reset all

   const resetSettings = () => {

     setFontScale(1)

     setDyslexiaFont(false)

     setReducedMotion(false)

     setColorScheme("default")

   }
 
  // COLOR SCHEME OPTIONS ------------------------------

   const schemes = [

     { id: "default", label: "Default" },

     { id: "protanopia", label: "Protanopia" },

     { id: "deuteranopia", label: "Deuteranopia" },

     { id: "tritanopia", label: "Tritanopia" },

     { id: "monochrome", label: "Monochrome" },

     { id: "high-contrast", label: "High Contrast" },

   ]
 
  return (
<DropdownMenu modal={false}>
<DropdownMenuTrigger asChild>
<Button variant="ghost" size="icon" aria-label="Open accessibility settings">
<EyeIcon className="h-5 w-5" />
</Button>
</DropdownMenuTrigger>
 
      <DropdownMenuContent

         align="end"

         className="w-72 opacity-100"

         sideOffset={8}

         onCloseAutoFocus={(e) => e.preventDefault()}    // <— KEEP OPEN

         onInteractOutside={(e) => e.preventDefault()}   // <— PREVENT CLOSING
>
<DropdownMenuLabel className="font-semibold">Accessibility</DropdownMenuLabel>
<DropdownMenuSeparator />
 
        {/* TEXT SIZE --------------------------------------------------- */}
<DropdownMenuLabel className="text-xs text-muted-foreground">

           Text Size
</DropdownMenuLabel>
 
        <DropdownMenuItem className="flex justify-between items-center" onClick={(e) => e.preventDefault()}>
<span>Adjust</span>
<div className="flex items-center gap-2">
<Button size="icon" variant="outline" onClick={() => setFontScale(Math.max(0.8, fontScale - 0.1))}>
<MinusIcon className="h-4 w-4" />
</Button>
<Button size="icon" variant="outline" onClick={() => setFontScale(Math.min(1.8, fontScale + 0.1))}>
<PlusIcon className="h-4 w-4" />
</Button>
</div>
</DropdownMenuItem>
 
        <DropdownMenuSeparator />
 
        {/* COLOR SCHEMES ------------------------------------------------ */}
<DropdownMenuLabel className="text-xs text-muted-foreground">

           Color Schemes
</DropdownMenuLabel>
 
        {schemes.map((scheme) => (
<DropdownMenuItem

             key={scheme.id}

             onClick={() => setColorScheme(scheme.id)}

             className="flex justify-between items-center cursor-pointer"
>

             {scheme.label}

             {colorScheme === scheme.id && <CheckIcon className="h-4 w-4 text-primary" />}
</DropdownMenuItem>

         ))}
 
        <DropdownMenuSeparator />
 
        {/* DYSLEXIA FONT ----------------------------------------------- */}
<DropdownMenuItem

           className="flex justify-between"

           onClick={() => setDyslexiaFont(!dyslexiaFont)}
>

           Dyslexia-Friendly Font

           {dyslexiaFont && <CheckIcon className="h-4 w-4 text-primary" />}
</DropdownMenuItem>
 
        {/* REDUCED MOTION ---------------------------------------------- */}
<DropdownMenuItem

           className="flex justify-between"

           onClick={() => setReducedMotion(!reducedMotion)}
>

           Reduced Motion

           {reducedMotion && <CheckIcon className="h-4 w-4 text-primary" />}
</DropdownMenuItem>
 
        <DropdownMenuSeparator />
 
        {/* SAVE + RESET BUTTONS ---------------------------------------- */}
<div className="flex justify-between items-center px-2 pb-2 pt-1">
<Button variant="destructive" size="sm" onClick={resetSettings}>

             Reset
</Button>
<Button variant="default" size="sm" onClick={saveSettings}>

             Save Settings
</Button>
</div>
</DropdownMenuContent>
</DropdownMenu>

   )

 }
