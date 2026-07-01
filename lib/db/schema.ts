import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  numeric,
  jsonb,
  timestamp,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Users (Sellflow merchants) ───────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name"),
  plan: text("plan").notNull().default("free"), // free | starter | pro
  role: text("role").notNull().default("merchant"), // merchant | admin (Sellflow staff)
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Shops ────────────────────────────────────────────────────────────────────

export const shops = pgTable(
  "shops",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(), // monostore → monostore.sellflow.app
    customDomain: text("custom_domain"),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("shops_slug_idx").on(t.slug),
    uniqueIndex("shops_custom_domain_idx").on(t.customDomain),
    index("shops_owner_idx").on(t.ownerId),
  ]
);

// ─── Shop config (per section, JSONB) ─────────────────────────────────────────
// keys: branding | home | menu | about | faq | terms | privacy |
//       checkout | delivery | popup | newsletter | integrations

export const shopConfig = pgTable(
  "shop_config",
  {
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    value: jsonb("value").notNull().default({}),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.shopId, t.key] })]
);

// ─── Categories ───────────────────────────────────────────────────────────────

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    visible: boolean("visible").notNull().default(true),
  },
  (t) => [index("categories_shop_idx").on(t.shopId)]
);

// ─── Products ─────────────────────────────────────────────────────────────────

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    oldPrice: numeric("old_price", { precision: 10, scale: 2 }),
    badge: text("badge"),
    rating: numeric("rating", { precision: 3, scale: 1 }).default("5.0"),
    reviews: integer("reviews").default(0),
    visible: boolean("visible").notNull().default(true),
    stock: integer("stock"), // null = nie śledzę stanu (nieograniczony); liczba = ilość
    shortDesc: text("short_desc"),
    description: text("description"),
    images: jsonb("images").notNull().default([]),   // string[]
    video: jsonb("video").default({}),               // { visible, type, embedUrl, fileUrl }
    colors: jsonb("colors").default([]),             // string[]
    sizes: jsonb("sizes").default([]),               // string[]
    benefits: jsonb("benefits").default([]),         // { label, desc }[]
    specs: jsonb("specs").default([]),               // { key, value }[]
    sizeChart: jsonb("size_chart").default([]),      // { eu, uk, us, cm }[]
    faq: jsonb("faq").default([]),                   // { q, a }[]
    deliveryInfo: jsonb("delivery_info").default([]),// string[]
    type: text("type").notNull().default("physical"), // physical | digital | service
    // type-specific data:
    //   digital  → { kind: "file"|"link"|"license", fileUrl?, url?, licenseKeys?, instructions? }
    //   service  → { duration?, mode?: "online"|"onsite"|"both", details? }
    fulfillment: jsonb("fulfillment").default({}),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("products_shop_idx").on(t.shopId),
    index("products_visible_idx").on(t.shopId, t.visible),
  ]
);

// ─── Blog posts ───────────────────────────────────────────────────────────────

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    content: text("content"),
    coverImage: text("cover_image"),
    published: boolean("published").notNull().default(false),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("blog_shop_idx").on(t.shopId),
    uniqueIndex("blog_shop_slug_idx").on(t.shopId, t.slug),
  ]
);

// ─── Orders ───────────────────────────────────────────────────────────────────

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    orderNumber: text("order_number").notNull(), // MNO-123456
    customerEmail: text("customer_email").notNull(),
    customerName: text("customer_name"),
    customerPhone: text("customer_phone"),
    items: jsonb("items").notNull().default([]),       // snapshot produktów
    subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
    shippingCost: numeric("shipping_cost", { precision: 10, scale: 2 }).notNull().default("0"),
    discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).default("0"),
    total: numeric("total", { precision: 10, scale: 2 }).notNull(),
    status: text("status").notNull().default("pending"), // pending | processing | shipped | delivered | cancelled
    paymentMethod: text("payment_method"),
    paymentStatus: text("payment_status").notNull().default("unpaid"), // unpaid | paid | refunded
    shippingAddress: jsonb("shipping_address").default({}),
    discountCode: text("discount_code"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("orders_shop_idx").on(t.shopId),
    index("orders_status_idx").on(t.shopId, t.status),
    uniqueIndex("orders_number_idx").on(t.shopId, t.orderNumber),
  ]
);

// ─── Customers ────────────────────────────────────────────────────────────────

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    name: text("name"),
    phone: text("phone"),
    address: jsonb("address").default({}),
    totalOrders: integer("total_orders").notNull().default(0),
    totalSpent: numeric("total_spent", { precision: 10, scale: 2 }).default("0"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("customers_shop_email_idx").on(t.shopId, t.email),
    index("customers_shop_idx").on(t.shopId),
  ]
);

// ─── Discount codes ───────────────────────────────────────────────────────────

export const discountCodes = pgTable(
  "discount_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    discountPercent: integer("discount_percent").notNull(),
    active: boolean("active").notNull().default(true),
    expiresAt: timestamp("expires_at"),
    maxUses: integer("max_uses"),
    usesCount: integer("uses_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("discount_shop_code_idx").on(t.shopId, t.code),
    index("discount_shop_idx").on(t.shopId),
  ]
);

// ─── Newsletter subscribers ───────────────────────────────────────────────────

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("newsletter_shop_email_idx").on(t.shopId, t.email),
    index("newsletter_shop_idx").on(t.shopId),
  ]
);

// ─── Visits (storefront traffic + AI visibility) ─────────────────────────────
// One row per storefront pageview, logged by a lightweight client beacon.
// source: direct | ai | search | social | referral
// aiSource: chatgpt | claude | perplexity | gemini | copilot | other (only when source=ai)

export const visits = pgTable(
  "visits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    path: text("path").notNull().default("/"),
    source: text("source").notNull().default("direct"),
    aiSource: text("ai_source"), // null unless source = ai
    referrerHost: text("referrer_host"),
    visitorId: text("visitor_id"), // anon cookie id — for unique/returning counts
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("visits_shop_created_idx").on(t.shopId, t.createdAt),
    index("visits_shop_source_idx").on(t.shopId, t.source),
  ]
);

// ─── Panel users (shop staff access) ─────────────────────────────────────────

export const panelUsers = pgTable(
  "panel_users",
  {
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("editor"), // owner | admin | editor
    invitedAt: timestamp("invited_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.shopId, t.userId] })]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  shops: many(shops),
  panelAccess: many(panelUsers),
}));

export const shopsRelations = relations(shops, ({ one, many }) => ({
  owner: one(users, { fields: [shops.ownerId], references: [users.id] }),
  config: many(shopConfig),
  products: many(products),
  blogPosts: many(blogPosts),
  orders: many(orders),
  customers: many(customers),
  categories: many(categories),
  discountCodes: many(discountCodes),
  newsletterSubscribers: many(newsletterSubscribers),
  panelUsers: many(panelUsers),
}));

export const productsRelations = relations(products, ({ one }) => ({
  shop: one(shops, { fields: [products.shopId], references: [shops.id] }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  shop: one(shops, { fields: [orders.shopId], references: [shops.id] }),
}));

// ─── Types ────────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Shop = typeof shops.$inferSelect;
export type NewShop = typeof shops.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type DiscountCode = typeof discountCodes.$inferSelect;
export type Visit = typeof visits.$inferSelect;
export type NewVisit = typeof visits.$inferInsert;
