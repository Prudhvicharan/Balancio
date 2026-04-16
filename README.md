<div align="center">

<br />

```
██████╗  █████╗ ██╗      █████╗ ███╗   ██╗ ██████╗██╗ ██████╗
██╔══██╗██╔══██╗██║     ██╔══██╗████╗  ██║██╔════╝██║██╔═══██╗
██████╔╝███████║██║     ███████║██╔██╗ ██║██║     ██║██║   ██║
██╔══██╗██╔══██║██║     ██╔══██║██║╚██╗██║██║     ██║██║   ██║
██████╔╝██║  ██║███████╗██║  ██║██║ ╚████║╚██████╗██║╚██████╔╝
╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝╚═╝ ╚═════╝
```

### Know what you're owed. Keep it simple.

**A beautiful, mobile-first app to track money you lend to friends — with automatic cloud sync across all your devices.**

<br />

[![Live Demo](https://img.shields.io/badge/Live%20Demo-balancio--tawny.vercel.app-7c6af7?style=for-the-badge&logo=vercel&logoColor=white)](https://balancio-tawny.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js%2016-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20v4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

<br />

</div>

---

## ✦ What is Balancio?

Balancio is a **personal debt tracker** built for real-world use. Lent money for dinner? Split a trip with friends? Covered someone's bill? Balancio keeps a clear, running record of every transaction — who owes you, how much, and why.

No spreadsheets. No mental math. Just open the app and know exactly where you stand.

---

## ✦ Features

### 📱 Mobile-First PWA
Designed from the ground up for phones. Add it to your home screen from any browser — it works like a native app with no App Store required.

### 👥 Per-Contact Tracking
Each person in your life gets their own profile. See their running balance, full transaction history, and net position at a glance.

### ⚡ Smart Parser
Type transactions the way you'd say them out loud:
```
lent 500 to alex for dinner last night
received 200 from raj birthday money
paid 1500 for suresh concert tickets
```
Balancio parses the amount, type, date, and notes automatically — add multiple transactions in one go.

### ☁️ Seamless Cloud Sync
Sign in once and your data syncs across every device you own. Add a contact on your phone, see it on your laptop instantly. Sign in on a new device — everything is already there.

### 📊 Shareable Reports
Generate a clean, formatted summary for any contact — perfect for settling up or keeping a shared record. One tap to copy and send.

### 🔒 Private by Design
Every account is fully isolated using Supabase Row-Level Security. You can only ever read and write your own data, nothing else.

### 💳 Multiple Payment Methods
Track how money moved — Cash, Bank Transfer, UPI, Card, Cheque, or Other. Filter and sort transactions any way you need.

---

## ✦ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 + CSS Variables |
| **State** | [Zustand](https://zustand-demo.pmnd.rs/) with localStorage persistence |
| **Backend / Auth** | [Supabase](https://supabase.com) (PostgreSQL + Row-Level Security) |
| **Deployment** | [Vercel](https://vercel.com) |
| **UI Components** | Radix UI primitives + custom design system |

---

## ✦ Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone the repo

```bash
git clone https://github.com/Prudhvicharan/Balancio.git
cd Balancio
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> The app runs fully offline without Supabase — you just won't have cloud sync.

### 3. Set up the database

Run the SQL schema in your Supabase SQL Editor:

```sql
-- Friends table
create table friends (
  id text primary key,
  user_id uuid references auth.users not null,
  name text not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Transactions table
create table transactions (
  id text primary key,
  user_id uuid references auth.users not null,
  friend_id text references friends(id) on delete cascade,
  type text check (type in ('lent', 'received')) not null,
  amount numeric not null,
  date date not null,
  payment_method text not null,
  note text,
  created_at timestamptz default now()
);

-- Row-Level Security
alter table friends enable row level security;
alter table transactions enable row level security;

create policy "Users manage own friends" on friends
  for all using (auth.uid() = user_id);

create policy "Users manage own transactions" on transactions
  for all using (auth.uid() = user_id);
```

### 4. Configure Supabase Auth

In your Supabase dashboard:
- **Authentication → URL Configuration → Site URL**: your Vercel URL (or `http://localhost:3000` for local dev)
- **Redirect URLs**: add `https://your-domain.com/auth/callback`

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## ✦ Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Prudhvicharan/Balancio)

Add the two environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in your Vercel project settings, then deploy.

### Email Setup (Recommended)

Supabase's built-in email is rate-limited to ~4/hour. For production, plug in a free [Resend](https://resend.com) SMTP:

- Host: `smtp.resend.com` / Port: `465`
- Username: `resend` / Password: your `re_xxxxxx` API key

---

## ✦ Project Structure

```
src/
├── app/
│   ├── page.tsx              # Dashboard — contacts list + stats
│   ├── friends/[id]/         # Contact detail + transaction history
│   ├── report/[id]/          # Shareable report page
│   ├── settings/             # Account + cloud sync
│   └── auth/callback/        # Supabase auth redirect handler
├── components/
│   ├── dashboard/            # StatsCards, FriendCard
│   ├── friends/              # FriendModal
│   ├── transactions/         # TransactionModal, SmartParserModal, TransactionItem
│   ├── providers/            # ClientProvider (auth + auto-sync engine)
│   └── ui/                   # Button, Input, Modal, Badge, Toast
├── lib/
│   ├── supabase.ts           # Auth + cloud sync functions
│   ├── utils.ts              # Financial calculations, formatters
│   └── parser.ts             # Natural language transaction parser
├── stores/
│   └── useStore.ts           # Zustand store with localStorage persistence
└── types/
    └── index.ts              # TypeScript types (Friend, Transaction)
```

---

## ✦ How Sync Works

Balancio uses a **local-first, cloud-backed** architecture:

1. **Guest mode** — All data lives in `localStorage`. Instant, offline-capable.
2. **Sign in** — On first login, local data migrates to the cloud. On subsequent logins (new device), cloud data loads automatically.
3. **Mutations** — Every add/edit/delete auto-syncs to Supabase within 2 seconds (debounced).
4. **Sign out** — Local state is cleared. The next user starts fresh.

Account switching is fully isolated — sign in as a different account and only that account's data loads.

---

## ✦ License

MIT — do whatever you want with it.

---

<div align="center">
  <br />
  Built with ♥ by <a href="https://github.com/Prudhvicharan">Prudhvi Charan</a>
  <br /><br />
  <a href="https://balancio-tawny.vercel.app">balancio-tawny.vercel.app</a>
</div>
