# NADI

The operational record for a single **Posko** — an evacuation post — running with
no internet. One laptop serves the site over its own local network; volunteers
reach it from their phones with no install and no connectivity.

## Getting Started

```bash
npm install
npm run db:setup
npm run dev
```

`db:setup` runs the migrations, generates the Prisma client, and seeds a Posko
already mid-operation.

Open [http://localhost:3000](http://localhost:3000).

`db:setup` leaves you with ~1,000 Residents in coherent Households across twelve
Tents, a Dompet Gizi per Household, stock already allocated (with Tenda D close
to dry), and Complaints both open and confirmed. Every screen has something real
to render on first load — no manual data entry.

To start the Posko over, delete `prisma/posko.db` and run `db:setup` again. The
Transaction Log is append-only by construction — SQLite triggers refuse an update
or a delete — so it cannot be cleared in place.

## Layout

- `prisma/` — the schema, migrations, and the seeder. SQLite in WAL mode; the
  whole Posko is one file you could copy to a USB stick.
- `lib/rules/` — the rules engine, split by area: `entitlement`, `allocation`,
  `heat`. Plain domain data in, decisions out. **No module here holds a database
  client or issues a query.**
- `lib/db.ts` — data access. Owns the Prisma client and the WAL pragma.

## Checks

```bash
npm run typecheck
npm run lint
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
