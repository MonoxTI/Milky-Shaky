import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { getMenu } from "@/features/menu/queries";
import { formatZAR } from "@/lib/money";

type MenuItem = { id: string; name: string; priceCents: number };

const STEPS = [
  { title: "Create an account", text: "Sign up in under a minute, or log in if you already have one." },
  { title: "Build your order", text: "Choose your drinks, a restaurant and a pickup time." },
  { title: "Pay online", text: "Pay securely. You'll get a confirmation and a receipt by email." },
  { title: "Collect and enjoy", text: "Pick up your milkshakes at the time you chose. No queue." },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl space-y-16 px-6 py-10">
      <section className="rounded-3xl bg-linear-to-br from-pink-100 via-white to-amber-100 px-8 py-16 text-center shadow-sm md:px-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Made to order</p>
        <h1 className="mx-auto mt-3 max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
          Custom milkshakes, ready when you are.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Build your perfect milkshake online, choose your pickup time and skip the queue.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/order"
            className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            Order a milkshake
          </Link>
          <a
            href="#menu"
            className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-card px-7 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            See the menu
          </a>
        </div>
      </section>

      <section id="menu" className="scroll-mt-24 space-y-8">
        <div className="space-y-2 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Our menu</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Start with any flavour, add a consistency and finish with a topping. Prices shown are added to each drink.
          </p>
        </div>
        <Suspense fallback={<MenuSkeleton />}>
          <MenuContent />
        </Suspense>
      </section>

      <section className="space-y-8">
        <h2 className="text-center text-3xl font-bold tracking-tight">How it works</h2>
        <ol className="grid gap-4 md:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}

// Reads the live menu from the database, so it's rendered at request time (required by cacheComponents).
async function MenuContent() {
  await connection();
  const menu = await getMenu();

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <MenuCard title="Flavours" note="Pick one" accent="bg-pink-400" items={menu.flavours} />
      <MenuCard title="Consistency" note="How thick?" accent="bg-amber-400" items={menu.consistencies} />
      <MenuCard title="Toppings" note="Finish it off" accent="bg-emerald-400" items={menu.toppings} />
    </div>
  );
}

function MenuSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
      ))}
    </div>
  );
}

function MenuCard({
  title,
  note,
  accent,
  items,
}: {
  title: string;
  note: string;
  accent: string;
  items: MenuItem[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className={`h-1.5 ${accent}`} />
      <div className="p-6">
        <div className="flex items-baseline justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <span className="text-xs text-muted-foreground">{note}</span>
        </div>
        {items.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Coming soon.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 py-3 text-sm">
                <span>{item.name}</span>
                <span className={item.priceCents === 0 ? "text-muted-foreground" : "font-medium"}>
                  {item.priceCents === 0 ? "Included" : `+${formatZAR(item.priceCents)}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}