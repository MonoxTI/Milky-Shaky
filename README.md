# Milky Shaky Ordering Platform

Online ordering for Milky Shaky custom milkshakes. Patrons build their drinks, choose a restaurant and pickup time, and pay online. Managers run the menu, pricing, discounts, users, reports and the audit trail.

**Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui, PostgreSQL (Neon), Prisma 6, Auth.js, Zod, Paystack, Resend, Vitest.

---

## 1. Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node.js | 22 LTS (20.9 or newer works) | `node -v` |
| npm | Comes with Node | `npm -v` |
| Git | Any recent version | `git --version` |

You also need accounts for:

- **Neon** (PostgreSQL database): https://console.neon.tech
- **Paystack** (test mode): https://dashboard.paystack.com
- **Resend** (email): https://resend.com

---

## 2. Get the code

```bash
git clone <your-repository-url>
cd milky-shaky
npm install
```

If `npm install` reports a peer dependency conflict, run it again with:

```bash
npm install --legacy-peer-deps
```

---

## 3. Create the database

1. Sign in to Neon and create a project. Choose the region closest to your users (for South Africa, **AWS af-south-1 (Cape Town)**).
2. Open the **development** branch (create one from the default branch if it doesn't exist). Use a separate branch for local work so test data never reaches production.
3. Click **Connect** and copy two connection strings:
   - **Pooled connection** (toggle on): contains `-pooler` in the host.
   - **Direct connection** (toggle off): no `-pooler`.

---

## 4. Configure environment variables

Create a file called `.env` in the project root. It is ignored by Git, so your secrets stay on your machine.

```env
# Database (Neon)
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@ep-xxxx.REGION.aws.neon.tech/neondb?sslmode=require"

# Auth.js (generate with: openssl rand -base64 32)
AUTH_SECRET="replace-with-a-32-plus-character-random-string"
AUTH_URL="http://localhost:3000"

# Public address of the site, used in payment return links
APP_URL="http://localhost:3000"

# Paystack (test key starts with sk_test_)
PAYSTACK_SECRET_KEY="sk_test_xxxxxxxx"

# Resend (email)
RESEND_API_KEY="re_xxxxxxxx"
EMAIL_FROM="Milky Shaky <onboarding@resend.dev>"

# Optional: password for the seeded test accounts (defaults to ChangeMe123!)
# SEED_PASSWORD="choose-your-own-password"
```

Notes:

- `onboarding@resend.dev` only delivers to the email address on your Resend account. Verify a domain in Resend before sending to real customers.
- Never commit `.env` or paste its contents into chat, tickets or screenshots.

---

## 5. Set up the database schema and data

Run these from the project root:

```bash
npx prisma migrate deploy   # creates all tables
npx prisma generate         # builds the Prisma client
npx prisma db seed          # loads menu items, settings, discount tiers and test accounts
```

You should see `Seed complete.` at the end.

To inspect the data at any time:

```bash
npx prisma studio
```

Use `npx prisma migrate dev` only when you change `prisma/schema.prisma` and need to create a new migration. Don't run `prisma migrate reset` on a database with data you want to keep, because it deletes everything.

---

## 6. Run the app

```bash
npm run dev
```

Open http://localhost:3000.

### Test accounts (from the seed)

| Role | Email | Password | Lands on |
|---|---|---|---|
| Manager | `manager@milkyshaky.test` | `ChangeMe123!` (or your `SEED_PASSWORD`) | `/admin` |
| Client | `client@milkyshaky.test` | `ChangeMe123!` (or your `SEED_PASSWORD`) | `/order` |

Change or delete these accounts before using the app with real customers.

### Test a payment

Use Paystack's test card:

- Card number: `4084 0840 8408 4081`
- CVV: `408`
- Any future expiry date
- PIN `0000` if asked, OTP `123456`

---

## 7. Receive payment webhooks locally (optional)

Paystack only sends payment notifications to a public HTTPS address. For local testing, use a tunnel such as ngrok:

```bash
ngrok http 3000
```

Then in the Paystack dashboard (test mode), go to **Settings → API Keys & Webhooks** and set the webhook URL to:

```
https://<your-ngrok-address>/api/webhooks/paystack
```

The return page confirms payments directly with Paystack, so the app still works without the tunnel. The webhook covers cases where a customer closes the browser before returning.

---

## 8. Common scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the development server with hot reload |
| `npm run build` | Generates the Prisma client and builds for production |
| `npm run start` | Runs the production build locally (run `npm run build` first) |
| `npm test` | Runs the unit tests |
| `npx tsc --noEmit` | Type-checks the project without building |
| `npx prisma studio` | Opens a visual browser for the database |

---

## 9. Project structure

```
prisma/              Database schema, migrations and seed script
src/
  app/               Pages and API routes
    (auth)/          Login, sign-up, post-login routing
    (patron)/        Home, ordering, order history, payment return
    (admin)/admin/   Dashboard, lookups, settings, discounts, users, reports
    api/             Auth, Paystack webhook, CSV export
  components/        Reusable UI (forms, navbar, admin and report widgets)
  features/          Business logic, shared by every screen
    orders/          Order creation, pricing inputs, pickup rules
    payments/        Paystack checkout, verification and webhook logic
    discounts/       Frequent customer discount rules
    lookups/         Flavours, toppings, consistency options
    settings/        Configurable values (VAT, drink limits, lead time)
    users/           Staff accounts and deactivation
    reports/         Dashboard, orders, trends and audit queries
    email/           Confirmation and receipt emails
    audit/           Change history helpers
    security/        Rate limiting
  lib/               Database client, auth, environment checks, money helpers
tests/unit/          Unit tests for pricing, rules, payments and rate limits
```

---

## 10. Roles and permissions

- **Client:** create an account, build and pay for orders, view their own order history.
- **Manager:** everything a client can do, plus the management area (dashboard, lookups, settings, discounts, users, reports and audit trail).

Access is checked on the server for every protected page and export. Managers can't deactivate their own account, and the last active manager can't be deactivated.

---

## 11. Troubleshooting

| Problem | Fix |
|---|---|
| `Environment variable not found: DIRECT_URL` | Add `DIRECT_URL` to `.env`. Migrations need the direct connection string. |
| `P1001: Can't reach database server` | Check the host name and that the URL ends with `sslmode=require`. |
| `P1000: Authentication failed` | The database password is wrong. Reset it in the Neon console and update `.env`. |
| `prepared statement already exists` | `DATABASE_URL` is missing `&pgbouncer=true`. |
| Login says "Incorrect email or password" | Use the seed password, or check the account exists in Prisma Studio. |
| `Invalid environment variables` on start | A required value is missing or malformed. The error lists which one. |
| Pages show old content after a change | Stop the server, delete the `.next` folder, and run `npm run dev` again. |
| `304 Not Modified` in the browser | Harmless. The browser is reusing a cached copy of the page. |
| Emails don't arrive | Check the `EmailLog` table. While using `onboarding@resend.dev`, only the Resend account owner's address receives mail. |
| Payment webhook not received | Confirm the tunnel is running and the webhook URL in Paystack matches it exactly. |

---

## 12. Deployment

The app is designed for Vercel with the Neon **production** branch:

1. Import the repository into Vercel and leave the framework as Next.js.
2. Add all the variables from section 4 for the **Production** environment, using production values. Set `AUTH_URL` and `APP_URL` to your live address.
3. Run migrations against the production database only: `npx prisma migrate deploy`, using the production connection strings.
4. Don't run the seed against production unless you intend to create the test accounts there. Change the default passwords first.
5. Set the Paystack webhook to `https://<your-domain>/api/webhooks/paystack`.

Use Paystack live keys only after the business is verified with Paystack and the launch has been approved.

---

## 13. Security checklist before launch

- [ ] Change or remove the seeded test accounts.
- [ ] Use a unique `AUTH_SECRET` for production.
- [ ] Rotate any database password that has been shared in chat, email or screenshots.
- [ ] Verify a sending domain in Resend and update `EMAIL_FROM`.
- [ ] Switch Paystack to live keys only after verification.
- [ ] Confirm the client has approved prices, discount tiers, VAT rounding and restaurant details.
