# SwiftCent ⚡️

An enterprise-grade billing, invoicing, and payment processing platform built as a modern, clean, and high-performance alternative to Invoice Ninja.

---

## 🚀 Key Highlights

* **100% Exact Financial Math**: All monetary amounts are computed and stored in smallest integer units (cents) to eliminate floating-point rounding errors across line-item discounts, exclusive/inclusive taxes, and partial payments.
* **Point-in-Time Document Snapshotting**: Invoices preserve immutable snapshots of company branding, addresses, and client tax IDs at the exact moment of issue. Future client address changes never corrupt past invoices.
* **Strict Invoice State Machine**: Dispatched invoices follow an auditable lifecycle (`Draft` ➔ `Sent` ➔ `Viewed` ➔ `Partially Paid` ➔ `Paid` / `Overdue` / `Void`) with edit locks once sent.
* **Dual-Facing Portals**:
  * **Admin Dashboard**: Real-time receivables analytics, invoice builder, client directory, and payment manager.
  * **Public Client Portal**: Tokenized, distraction-free payment links where customers can view, print, or pay invoices online.
* **High-Fidelity Print & PDF Engine**: Custom print CSS styles that render pixel-perfect vector invoices for physical printing or PDF downloads.
* **MongoDB + Mongoose Data Layer**: Native document schema with embedded subdocuments for line items, snapshots, and immutable audit logs.

---

## 🛠 Tech Stack

* **Framework**: Next.js 16 (App Router) + React 19
* **Database**: MongoDB with Mongoose ODM
* **Styling**: Tailwind CSS v4 + Lucide Icons
* **Language**: TypeScript (strict mode)
* **Test Suite**: Native Node.js test runner (`node:test`, `node:assert/strict`) via `tsx`

---

## 📁 Project Architecture

```
swiftcent/
├── src/
│   ├── app/
│   │   ├── (admin)/                 # Protected merchant dashboard
│   │   │   ├── page.tsx             # Financial KPIs & recent activity
│   │   │   ├── invoices/            # Filterable invoice table
│   │   │   │   ├── new/page.tsx     # Dynamic invoice builder with live calculation
│   │   │   │   └── [id]/page.tsx    # Invoice detail, status transitions & payments
│   │   │   └── clients/page.tsx     # Client management & billing profiles
│   │   ├── portal/[token]/page.tsx  # Public client payment & PDF portal
│   │   ├── api/                     # REST endpoints
│   │   │   ├── invoices/            # CRUD & state machine triggers
│   │   │   ├── clients/             # Client management
│   │   │   ├── portal/[token]/      # Public tokenized access & 'viewed' tracking
│   │   │   └── voice/               # Gemini Live ephemeral session & catalog resolution
│   │   ├── globals.css              # Tailwind setup + print layout styles
│   │   └── layout.tsx
│   ├── engine/
│   │   ├── calculator.ts            # Integer cent calculation engine
│   │   └── state-machine.ts         # Lifecycle transition & lock rules
│   ├── models/
│   │   ├── Organization.ts          # Merchant profile & sequence generator
│   │   ├── Client.ts                # Customer billing records
│   │   ├── Invoice.ts               # Invoices with snapshots & audit trail
│   │   └── Payment.ts               # Transaction ledger
│   ├── services/
│   │   ├── invoice-service.ts       # Atomic numbering & lifecycle operations
│   │   ├── client-service.ts        # Client operations
│   │   └── organization-service.ts  # Merchant configuration
│   ├── types/
│   │   └── financial.ts             # Domain financial interfaces
│   └── lib/
│       └── mongodb.ts               # Cached connection handler
└── tests/
    └── calculator.test.ts           # Financial engine invariant unit tests
```

---

## ⚡️ Quick Start

### 1. Prerequisites
* **Node.js**: v20+ (v26 tested)
* **MongoDB**: A running MongoDB instance locally (`mongodb://127.0.0.1:27017/swiftcent`) or a free MongoDB Atlas URI.

### 2. Configure Environment
Copy `.env.example` to `.env.local` and set your variables (`MONGODB_URI`, `AUTH_SECRET`, and `GEMINI_API_KEY` for Voice Copilot):
```bash
cp .env.example .env.local
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser and register your workspace at `/login`.

---

## 🧪 Running Tests & Typechecks

Run the financial engine invariant unit tests:
```bash
npm test
```

Run TypeScript compilation check:
```bash
npm run typecheck
```

Build for production:
```bash
npm run build
```

