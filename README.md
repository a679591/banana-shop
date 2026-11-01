# Baked by Erin 🧁

An EmDash CMS shop on Cloudflare Workers for **bakedbyerin.com** — customers order
online and pay cash on pickup. Based on the `banana-shop` EmDash template.

## Stack

- [EmDash](https://emdashcms.com) — Astro-native CMS (`emdash@1.4.0`)
- Astro 7 with the Cloudflare adapter (`output: server`)
- Cloudflare Workers + D1 (database) + R2 (photos/media)
- A sandboxed **catalog-manager** plugin so staff can add products without the full editor

## What you need first

1. A Cloudflare account (free works; the catalog-manager plugin needs **Workers Paid**, see note below).
2. **bakedbyerin.com added to that Cloudflare account** as a zone, with the
   nameservers at your registrar pointed to Cloudflare. The custom-domain deploy
   fails until the zone is active.
3. Node 20+ and pnpm (`npm i -g pnpm`).

## Step 1 — Install and log in

```bash
pnpm install
npx wrangler login
```

## Step 2 — Create the database and storage (one time)

```bash
# Production
npx wrangler d1 create baked-by-erin
npx wrangler r2 bucket create baked-by-erin-media

# Previews (separate, so test orders never reach the real shop)
npx wrangler d1 create baked-by-erin-preview
npx wrangler r2 bucket create baked-by-erin-preview-media
```

Each `d1 create` prints a `database_id`. Paste them into `wrangler.jsonc`:

- `REPLACE_WITH_PROD_D1_ID` → ID from `baked-by-erin`
- `REPLACE_WITH_PREVIEW_D1_ID` → ID from `baked-by-erin-preview`

## Step 3 — Try it locally

```bash
pnpm dev                                   # http://localhost:4321
                                           # admin: http://localhost:4321/_emdash/admin
npx emdash seed seed/seed.json --validate  # loads sample products
```

The sample products are still the template's breads and granola — swap them for
Erin's menu in the admin, or edit `seed/seed.json` before seeding.

## Step 4 — Secrets and first deploy

```bash
npx wrangler secret put EMDASH_ENCRYPTION_KEY   # value: output of `npx emdash secrets generate`
npx wrangler secret put EMDASH_AUTH_SECRET      # value: output of `openssl rand -hex 32`
pnpm deploy                                     # creates the Worker + bakedbyerin.com and www
```

Preview Worker (optional):

```bash
CLOUDFLARE_ENV=preview pnpm build && npx wrangler deploy
npx wrangler secret put EMDASH_ENCRYPTION_KEY --name baked-by-erin-preview
npx wrangler secret put EMDASH_AUTH_SECRET    --name baked-by-erin-preview
```

Then visit https://bakedbyerin.com/_emdash/admin to create the admin account.

## Step 5 — Auto-deploy from GitHub (optional)

Cloudflare Dashboard → Workers → *worker* → Settings → Builds → Connect, and
point it at **your** repo.

**`baked-by-erin`** (production)
- Production branch: `main`
- Build command: `pnpm build`
- Deploy command: `npx wrangler deploy`
- Non-production branch builds: **off**

**`baked-by-erin-preview`** (branch previews)
- Build variable: `CLOUDFLARE_ENV=preview`
- Build command: `pnpm build`
- Deploy command: `npx wrangler versions upload`
- Non-production branch builds: **on**, deploy command `npx wrangler versions upload`

The Astro adapter picks the env from `CLOUDFLARE_ENV` at build time, so **don't**
pass `--env` to wrangler afterwards.

> **Note:** the catalog-manager plugin uses the Worker Loader binding
> (`worker_loaders`), which needs a Workers Paid plan. On the free plan, remove the
> `worker_loaders` lines from `wrangler.jsonc`; staff can still add products at
> `/_emdash/admin/content/products`.

## Orders

Orders live in the EmDash `orders` collection. Customers submit via
`POST /api/orders` (the total is recalculated from server-side prices). Staff
update `order_status` in the admin. Payment is cash on pickup.
