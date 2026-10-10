"use client"

import { useState, useTransition } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { manageTicketTypeSchema } from "@/lib/schemas"
import type { z } from "zod"
import { createTicketTypeAction, updateTicketTypeAction, deleteTicketTypeAction } from "@/actions/tickets"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit2, Trash2 } from "lucide-react"

type TicketInput = z.infer<typeof manageTicketTypeSchema>

export function TicketTypesManager({ eventId, initialTickets, hasSeating }: { eventId: string, initialTickets: any[], hasSeating: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const form = useForm<TicketInput>({
    resolver: zodResolver(manageTicketTypeSchema) as unknown as Resolver<TicketInput>,
    defaultValues: {
      name: "",
      priceRupees: 0,
      quantity: 100,
      saleStart: new Date(),
      saleEnd: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)
    }
  })

  function openCreate() {
    setEditingId(null)
    form.reset({
      name: "",
      priceRupees: 0,
      quantity: 100,
      saleStart: new Date(),
      saleEnd: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)
    })
    setIsOpen(true)
  }

  function openEdit(ticket: any) {
    setEditingId(ticket.id)
    form.reset({
      name: ticket.name,
      priceRupees: ticket.pricePaise / 100,
      quantity: ticket.quantity,
      saleStart: new Date(ticket.saleStart),
      saleEnd: new Date(ticket.saleEnd)
    })
    setIsOpen(true)
  }

  function onSubmit(data: TicketInput) {
    startTransition(async () => {
      let result
      if (editingId) {
        result = await updateTicketTypeAction(eventId, editingId, data)
      } else {
        result = await createTicketTypeAction(eventId, data)
      }

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(editingId ? "Ticket type updated" : "Ticket type created")
        setIsOpen(false)
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this ticket type?")) return
    startTransition(async () => {
      const result = await deleteTicketTypeAction(eventId, id)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Ticket type deleted")
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Ticket Types</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={<Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-2" /> Add Ticket Type</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Ticket Type" : "Add Ticket Type"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ticket Name</FormLabel>
                      <FormControl><Input placeholder="General Admission" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priceRupees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (₹)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl><Input type="number" disabled={hasSeating} {...field} /></FormControl>
                        {hasSeating && <p className="text-xs text-muted-foreground mt-1">Quantity is managed by seat layout.</p>}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="saleStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sale Start</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
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
                    name="saleEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sale End</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            value={field.value ? new Date(field.value.getTime() - field.value.getTimezoneOffset() * 60000).toISOString().slice(0,16) : ""}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? "Saving..." : "Save Ticket Type"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Sold</TableHead>
              <TableHead>Available</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialTickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">No ticket types created yet.</TableCell>
              </TableRow>
            ) : (
              initialTickets.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(t.pricePaise / 100)}
                  </TableCell>
                  <TableCell>{t.quantity}</TableCell>
                  <TableCell>{t.sold}</TableCell>
                  <TableCell>{t.quantity - t.sold}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)} disabled={isPending}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} disabled={isPending || t.sold > 0}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
