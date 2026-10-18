# Oppa Prints

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Neon Postgres](https://img.shields.io/badge/Neon-Postgres-00E599?logo=postgresql&logoColor=white)
![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2-F38020?logo=cloudflare&logoColor=white)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)

Guest-checkout online store for **Oppa Prints** ("You Think We Print"), a
Philippine print shop selling custom printed boxes, packaging, and UV DTF
stickers. Shoppers pick a product, choose options (size, color, personalized
text), check out without an account, and pay by GCash / BPI QR (uploading a
receipt) or cash on delivery. The shop owner manages products, variants, stock,
settings, and orders from a login-gated admin.

Next.js 16 (App Router) · React 19 · Neon Postgres · Cloudflare R2 · Tailwind v4.

Live site: [oppaprints.com](https://oppaprints.com)

## Run

Requires Node.js and a `.env.local` (copy `.env.example`, see below).

```bash
npm install
npm run seed     # one-time: creates tables + seeds 15 products
npm run dev      # http://localhost:3000
```

`npm run migrate` applies additive schema changes without wiping data.
`npm run seed` **drops and recreates** all tables (dev only). If a local
`product-images/` folder exists, seed converts and uploads those photos to R2;
otherwise it skips the upload and assumes the images are already in the bucket.

| script | what it does |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm start` | production build / serve |
| `npm run lint` | ESLint (`eslint-config-next`) |
| `npm run seed` | drop + recreate schema, seed the catalog |
| `npm run migrate` | idempotent additive migrations |
| `npm run build-options` | rebuild option groups/variants from `scripts/catalog.ts` |

There is no test runner. `npx tsx scripts/check-pricing.ts` is a small
assertion-based self-check for the pricing math.

## Environment (`.env.local`, gitignored — server-only, never bundled to client)

| var | purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `NEXT_PUBLIC_SITE_URL` | public origin, used for `metadataBase` / OG URLs (defaults to `http://localhost:3000`) |
| `R2_ENDPOINT` / `R2_BUCKET` / `R2_PREFIX` | Cloudflare R2 (S3 API). Objects live under `R2_PREFIX/` in the bucket |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | R2 credentials |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | admin login — **change these** (admin login is disabled while `ADMIN_PASSWORD` is unset) |
| `SESSION_SECRET` | signs the admin session cookie — **set a long random value**; rotate to log everyone out |

> `R2_PREFIX` lets the store share a bucket with other apps (e.g. a shared
> bucket with an `oppaprints/` key prefix). For a dedicated bucket, create it in
> R2, issue a token with access, set `R2_BUCKET` and leave `R2_PREFIX` empty.

## How it works

- **Options taxonomy** — each product has its own **ordered option groups**
  (e.g. Size → Color → Name), each with arbitrary values. A **variant** is one
  combination, with its own **stock, optional price override, weight, and image**.
  Fully DB-driven and admin-managed (`option_groups`, `option_values`,
  `variants`, `variant_options`). `npm run build-options` rebuilds the model for
  existing products from `scripts/catalog.ts`.
- **Storefront** (`/`) — 15 seeded products with a **hierarchical picker**: pick
  top group first; later groups cascade to only in-stock combinations. Product
  pages live at `/products/[slug]`. Cart is client-side.
- **Checkout** (`/checkout`) — guest only (name, phone, address). No account.
  Shipping is region-tiered (NCR / Luzon / Visayas / Mindanao) by total package
  weight; 12% VAT on goods can be toggled on or off by the admin.
- **Payment** — on the order page: GCash / BPI QR tabs (upload receipt) **or**
  Cash on Delivery (admin can disable COD). QR images: `public/qr2.jpeg` (GCash),
  `public/qr1.jpeg` (BPI).
- **Track order** (`/orders`) — look up by order number + phone; upload/replace
  receipt, switch to COD, and edit the delivery address.
- **Admin** (`/admin`) — login-gated. Dashboard with VAT / COD toggles; product
  create/edit (option groups, values, variants with stock / price / weight /
  image); product image add/delete/set-primary; order review (view receipt,
  confirm / reject / fulfill). Rejecting or cancelling returns stock to inventory.
- **Chat** — floating Messenger button → https://m.me/oppaprints.
- **Testimonials** — homepage reviews from the shop's Shopee storefront
  (`src/lib/testimonials.ts`).

## API (Next.js route handlers; DB + R2 stay server-side)

Public: `GET /api/config`, `POST /api/orders`, `POST /api/orders/lookup`,
`POST /api/orders/[num]/receipt|cod|address`, `GET /api/images/[...key]` (product images only).

Admin (session-guarded):
- `/api/admin/login|logout`, `/api/admin/settings`
- `/api/admin/orders/[num]/status|receipt`
- `/api/admin/products`, `/api/admin/products/[id]`,
  `/api/admin/products/[id]/images[/imageId]`,
  `/api/admin/products/[id]/groups[/groupId[/values[/valueId]]]`,
  `/api/admin/products/[id]/variants[/variantId]`
- `/api/admin/variants/[id]/stock|price|weight|image`

Product photos (HEIC included) are converted to resized WebP on upload and
served through `/api/images` so R2 stays private (no public bucket needed).
Receipts are served only through the admin-guarded route.

## Structure

```
src/app/          pages (storefront, cart, checkout, orders, admin) + API route handlers
src/components/   storefront UI; src/components/admin/ for admin managers/toggles
src/lib/          db, R2, auth, pricing, shipping, settings, queries, config
scripts/          seed, migrate, build-options, catalog, check-pricing
public/           logo + payment QR images
```

## License

[MIT](LICENSE) © 2026 Oppa Prints. The MIT license covers the code; the Oppa
Prints name and logo identify the project and shop.
