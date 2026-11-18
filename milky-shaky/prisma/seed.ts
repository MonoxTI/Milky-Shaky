import { PrismaClient, Role, SettingType } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// PLACEHOLDER values: the spec gives no prices, discount numbers,
// or restaurant details. Confirm these with the client and update them
// in the admin screens (or edit this file) before going live.

const flavours = [
  { name: "Strawberry", priceCents: 1500 },
  { name: "Vanilla", priceCents: 1500 },
  { name: "Chocolate", priceCents: 1500 },
  { name: "Coffee", priceCents: 1500 },
  { name: "Banana", priceCents: 1500 },
  { name: "Oreo", priceCents: 1800 },
  { name: "Bar one", priceCents: 1800 },
];

const consistencies = [
  { name: "Double thick", priceCents: 500 },
  { name: "Thick", priceCents: 300 },
  { name: "Milky", priceCents: 0 },
  { name: "Icy", priceCents: 200 },
];

const toppings = [
  { name: "Frozen Strawberries", priceCents: 1000 },
  { name: "Freeze-dried banana", priceCents: 1000 },
  { name: "Oreo crumbs", priceCents: 1000 },
  { name: "Bar one syrup", priceCents: 800 },
  { name: "Coffee powder with chocolate", priceCents: 800 },
  { name: "Chocolate vermicelli", priceCents: 800 },
];

// Values stored as strings; valueType tells the app how to parse them.
const settings: {
  key: string;
  value: string;
  valueType: SettingType;
  description: string;
}[] = [
  { key: "MAX_DRINKS_PER_ORDER", value: "10", valueType: SettingType.INT, description: "Maximum drinks in one order" },
  { key: "MIN_DRINKS_PER_ORDER", value: "1", valueType: SettingType.INT, description: "Minimum drinks in one order" },
  { key: "VAT_PERCENT", value: "15", valueType: SettingType.DECIMAL, description: "VAT rate (%)" },
  { key: "PREP_LEAD_MINUTES", value: "15", valueType: SettingType.INT, description: "Minimum minutes between ordering and pickup" },
  { key: "MAX_DISCOUNT_CENTS", value: "5000", valueType: SettingType.INT, description: "Maximum frequent customer discount per order (cents)" },
];

// Frequent customer discount tiers (placeholder rules from spec section 3.4.5)
const discountTiers = [
  { level: 1, minPriorOrders: 5, minDrinksPerOrder: 2, discountPercent: "5.00" },
  { level: 2, minPriorOrders: 10, minDrinksPerOrder: 2, discountPercent: "10.00" },
  { level: 3, minPriorOrders: 20, minDrinksPerOrder: 3, discountPercent: "15.00" },
];

async function main() {
  // Lookups: upsert on the unique name, and only set sortOrder on create,
  // so edits made in the admin screens survive re-seeding.
  for (const [i, f] of flavours.entries()) {
    await db.flavour.upsert({
      where: { name: f.name },
      update: {},
      create: { ...f, sortOrder: i + 1 },
    });
  }
  for (const [i, c] of consistencies.entries()) {
    await db.consistency.upsert({
      where: { name: c.name },
      update: {},
      create: { ...c, sortOrder: i + 1 },
    });
  }
  for (const [i, t] of toppings.entries()) {
    await db.topping.upsert({
      where: { name: t.name },
      update: {},
      create: { ...t, sortOrder: i + 1 },
    });
  }

  for (const s of settings) {
    await db.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  for (const tier of discountTiers) {
    await db.discountTier.upsert({
      where: { level: tier.level },
      update: {},
      create: {
        ...tier,
        discountPercent: tier.discountPercent,
      },
    });
  }

  // Placeholder pickup location. Replace with the real store details.
  await db.restaurant.upsert({
    where: { name: "Milky Shaky Irene" },
    update: {},
    create: {
      name: "Milky Shaky Irene",
      address: "Southdowns Office Park, Irene, Centurion",
      opensAt: "08:00",
      closesAt: "21:00",
    },
  });

  // Test accounts. Set SEED_PASSWORD in .env, or use the fallback below
  // for local development only.
  const password = process.env.SEED_PASSWORD ?? "Itumeleng1#";
  const passwordHash = await bcrypt.hash(password, 12);

  await db.user.upsert({
    where: { email: "itu@gmail.com" },
    update: {},
    create: {
      firstName: "Manager",
      email: "itu@gmail.com",
      mobile: "+27671879515",
      passwordHash,
      role: Role.MANAGER,
    },
  });

  await db.user.upsert({
    where: { email: "itumonokoane84@gmail.com" },
    update: {},
    create: {
      firstName: "Client",
      email: "itumonokoane84@gmail.com",
      mobile: "+27123456789",
      passwordHash,
      role: Role.CLIENT,
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());