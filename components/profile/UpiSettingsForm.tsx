"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateUpiSettingsAction, uploadUpiQrAction } from "@/actions/profile"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

export function UpiSettingsForm({ initialUpiId, initialUpiName, initialUpiQrUrl, isVerified }: { initialUpiId: string | null, initialUpiName: string | null, initialUpiQrUrl?: string | null, isVerified: boolean }) {
  const [upiId, setUpiId] = useState(initialUpiId || "")
  const [upiName, setUpiName] = useState(initialUpiName || "")
  const [upiQrUrl, setUpiQrUrl] = useState(initialUpiQrUrl || "")
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const formData = new FormData()
    formData.append("file", file)
    
    setIsUploading(true)
    const toastId = toast.loading("Uploading QR Code...")
    try {
      const res = await uploadUpiQrAction(formData)
      if (res.error) {
        toast.error(res.error, { id: toastId })
      } else if (res.url) {
        setUpiQrUrl(res.url)
        toast.success("QR Code uploaded successfully.", { id: toastId })
      }
    } catch (err) {
      toast.error("Failed to upload QR Code.", { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = () => {
    if (!upiId || !upiName) {
      toast.error("Please fill in both fields.")
      return
    }

    startTransition(async () => {
      const res = await updateUpiSettingsAction({ upiId, upiName, upiQrUrl })
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("UPI Settings updated successfully.")
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="upiId">Registered UPI ID (VPA)</Label>
        <Input 
          id="upiId" 
          value={upiId} 
          onChange={e => setUpiId(e.target.value)} 
          placeholder="e.g. organizer@okbank" 
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Enter the UPI ID where you want to receive payments for your events.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="upiName">Payee Name</Label>
        <Input 
          id="upiName" 
          value={upiName} 
          onChange={e => setUpiName(e.target.value)} 
          placeholder="e.g. John Doe / Event Co." 
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          This name will be displayed to attendees when they make a payment.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="upiQr">UPI QR Code Image</Label>
        <Input 
          id="upiQr" 
          type="file"
          accept="image/*"
          onChange={handleImageChange} 
          disabled={isPending || isUploading}
        />
        <p className="text-xs text-muted-foreground">
          Upload a screenshot of your UPI QR code. It will be shown to attendees during checkout.
        </p>
        {upiQrUrl && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Current QR Code:</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={upiQrUrl} alt="UPI QR" className="max-w-[200px] border rounded" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 pt-2">
        <Button onClick={handleSave} disabled={isPending || isUploading || (upiId === initialUpiId && upiName === initialUpiName && upiQrUrl === initialUpiQrUrl)}>
          {isPending ? "Saving..." : "Save Settings"}
        </Button>
        {isVerified && (
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
            Verified
          </Badge>
        )}
      </div>
    </div>
  )
}
