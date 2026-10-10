# EventHub



🚀 Live Demo: https://event-hub-psi-three.vercel.app/



EventHub is a modern event management and ticketing platform built with Next.js, Prisma, and PostgreSQL. It supports multi-role access for attendees, organizers, and managers, featuring manual UPI payments with UTR verification for ticket purchases.

## Features

- **Multi-Role System:** Secure access for Attendees, Organizers, and Managers.
- **Event Management:** Create, edit, and publish events with custom ticketing tiers.
- **Ticketing & Inventory:** Real-time seat holds and precise inventory tracking.
- **Manual UPI Payments:** Built-in checkout flow allowing attendees to scan an organizer's UPI QR code and submit a UTR reference for manual verification.
- **Manager Dashboard:** Tools for reviewing, approving, rejecting, and republishing events.
- **Organizer Dashboard:** Track ticket sales, verify incoming UPI payments, and manage events.

## Tech Stack

- **Framework:** [Next.js 15+](https://nextjs.org/) (App Router, Server Actions)
- **Database:** [PostgreSQL](https://www.postgresql.org/) (hosted on Supabase)
- **ORM:** [Prisma](https://www.prisma.io/)
- **UI:** [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), and [shadcn/ui](https://ui.shadcn.com/)
- **Authentication:** NextAuth.js

## Getting Started

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your database credentials:
   ```bash
   cp .env.example .env
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Migrations

This project uses Prisma. To sync the database schema:

```bash
npx prisma db push
```

## License

This project is licensed under the MIT License.
