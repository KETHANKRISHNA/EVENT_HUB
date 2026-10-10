"use client"

import { useState, useTransition } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { seatLayoutSchema } from "@/lib/schemas"
import type { z } from "zod"
import { generateSeatLayoutAction } from "@/actions/tickets"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
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
import { Plus, Trash2 } from "lucide-react"

type LayoutInput = z.infer<typeof seatLayoutSchema>

export function SeatLayoutGenerator({ eventId, ticketTypes, existingSeats }: { eventId: string, ticketTypes: any[], existingSeats: any[] }) {
  const [isPending, startTransition] = useTransition()
  
  const hasBookedOrHeld = existingSeats.some(s => s.status !== "AVAILABLE")

  const form = useForm<LayoutInput>({
    resolver: zodResolver(seatLayoutSchema),
    defaultValues: {
      rows: 10,
      seatsPerRow: 12,
      mappings: ticketTypes.length > 0 ? [{ startRow: 1, endRow: 10, ticketTypeId: ticketTypes[0].id }] : []
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "mappings"
  })

  function onSubmit(data: LayoutInput) {
    if (hasBookedOrHeld) {
      toast.error("Cannot regenerate layout because some seats are already held or booked")
      return
    }

    if (ticketTypes.length === 0) {
      toast.error("Create at least one ticket type first")
      return
    }

    startTransition(async () => {
      const result = await generateSeatLayoutAction(eventId, data)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Seat layout generated successfully")
      }
    })
  }

  const { rows, seatsPerRow } = form.watch()

  const generatePreview = () => {
    if (!existingSeats.length) return null

    const grid = []
    const rowsMap = new Map()
    existingSeats.forEach(seat => {
      if (!rowsMap.has(seat.row)) rowsMap.set(seat.row, [])
      rowsMap.get(seat.row).push(seat)
    })

    const sortedRows = Array.from(rowsMap.keys()).sort()
    
    return (
      <div className="mt-8 border rounded-lg p-6 bg-muted/30 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4 text-center">Stage / Screen</h3>
        <div className="flex flex-col gap-2 items-center">
          {sortedRows.map(rowLetter => {
            const rowSeats = rowsMap.get(rowLetter).sort((a: any, b: any) => a.number - b.number)
            return (
              <div key={rowLetter} className="flex gap-2 items-center">
                <span className="w-6 font-mono font-bold text-sm text-center">{rowLetter}</span>
                <div className="flex gap-1">
                  {rowSeats.map((seat: any) => {
                    const ticketType = ticketTypes.find(t => t.id === seat.ticketTypeId)
                    let bg = "bg-primary"
                    if (seat.status === "BOOKED") bg = "bg-destructive"
                    else if (seat.status === "HELD") bg = "bg-yellow-500"
                    
                    return (
                      <div 
                        key={seat.id} 
                        className={`w-6 h-6 rounded-t-lg ${bg} text-[8px] flex items-center justify-center text-primary-foreground font-bold`}
                        title={`${seat.label} - ${ticketType?.name || 'Unknown'}`}
                      >
                        {seat.number}
                      </div>
                    )
                  })}
                </div>
                <span className="w-6 font-mono font-bold text-sm text-center">{rowLetter}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-6 border-t">
      <div>
        <h2 className="text-xl font-semibold">Seat Layout Generator</h2>
        <p className="text-muted-foreground text-sm">Design your seating arrangement and assign ticket types to rows.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="rows"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Rows</FormLabel>
                  <FormControl><Input type="number" disabled={hasBookedOrHeld} {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="seatsPerRow"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seats Per Row</FormLabel>
                  <FormControl><Input type="number" disabled={hasBookedOrHeld} {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Row Assignments</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ startRow: 1, endRow: 1, ticketTypeId: ticketTypes[0]?.id || "" })} disabled={hasBookedOrHeld || ticketTypes.length === 0}>
                <Plus className="w-4 h-4 mr-2" /> Add Assignment
              </Button>
            </div>
            
            {ticketTypes.length === 0 && (
              <p className="text-sm text-destructive">Please create at least one ticket type first.</p>
            )}

            {fields.map((item, index) => (
              <div key={item.id} className="flex gap-4 items-end">
                <FormField
                  control={form.control}
                  name={`mappings.${index}.startRow`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Start Row</FormLabel>
                      <FormControl><Input type="number" disabled={hasBookedOrHeld} {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`mappings.${index}.endRow`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>End Row</FormLabel>
                      <FormControl><Input type="number" disabled={hasBookedOrHeld} {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`mappings.${index}.ticketTypeId`}
                  render={({ field }) => (
                    <FormItem className="flex-[2]">
                      <FormLabel>Ticket Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={hasBookedOrHeld}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select ticket type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ticketTypes.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" variant="ghost" size="icon" className="mb-0.5" onClick={() => remove(index)} disabled={hasBookedOrHeld || fields.length === 1}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <Button type="submit" disabled={isPending || hasBookedOrHeld || ticketTypes.length === 0} className="w-full">
            {isPending ? "Generating..." : "Generate Seat Layout"}
          </Button>
          {hasBookedOrHeld && (
            <p className="text-sm text-destructive text-center mt-2">
              Layout cannot be regenerated because some seats are already held or booked.
            </p>
          )}
        </form>
      </Form>

      {generatePreview()}
    </div>
  )
}
