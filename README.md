# Budget Tracker

A local-first monthly budget tracker for expenses. Every limit and transaction
lives in `localStorage` in your browser — there is no account, server, or sync.
Export a CSV from **Settings** whenever you want a backup.

## Features

- **Dashboard** — monthly budget total, spending, remaining amount, daily pace,
  spending by category (donut), per-category budget progress, and a six-month
  spend-versus-budget trend.
- **Transactions** — add, edit, and delete expenses for the selected month;
  search by note, date, or category; filter by category; sort by date or amount.
- **Budgets** — one recurring monthly limit per category. Limits repeat every
  month; leave the field empty for no limit. Clearing a limit leaves the
  category and its spend in place.
- **Settings** — currency, light/dark/system theme, category management
  (icon, name, color), CSV export/import, and a full data reset.
- **Refunds** — enter a negative amount (or import a negative value) to reduce
  the category total.
- **Mobile** — sidebar collapses into a bottom navigation bar; the layout is
  usable down to 320px wide.

## Getting started

```bash
pnpm install
pnpm dev
```

Then open the printed URL (defaults to http://localhost:5173).

## Scripts

| Script            | What it does                       |
| ----------------- | ---------------------------------- |
| `pnpm dev`        | Start the Vite dev server          |
| `pnpm build`      | Type-check and build for production |
| `pnpm preview`    | Serve the production build locally |
| `pnpm test`       | Run the Vitest suite once          |
| `pnpm test:watch` | Run Vitest in watch mode           |
| `pnpm lint`       | Lint with oxlint                   |

## How data is stored

State is a single JSON document under the `budget-tracker:v1` key:

```json
{
  "version": 1,
  "currency": "USD",
  "theme": "system",
  "categories": [{ "id": "groceries", "name": "Groceries", "color": "#10b981", "icon": "🛒" }],
  "budgets": { "groceries": 40000 },
  "transactions": [
    {
      "id": "…",
      "date": "2026-11-02",
      "amountCents": 1850,
      "categoryId": "groceries",
      "note": "Coffee beans"
    }
  ]
}
```

Amounts are integer cents, so sums never drift from floating point rounding. A
budget value is the monthly limit in cents; categories without an entry have no
limit.

The stored document is validated on load. Unknown fields are dropped, bad
transactions are ignored, and unreadable JSON falls back to a fresh seed with a
notice instead of crashing the app.

## CSV import and export

Export writes `date,category,amount,note` — one row per transaction, with
`amount` in major units and refunds as negative numbers.

Import accepts that same shape back, plus common bank exports:

- A header row is detected automatically. Recognized columns include `date`,
  `category`, `amount`, `note`/`description`/`memo`, `type`, and separate
  `debit`/`credit` columns.
- Without a header, the first four columns are read as date, category, amount,
  note.
- Rows with `type` income/credit are skipped, because this tracker records
  expenses only. Negative amounts remain refunds.
- Unknown categories can be created during import; otherwise those rows land in
  “Other”.
- Each bad row is reported with its line number and reason; valid rows still
  import. The dialog shows a preview before anything is written.

## Project layout

```
src/
  components/ui/   Buttons, cards, fields, dialog, toast, month picker, icons
  features/        dashboard, transactions, budgets, settings pages
  lib/             money, date, CSV, selectors, storage, hash routing
  store/           reducer, provider, month context
  types.ts         Shared data types
```

Routing is hash-based (`#/dashboard`, `#/transactions`, `#/budgets`,
`#/settings`), so the built app works from any static file host without server
rewrites.

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Recharts · Vitest · oxlint

## Notes

- The monthly limit is recurring: the same limit applies to every month, past
  and future. There are no per-month overrides.
- Only expenses are tracked. Income is deliberately out of scope.
- Deleting a category moves its transactions to another category and removes
  its limit.
