## Inspiration

When a natural disaster strikes, the first 72 hours are the most critical for survival. However, this is exactly when communication infrastructure collapses. Rescuers and volunteers are forced to rely on chaotic paper trails, whiteboards, and guesswork to manage thousands of panicked survivors, distribute dwindling food supplies, and locate missing persons. We realized that existing disaster tech assumes the presence of 4G or Starlink, which is a luxury in remote or severely impacted rural areas. This inspired us to create an autonomous digital system that acts as a central command center without requiring a single byte of cloud data and online connection.

## What it does

*NADI* is a 100% offline, local-network disaster management platform that transforms a standard volunteer's laptop into a powerful system to manage aid and help in natural disasters.

* *Visual Triage & Intake:* Survivors don't need IDs or QR codes. Using local facial recognition via a webcam, NADI identifies survivors, pulls up their pre-seeded medical history, and automatically updates their status from "Missing" to "Safe."
* *Command Center Heatmap:* The dashboard visualizes the refugee camp. Tents light up in red if they house highly vulnerable individuals (e.g., asthmatic or diabetic patients), allowing medical teams to prioritize their rounds.
* *Passive Proof of Life (Smart Ledger):* Food and medical distribution are linked to the survivor's profile. When a survivor receives rations, the system strictly logs the transaction to prevent hoarding and simultaneously updates their "Last Seen" timestamp and location, passively tracking missing persons without extra administrative work.
* *Asynchronous Export:* Once the volunteer leaves the zero-internet zone, a one-click export generates a highly compressed, unified JSON/CSV SAR report ready to be securely transmitted to headquarters.
**Automatic Distribution System:** Nutrition are automatically calculated and distributed to all tents and survivor's families, accounting for cases such as pregnant women or toddlers.

## How we built it

* *The Core App:* We utilized *Next.js* with *TypeScript* and *Tailwind CSS* to build a high-performance frontend. Also made with shadcn/ui for cleanly designed UI.
* *Database & State:* We used *SQLite* paired with *Prisma ORM* to ensure absolute type safety and transactional integrity for the logistics ledger.
* *The Network Bypass:* We utilized mobile hotspot settings and IP binding (0.0.0.0) to create a local Captive Portal, allowing anyone with a smartphone to access the Next.js app via a local IP address without internet.

## Challenges we ran into

Operating in a strictly zero-internet environment forced us to rethink standard web development. Overcoming network restrictions that naturally want to disable hotspots when disconnected from the WAN was a major hurdle. Figuring out this initial connection orchestration was the main challenge to achieve the system we're looking to make.

## Accomplishments that we're proud of

We successfully proved that high-level operational software does not need the cloud to function. We are proud of being able to simulate local hotspot connection between a local server with devices such as phones, allowing users to access the system without the internet. This serves as a baseline proof that tools and services that run locally can still be used wirelessly with the absence of proper or stable connection.

## What we learned

Developing for extreme edge cases completely rewires how you approach software architecture. We learned that not every "smart" application requires a massive LLM; sometimes, structured constraint satisfaction algorithms and local computer vision are far more practical and powerful. Coordinating the flow of data between disparate local services reinforced the importance of strict data typing and immutable ledger principles in maintaining system integrity during chaotic deployments.

## What's next for NADI

Our immediate next step is integrating an offline RAG (Retrieval-Augmented Generation) "Survival Bot" using quantized local models like Ollama, allowing survivors to query emergency first-aid protocols from their phones.
