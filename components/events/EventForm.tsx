"use client"

import { useState, useTransition } from "react"
import { useForm, useFieldArray, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { eventSchema } from "@/lib/schemas"
import type { z } from "zod"
import { createEventAction, updateEventAction, uploadBannerAction } from "@/actions/events"
import { uploadUpiQrAction, updateUpiQrUrlOnlyAction } from "@/actions/profile"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PlusIcon, TrashIcon } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

type EventInput = z.infer<typeof eventSchema>

export function EventForm({ event, hasSoldTickets = false, organizerUpiQrUrl = "" }: { event?: any, hasSoldTickets?: boolean, organizerUpiQrUrl?: string | null }) {
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [localUpiQrUrl, setLocalUpiQrUrl] = useState(organizerUpiQrUrl || "")
  const [isUploadingQr, setIsUploadingQr] = useState(false)
  const router = useRouter()

  const form = useForm<EventInput>({
    resolver: zodResolver(eventSchema) as unknown as Resolver<EventInput>,
    defaultValues: event ? {
      title: event.title,
      description: event.description,
      category: event.category,
      city: event.city,
      venueName: event.venueName,
      address: event.address,
      startsAt: new Date(event.startsAt),
      endsAt: new Date(event.endsAt),
      bannerUrl: event.bannerUrl || "",
      hasSeating: event.hasSeating,
      tickets: event.ticketTypes?.map((t: any) => ({
        id: t.id,
        name: t.name,
        price: t.pricePaise / 100,
        quantity: t.quantity
      })) || []
    } : {
      title: "",
      description: "",
      category: "",
      city: "",
      venueName: "",
      address: "",
      startsAt: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // tomorrow
      endsAt: new Date(new Date().getTime() + 48 * 60 * 60 * 1000),
      bannerUrl: "",
      hasSeating: false,
      tickets: [{ name: "General Admission", price: 499, quantity: 200 }]
    }
  })

  const { fields: ticketFields, append: appendTicket, remove: removeTicket } = useFieldArray({
    control: form.control,
    name: "tickets",
  })

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const result = await uploadBannerAction(formData)
      if (result.error) {
        toast.error(result.error)
      } else if (result.url) {
        form.setValue("bannerUrl", result.url)
        toast.success("Banner uploaded successfully")
      }
    } catch (error) {
      toast.error("Failed to upload image")
    } finally {
      setIsUploading(false)
    }
  }

  async function handleUpiQrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingQr(true)
    const formData = new FormData()
    formData.append("file", file)

    const toastId = toast.loading("Uploading QR Code...")
    try {
      const result = await uploadUpiQrAction(formData)
      if (result.error) {
        toast.error(result.error, { id: toastId })
      } else if (result.url) {
        const updateRes = await updateUpiQrUrlOnlyAction(result.url)
        if (updateRes.error) {
          toast.error(updateRes.error, { id: toastId })
        } else {
          setLocalUpiQrUrl(result.url)
          toast.success("UPI QR Code updated for all events.", { id: toastId })
        }
      }
    } catch (error) {
      toast.error("Failed to upload QR code", { id: toastId })
    } finally {
      setIsUploadingQr(false)
    }
  }

  async function handleRemoveUpiQr() {
    setIsUploadingQr(true)
    try {
      const updateRes = await updateUpiQrUrlOnlyAction(null)
      if (updateRes.error) {
        toast.error(updateRes.error)
      } else {
        setLocalUpiQrUrl("")
        toast.success("UPI QR Code removed.")
      }
    } catch (error) {
      toast.error("Failed to remove QR code")
    } finally {
      setIsUploadingQr(false)
    }
  }

  function onSubmit(data: EventInput) {
    startTransition(async () => {
      let result
      if (event?.id) {
        result = await updateEventAction(event.id, data)
      } else {
        result = await createEventAction(data)
      }

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(event?.id ? "Event updated" : "Event created")
        if (!event?.id && result && "eventId" in result && result.eventId) {
          router.push(`/organizer/events/${result.eventId}/edit`)
        }
      }
    })
  }

  const bannerUrl = form.watch("bannerUrl")

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Basic Details</CardTitle>
            <CardDescription>Enter the primary information for your event.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Tech Conference 2024" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Music">Music</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Food">Food & Drink</SelectItem>
                      <SelectItem value="Arts">Arts & Theatre</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell people what your event is about..." 
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Date & Location</CardTitle>
            <CardDescription>When and where is this happening?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date & Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        {...field}
                        disabled={hasSoldTickets}
                        value={field.value ? new Date(field.value.getTime() - field.value.getTimezoneOffset() * 60000).toISOString().slice(0,16) : ""}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date & Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        {...field}
                        disabled={hasSoldTickets}
                        value={field.value ? new Date(field.value.getTime() - field.value.getTimezoneOffset() * 60000).toISOString().slice(0,16) : ""}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Mumbai" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="venueName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jio World Convention Centre" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Address</FormLabel>
                  <FormControl>
                    <Input placeholder="BKC, Bandra East..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Banner & Seating</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="bannerUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Banner Image</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      {bannerUrl && (
                        <div className="relative w-full h-48 bg-muted rounded-md overflow-hidden">
                          <img src={bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <Input 
                        type="file" 
                        accept="image/jpeg, image/png, image/webp" 
                        onChange={handleImageUpload}
                        disabled={isUploading || isPending}
                      />
                      <Input type="hidden" {...field} />
                    </div>
                  </FormControl>
                  <FormDescription>Upload a JPG, PNG, or WEBP image up to 3MB.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasSeating"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Assigned Seating</FormLabel>
                    <FormDescription>
                      Enable this if attendees select specific seats on a seating chart.
                      {hasSoldTickets && " Cannot be changed after tickets are sold."}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={hasSoldTickets}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Organizer Payment Details (UPI)</CardTitle>
            <CardDescription>Configure your payment QR code. This is configured at the organizer level and applies to all your events.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <FormLabel>UPI QR Code Image</FormLabel>
              <div className="flex flex-col gap-4">
                {localUpiQrUrl && (
                  <div className="relative w-48 h-48 bg-muted rounded-md overflow-hidden border">
                    <img src={localUpiQrUrl} alt="UPI QR Preview" className="w-full h-full object-contain" />
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <Input 
                    type="file" 
                    accept="image/jpeg, image/png, image/webp" 
                    onChange={handleUpiQrUpload}
                    disabled={isUploadingQr || isPending}
                    className="max-w-xs"
                  />
                  {localUpiQrUrl && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleRemoveUpiQr}
                      disabled={isUploadingQr || isPending}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <FormDescription>
                  This QR code will be displayed to attendees during checkout for them to scan and pay. Note: Make sure you also complete your UPI Name and ID in your Profile settings!
                </FormDescription>
              </div>
            </div>
          </CardContent>
        </Card>


        <Card>
          <CardHeader>
            <CardTitle>Ticket Details</CardTitle>
            <CardDescription>Configure ticket types, pricing, and available quantities.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {ticketFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-4 border rounded-lg bg-muted/20">
                <div className="md:col-span-5 space-y-2">
                  <FormField
                    control={form.control}
                    name={`tickets.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ticket Name</FormLabel>
                        <FormControl>
                          <Input placeholder="General Admission" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="md:col-span-3 space-y-2">
                  <FormField
                    control={form.control}
                    name={`tickets.${index}.price`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="md:col-span-3 space-y-2">
                  <FormField
                    control={form.control}
                    name={`tickets.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" step="1" {...field} disabled={hasSoldTickets} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="md:col-span-1">
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="icon" 
                    className="w-full"
                    disabled={ticketFields.length === 1 || hasSoldTickets}
                    onClick={() => removeTicket(index)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {!hasSoldTickets && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => appendTicket({ name: "", price: 0, quantity: 100 })}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Ticket Type
              </Button>
            )}

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center font-medium">
                <span>Total Potential Inventory:</span>
                <span>{(form.watch("tickets") || []).reduce((acc, curr) => acc + (curr.quantity || 0), 0)} tickets</span>
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
                <span>Total Potential Sales Value:</span>
                <span>₹{(form.watch("tickets") || []).reduce((acc, curr) => acc + ((curr.quantity || 0) * (curr.price || 0)), 0).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isPending || isUploading} className="w-full">
          {isPending ? "Saving..." : (event ? "Save Changes" : "Create Event")}
        </Button>
      </form>
    </Form>
  )
}
