import { z } from "zod"

export const ticketTypeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Ticket name is required"),
  price: z.coerce.number().min(0, "Price must be non-negative"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
});

export const manageTicketTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  priceRupees: z.coerce.number().min(0, "Price cannot be negative"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  saleStart: z.coerce.date(),
  saleEnd: z.coerce.date(),
}).refine(data => data.saleEnd > data.saleStart, {
  message: "Sale end must be after sale start",
  path: ["saleEnd"]
});

export const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  city: z.string().min(1, "City is required"),
  venueName: z.string().min(1, "Venue Name is required"),
  address: z.string().min(1, "Address is required"),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  bannerUrl: z.string().optional(),
  hasSeating: z.boolean().default(false),
  tickets: z.array(ticketTypeSchema).min(1, "At least one ticket type is required")
}).refine(data => data.startsAt > new Date(), {
  message: "Start date must be in the future",
  path: ["startsAt"]
}).refine(data => data.endsAt > data.startsAt, {
  message: "End date must be after start date",
  path: ["endsAt"]
});

export const seatLayoutSchema = z.object({
  rows: z.number().min(1).max(50),
  seatsPerRow: z.number().min(1).max(100),
  mappings: z.array(z.object({
    startRow: z.number().min(1),
    endRow: z.number().min(1),
    ticketTypeId: z.string()
  }))
});
