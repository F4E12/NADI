# NADI

The operational record for a single **Posko** — an evacuation post — running with
no internet. One laptop serves the site over its own local network; volunteers
reach it from their phones with no install and no connectivity.

# About NADI

## Inspiration

When a natural disaster strikes, the first 72 hours are the most critical for survival. However, this is exactly when communication infrastructure collapses. Rescuers and volunteers are forced to rely on chaotic paper trails, whiteboards, and guesswork to manage thousands of panicked survivors, distribute dwindling food supplies, and locate missing persons. We realized that existing disaster tech assumes the presence of 4G or Starlink, which is a luxury in remote or severely impacted rural areas. This inspired us to create an autonomous digital system that acts as a central command center without requiring a single byte of cloud data and online connection.

## What it does

*NADI* is a 100% offline, local-network disaster management platform that transforms a standard volunteer's laptop into a powerful system to manage aid and help in natural disasters.

* *Survivor Portal:* The moment refugees connect to the local Wi-Fi, they are greeted not by complex forms, but an offline portal containing vital survival guides, first-aid protocols, and camp broadcast information.
* *Visual Triage & Intake:* Using local facial recognition via a webcam, NADI identifies survivors, pulls up their pre-seeded medical history, and automatically updates their status from "Missing" to "Safe."
* *Command Center Heatmap:* The dashboard visualizes the refugee camp. Tents light up in red if they house highly vulnerable individuals (e.g., asthmatic or diabetic patients), allowing medical teams to prioritize their rounds.
* *QR Nutrition Wallet (Dompet Gizi):* To answer the critical food distribution challenge, each family unit receives a QR code. The system automatically calculates their nutritional needs based on demographic data, ensuring high-protein supplies are strictly reserved for tents with toddlers or pregnant women.
* *Passive Proof of Life (Smart Ledger):* Food and medical distribution are linked to the survivor's profile. When a survivor receives rations, the system strictly logs the transaction to prevent hoarding and simultaneously updates their "Last Seen" timestamp and location, passively tracking missing persons without extra administrative work.
* *Utilizing AI Extraction:* Utilizing a local AI model, the system can extract key symptoms parsed from natural language to database data format.
* *Asynchronous Export:* Once the volunteer leaves the zero-internet zone, a one-click export generates a highly compressed, unified JSON/CSV SAR report ready to be securely transmitted to headquarters.

## How we built it

* *The Core App:* We utilized *Next.js* with *TypeScript* and *Tailwind CSS* to build a high-performance frontend. Also made with shadcn/ui for cleanly designed UI.
* *Database & State:* We used *SQLite* paired with *Prisma ORM* to ensure absolute type safety and transactional integrity for the logistics ledger.
* *The Network Bypass:* We tweaked mobile hotspot settings and utilized IP binding (0.0.0.0) to create a local Captive Portal, allowing anyone with a smartphone to access the Next.js app via a local IP address without internet.

## Challenges we ran into

Operating in a strictly zero-internet environment forced us to rethink standard web development. Overcoming network restrictions that naturally want to disable hotspots when disconnected from the WAN was a major hurdle. Figuring out this initial connection orchestration was the main challenge to achieve the system we're looking to make.

## Accomplishments that we're proud of

We successfully proved that high-level operational software does not need the cloud to function. We are proud of being able to simulate local hotspot connection between a local server with devices such as phones, allowing users to access the system without the internet. This serves as a baseline proof that tools and services that run locally can still be used wirelessly with the absence of proper or stable connection.

## What we learned

Developing for extreme edge cases completely rewires how you approach software architecture. We learned that not every "smart" application requires a massive LLM; sometimes, structured constraint satisfaction algorithms and local computer vision are far more practical and powerful. Coordinating the flow of data between disparate local services reinforced the importance of strict data typing and immutable ledger principles in maintaining system integrity during chaotic deployments.

## What's next for NADI

Our immediate next step is integrating an offline RAG (Retrieval-Augmented Generation) "Survival Bot" using quantized local models like Ollama, allowing survivors to query emergency first-aid protocols from their phones. Furthermore, we plan to implement "Agri-Pulse", a feature that allows the system to absorb surviving crops from local farmers into the camp's supply chain, creating an emergency circular economy.

# Developer Guide

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
