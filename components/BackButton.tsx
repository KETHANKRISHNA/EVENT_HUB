"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export function BackButton({ fallbackUrl, label = "Back" }: { fallbackUrl: string, label?: string }) {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length > 2) {
      router.back()
    } else {
      router.push(fallbackUrl)
    }
  }

  return (
    <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:text-primary" onClick={handleBack}>
      <ChevronLeft className="w-4 h-4 mr-1" />
      {label}
    </Button>
  )
}
