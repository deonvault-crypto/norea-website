import "dotenv/config";
import bcrypt from "bcryptjs";
import cors from "cors";
import crypto from "node:crypto";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import { MongoClient } from "mongodb";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { orderStatuses, paymentMethods, seedProducts } from "./seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 4000);
const isProduction = process.env.NODE_ENV === "production";
const requiredProductionEnv = ["JWT_SECRET", "MONGODB_URI", "ADMIN_EMAIL", "ADMIN_PASSWORD"];

for (const key of requiredProductionEnv) {
  if (isProduction && !process.env[key]) {
    throw new Error(`${key} is required in production`);
  }
}

const jwtSecret = process.env.JWT_SECRET || "dev-only-replace-before-production";
const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://127.0.0.1:${port}`;
const supportNumber = process.env.WHATSAPP_SUPPORT_NUMBER || "263776678288";
const origins = (process.env.CORS_ORIGINS || process.env.APP_ORIGIN || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const memory = {
  users: [],
  products: seedProducts.map((product) => ({ ...product })),
  orders: [],
  reviews: [],
  pushTokens: [],
  discounts: []
};

let mongo = null;
let database = null;

async function connectDatabase() {
  if (!process.env.MONGODB_URI) return;
  mongo = new MongoClient(process.env.MONGODB_URI);
  await mongo.connect();
  database = mongo.db(process.env.MONGODB_DB || "norea_mobile");
  const count = await database.collection("products").countDocuments();
  if (count === 0) {
    await database.collection("products").insertMany(seedProducts);
  }
}

function collection(name) {
  return database?.collection(name);
}

async function all(name) {
  const col = collection(name);
  if (!col) return memory[name];
  return col.find({}).toArray();
}

async function findOne(name, query) {
  const col = collection(name);
  if (!col) {
    return memory[name].find((item) =>
      Object.entries(query).every(([key, value]) => item[key] === value)
    );
  }
  return col.findOne(query);
}

async function insert(name, value) {
  const col = collection(name);
  if (!col) {
    memory[name].push(value);
    return value;
  }
  await col.insertOne(value);
  return value;
}

async function replace(name, id, value) {
  const col = collection(name);
  if (!col) {
    const index = memory[name].findIndex((item) => item.id === id);
    if (index >= 0) memory[name][index] = value;
    else memory[name].push(value);
    return value;
  }
  await col.updateOne({ id }, { $set: value }, { upsert: true });
  return value;
}

function sign(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role || "customer" },
    jwtSecret,
    { expiresIn: "7d", issuer: "norea-mobile-api", audience: "norea-mobile" }
  );
}

function ok(res, data, status = 200) {
  return res.status(status).json({ data });
}

function auth(requiredRole = "customer") {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || "";
      const [, token] = header.split(" ");
      if (!token) return res.status(401).json({ message: "Authentication required" });
      const payload = jwt.verify(token, jwtSecret, {
        issuer: "norea-mobile-api",
        audience: "norea-mobile"
      });
      const user = await findOne("users", { id: payload.sub });
      if (!user) return res.status(401).json({ message: "Invalid session" });
      if (requiredRole === "admin" && user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      req.user = user;
      next();
    } catch {
      res.status(401).json({ message: "Invalid or expired session" });
    }
  };
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(160),
  phone: z.string().min(6).max(32),
  password: z.string().min(8).max(128)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const addressSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(80),
  phone: z.string().min(6).max(32),
  line1: z.string().min(4).max(160),
  city: z.string().min(2).max(80),
  country: z.string().min(2).max(80)
});

const orderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(2),
      quantity: z.number().int().min(1).max(20),
      size: z.string().min(1).max(12),
      colour: z.string().min(1).max(40)
    })
  ).min(1).max(50),
  address: addressSchema,
  paymentMethod: z.enum(paymentMethods)
});

const productSchema = z.object({
  id: z.string().min(2).max(120),
  title: z.string().min(2).max(160),
  category: z.string().min(2).max(80),
  priceUsd: z.number().positive().max(10000),
  sizes: z.array(z.string().min(1)).min(1),
  colours: z.array(z.string().min(1)).min(1),
  rating: z.number().min(0).max(5).default(0),
  badge: z.string().min(2).max(80),
  imageUrl: z.string().url(),
  gallery: z.array(z.string().url()).min(1),
  description: z.string().min(10).max(1200),
  deliveryInfo: z.string().min(4).max(300),
  returnsInfo: z.string().min(4).max(300),
  inventory: z.number().int().min(0),
  active: z.boolean().default(true)
});

const reviewSchema = z.object({
  productId: z.string().min(2),
  rating: z.number().int().min(1).max(5),
  body: z.string().min(5).max(800)
});

app.set("trust proxy", 1);
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors({
  origin(origin, callback) {
    if (!origin || origins.length === 0 || origins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json({ limit: "250kb" }));
app.use(morgan("combined"));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 240,
  standardHeaders: true,
  legacyHeaders: false
}));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/api/health", (_req, res) => {
  ok(res, {
    status: "ok",
    service: "norea-mobile-api",
    database: database ? "mongodb" : "memory-dev",
    time: new Date().toISOString()
  });
});

app.get("/legal/privacy", (_req, res) => {
  res.type("html").send(`
    <h1>Noréa Privacy Policy</h1>
    <p>Noréa collects only the information needed to operate ecommerce orders: name, email, phone number, delivery address and order history.</p>
    <p>We do not collect contacts, SMS logs, call logs, background location or unnecessary device data.</p>
    <p>Payment card details are handled by secure external payment providers and are not stored by Noréa.</p>
    <p>For privacy requests, contact support on WhatsApp +${supportNumber}.</p>
  `);
});

app.get("/legal/terms", (_req, res) => {
  res.type("html").send(`
    <h1>Noréa Terms</h1>
    <p>Noréa sells physical activewear and athleisure products. Orders are subject to stock availability, payment confirmation and delivery coverage.</p>
    <p>Nation-wide delivery in Zimbabwe normally takes 6-10 days after payment confirmation.</p>
  `);
});

app.get("/legal/support", (_req, res) => {
  res.type("html").send(`<h1>Noréa Support</h1><p>WhatsApp support: +${supportNumber}</p>`);
});

app.post("/api/auth/register", asyncRoute(async (req, res) => {
  const input = registerSchema.parse(req.body);
  const email = input.email.toLowerCase();
  const existing = await findOne("users", { email });
  if (existing) return res.status(409).json({ message: "Email already registered" });
  const user = {
    id: crypto.randomUUID(),
    name: input.name,
    email,
    phone: input.phone,
    passwordHash: await bcrypt.hash(input.password, 12),
    role: "customer",
    addresses: [],
    wishlist: [],
    createdAt: new Date().toISOString()
  };
  await insert("users", user);
  ok(res, { token: sign(user), user: publicUser(user) }, 201);
}));

app.post("/api/auth/login", asyncRoute(async (req, res) => {
  const input = loginSchema.parse(req.body);
  const user = await findOne("users", { email: input.email.toLowerCase() });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  ok(res, { token: sign(user), user: publicUser(user) });
}));

app.get("/api/products", asyncRoute(async (req, res) => {
  const query = String(req.query.q || "").toLowerCase();
  const category = String(req.query.category || "");
  const min = req.query.minPrice ? Number(req.query.minPrice) : null;
  const max = req.query.maxPrice ? Number(req.query.maxPrice) : null;
  const size = String(req.query.size || "");
  const colour = String(req.query.colour || "");
  const sort = String(req.query.sort || "best");
  let products = (await all("products")).filter((product) => product.active !== false);

  if (query) products = products.filter((product) => `${product.title} ${product.description}`.toLowerCase().includes(query));
  if (category) products = products.filter((product) => product.category === category);
  if (min !== null) products = products.filter((product) => product.priceUsd >= min);
  if (max !== null) products = products.filter((product) => product.priceUsd <= max);
  if (size) products = products.filter((product) => product.sizes.includes(size));
  if (colour) products = products.filter((product) => product.colours.includes(colour));
  if (sort === "price_asc") products.sort((a, b) => a.priceUsd - b.priceUsd);
  else if (sort === "price_desc") products.sort((a, b) => b.priceUsd - a.priceUsd);
  else products.sort((a, b) => b.rating - a.rating);

  ok(res, products);
}));

app.get("/api/products/:id", asyncRoute(async (req, res) => {
  const product = await findOne("products", { id: req.params.id });
  if (!product || product.active === false) return res.status(404).json({ message: "Product not found" });
  const reviews = (await all("reviews")).filter((review) => review.productId === product.id && review.approved !== false);
  ok(res, { ...product, reviews });
}));

app.get("/api/wishlist", auth(), asyncRoute(async (req, res) => {
  ok(res, req.user.wishlist || []);
}));

app.post("/api/wishlist", auth(), asyncRoute(async (req, res) => {
  const productId = z.object({ productId: z.string().min(2) }).parse(req.body).productId;
  const wishlist = new Set(req.user.wishlist || []);
  wishlist.has(productId) ? wishlist.delete(productId) : wishlist.add(productId);
  const user = { ...req.user, wishlist: [...wishlist] };
  await replace("users", user.id, user);
  ok(res, user.wishlist);
}));

app.get("/api/addresses", auth(), asyncRoute(async (req, res) => {
  ok(res, req.user.addresses || []);
}));

app.post("/api/addresses", auth(), asyncRoute(async (req, res) => {
  const address = { ...addressSchema.parse(req.body), id: req.body.id || crypto.randomUUID() };
  const user = {
    ...req.user,
    addresses: [...(req.user.addresses || []).filter((item) => item.id !== address.id), address]
  };
  await replace("users", user.id, user);
  ok(res, user.addresses);
}));

app.post("/api/orders", auth(), asyncRoute(async (req, res) => {
  const input = orderSchema.parse(req.body);
  const products = await all("products");
  const items = input.items.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId && candidate.active !== false);
    if (!product) throw Object.assign(new Error(`Product ${item.productId} is unavailable`), { status: 400 });
    if (item.quantity > product.inventory) throw Object.assign(new Error(`${product.title} does not have enough inventory`), { status: 400 });
    if (!product.sizes.includes(item.size) || !product.colours.includes(item.colour)) {
      throw Object.assign(new Error(`${product.title} option is unavailable`), { status: 400 });
    }
    return {
      productId: product.id,
      title: product.title,
      priceUsd: product.priceUsd,
      quantity: item.quantity,
      size: item.size,
      colour: item.colour
    };
  });
  const totalUsd = Number(items.reduce((sum, item) => sum + item.priceUsd * item.quantity, 0).toFixed(2));
  const order = {
    id: `NO-${Date.now().toString(36).toUpperCase()}`,
    userId: req.user.id,
    customer: publicUser(req.user),
    items,
    address: input.address,
    totalUsd,
    paymentMethod: input.paymentMethod,
    status: "Pending",
    createdAt: new Date().toISOString()
  };
  const payment = createPaymentInstructions(order, input.paymentMethod);
  await insert("orders", order);
  ok(res, { order, ...payment }, 201);
}));

app.get("/api/orders/me", auth(), asyncRoute(async (req, res) => {
  const orders = (await all("orders"))
    .filter((order) => order.userId === req.user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  ok(res, orders);
}));

app.post("/api/reviews", auth(), asyncRoute(async (req, res) => {
  const input = reviewSchema.parse(req.body);
  const review = {
    id: crypto.randomUUID(),
    productId: input.productId,
    userId: req.user.id,
    author: req.user.name,
    rating: input.rating,
    body: input.body,
    approved: false,
    createdAt: new Date().toISOString()
  };
  await insert("reviews", review);
  ok(res, review, 201);
}));

app.post("/api/notifications/register", auth(), asyncRoute(async (req, res) => {
  const pushToken = z.object({ pushToken: z.string().min(8).max(240) }).parse(req.body).pushToken;
  await insert("pushTokens", {
    id: crypto.randomUUID(),
    userId: req.user.id,
    pushToken,
    createdAt: new Date().toISOString()
  });
  ok(res, { ok: true });
}));

app.post("/api/support", asyncRoute(async (req, res) => {
  const input = z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    message: z.string().min(10).max(1000)
  }).parse(req.body);
  ok(res, {
    ok: true,
    support: `WhatsApp +${supportNumber}`,
    received: { name: input.name, email: input.email }
  }, 201);
}));

app.get("/api/admin/products", auth("admin"), asyncRoute(async (_req, res) => {
  ok(res, await all("products"));
}));

app.post("/api/admin/products", auth("admin"), asyncRoute(async (req, res) => {
  const product = {
    ...productSchema.parse(req.body),
    createdAt: new Date().toISOString()
  };
  await replace("products", product.id, product);
  ok(res, product, 201);
}));

app.get("/api/admin/orders", auth("admin"), asyncRoute(async (_req, res) => {
  const orders = (await all("orders")).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  ok(res, orders);
}));

app.patch("/api/admin/orders/:id/status", auth("admin"), asyncRoute(async (req, res) => {
  const status = z.object({ status: z.enum(orderStatuses) }).parse(req.body).status;
  const order = await findOne("orders", { id: req.params.id });
  if (!order) return res.status(404).json({ message: "Order not found" });
  const updated = { ...order, status, updatedAt: new Date().toISOString() };
  await replace("orders", order.id, updated);
  ok(res, updated);
}));

app.get("/api/admin/customers", auth("admin"), asyncRoute(async (_req, res) => {
  ok(res, (await all("users")).map(publicUser));
}));

app.get("/api/admin/reviews", auth("admin"), asyncRoute(async (_req, res) => {
  ok(res, await all("reviews"));
}));

app.post("/api/admin/discounts", auth("admin"), asyncRoute(async (req, res) => {
  const discount = z.object({
    code: z.string().min(3).max(32),
    percentOff: z.number().int().min(1).max(80),
    active: z.boolean().default(true)
  }).parse(req.body);
  const record = { id: crypto.randomUUID(), ...discount, createdAt: new Date().toISOString() };
  await insert("discounts", record);
  ok(res, record, 201);
}));

app.get("/api/admin/analytics", auth("admin"), asyncRoute(async (_req, res) => {
  const [products, orders, users, reviews] = await Promise.all([
    all("products"),
    all("orders"),
    all("users"),
    all("reviews")
  ]);
  const revenue = orders
    .filter((order) => ["Paid", "Packed", "Shipped", "Out for Delivery", "Delivered"].includes(order.status))
    .reduce((sum, order) => sum + order.totalUsd, 0);
  ok(res, {
    products: products.length,
    inventory: products.reduce((sum, product) => sum + product.inventory, 0),
    orders: orders.length,
    customers: users.length,
    reviews: reviews.length,
    revenueUsd: Number(revenue.toFixed(2))
  });
}));

app.use((error, _req, res, _next) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ message: "Validation failed", issues: error.issues });
  }
  const status = error.status || 500;
  const message = status >= 500 ? "Server error" : error.message;
  if (status >= 500) console.error(error);
  res.status(status).json({ message });
});

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt
  };
}

function createPaymentInstructions(order, method) {
  const amount = `USD ${order.totalUsd.toFixed(2)}`;
  if (["PAYNOW", "VISA", "MASTERCARD"].includes(method)) {
    if (!process.env.PAYNOW_INTEGRATION_ID || !process.env.PAYNOW_INTEGRATION_KEY) {
      if (isProduction) {
        throw Object.assign(new Error("Card/Paynow payment is not configured yet"), { status: 503 });
      }
      return {
        paymentInstructions:
          `Development mode: configure Paynow credentials before accepting ${method} payments.`,
        redirectUrl: undefined
      };
    }
    return {
      paymentInstructions: `Secure ${method} payment created for ${amount}.`,
      redirectUrl: `${publicBaseUrl}/api/payments/paynow/checkout/${order.id}`
    };
  }
  if (method === "ECOCASH") {
    return { paymentInstructions: `Pay ${amount} to EcoCash merchant: ${process.env.ECOCASH_MERCHANT_CODE || "configured by Noréa support"}. Use order ${order.id} as reference.` };
  }
  if (method === "ONEMONEY") {
    return { paymentInstructions: `Pay ${amount} to OneMoney merchant: ${process.env.ONEMONEY_MERCHANT_CODE || "configured by Noréa support"}. Use order ${order.id} as reference.` };
  }
  if (method === "ZIPIT") {
    return { paymentInstructions: `ZIPIT ${amount}. ${process.env.ZIPIT_DETAILS || "Noréa support will confirm the receiving bank details."} Reference: ${order.id}.` };
  }
  return { paymentInstructions: `Bank transfer ${amount}. ${process.env.BANK_TRANSFER_DETAILS || "Noréa support will confirm bank details."} Reference: ${order.id}.` };
}

async function ensureAdminUser() {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) return;
  const email = process.env.ADMIN_EMAIL.toLowerCase();
  const existing = await findOne("users", { email });
  if (existing) return;
  await insert("users", {
    id: crypto.randomUUID(),
    name: "Noréa Admin",
    email,
    phone: process.env.WHATSAPP_SUPPORT_NUMBER || "",
    passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
    role: "admin",
    addresses: [],
    wishlist: [],
    createdAt: new Date().toISOString()
  });
}

await connectDatabase();
await ensureAdminUser();

app.listen(port, () => {
  console.log(`Noréa mobile API listening on ${port}`);
});
