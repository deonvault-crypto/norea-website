import "dotenv/config";
import bcrypt from "bcryptjs";
import cors from "cors";
import crypto from "node:crypto";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import { MongoClient, ObjectId } from "mongodb";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { orderStatuses, paymentMethods, seedProducts } from "./seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 4000);
const isProduction = process.env.NODE_ENV === "production";
const requiredProductionEnv = ["JWT_SECRET", "MONGODB_URI"];
const readinessEnvVars = [
  "NODE_ENV",
  "PUBLIC_BASE_URL",
  "CORS_ORIGINS",
  "JWT_SECRET",
  "MONGODB_URI",
  "MONGODB_DB",
  "MOBILE_ORDER_SOURCE",
  "MONGO_PRODUCTS_COLLECTION",
  "MONGO_INVENTORY_COLLECTION",
  "MONGO_CUSTOMERS_COLLECTION",
  "MONGO_ORDERS_COLLECTION",
  "PAYNOW_INTEGRATION_ID",
  "PAYNOW_INTEGRATION_KEY",
  "PAYNOW_RESULT_URL",
  "PAYNOW_RETURN_URL"
];

for (const key of requiredProductionEnv) {
  if (isProduction && !process.env[key]) {
    throw new Error(`${key} is required in production`);
  }
}

const jwtSecret = process.env.JWT_SECRET || "dev-only-replace-before-production";
const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://127.0.0.1:${port}`;
const supportNumber = process.env.WHATSAPP_SUPPORT_NUMBER || "263776678288";
const orderSource = process.env.MOBILE_ORDER_SOURCE || "mobile";
const origins = (process.env.CORS_ORIGINS || process.env.APP_ORIGIN || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const collections = {
  products: process.env.MONGO_PRODUCTS_COLLECTION || "products",
  inventory: process.env.MONGO_INVENTORY_COLLECTION || "inventory",
  customers: process.env.MONGO_CUSTOMERS_COLLECTION || "customers",
  orders: process.env.MONGO_ORDERS_COLLECTION || "orders",
  reviews: process.env.MONGO_REVIEWS_COLLECTION || "reviews",
  payments: process.env.MONGO_PAYMENTS_COLLECTION || "payments",
  refunds: process.env.MONGO_REFUNDS_COLLECTION || "refunds",
  pushTokens: process.env.MONGO_PUSH_TOKENS_COLLECTION || "pushTokens",
  discounts: process.env.MONGO_DISCOUNTS_COLLECTION || "discounts"
};

const fields = {
  product: {
    id: process.env.PRODUCT_ID_FIELD || "id",
    title: process.env.PRODUCT_TITLE_FIELD || "title",
    category: process.env.PRODUCT_CATEGORY_FIELD || "category",
    price: process.env.PRODUCT_PRICE_FIELD || "priceUsd",
    sizes: process.env.PRODUCT_SIZES_FIELD || "sizes",
    colours: process.env.PRODUCT_COLOURS_FIELD || "colours",
    rating: process.env.PRODUCT_RATING_FIELD || "rating",
    badge: process.env.PRODUCT_BADGE_FIELD || "badge",
    imageUrl: process.env.PRODUCT_IMAGE_FIELD || "imageUrl",
    gallery: process.env.PRODUCT_GALLERY_FIELD || "gallery",
    description: process.env.PRODUCT_DESCRIPTION_FIELD || "description",
    active: process.env.PRODUCT_ACTIVE_FIELD || "active",
    inventory: process.env.PRODUCT_INVENTORY_FIELD || "inventory"
  },
  inventory: {
    productId: process.env.INVENTORY_PRODUCT_ID_FIELD || "productId",
    quantity: process.env.INVENTORY_QUANTITY_FIELD || "quantity"
  },
  customer: {
    id: process.env.CUSTOMER_ID_FIELD || "id",
    name: process.env.CUSTOMER_NAME_FIELD || "name",
    email: process.env.CUSTOMER_EMAIL_FIELD || "email",
    phone: process.env.CUSTOMER_PHONE_FIELD || "phone",
    role: process.env.CUSTOMER_ROLE_FIELD || "role",
    passwordHash: process.env.CUSTOMER_PASSWORD_HASH_FIELD || "passwordHash",
    addresses: process.env.CUSTOMER_ADDRESSES_FIELD || "addresses",
    wishlist: process.env.CUSTOMER_WISHLIST_FIELD || "wishlist"
  },
  order: {
    id: process.env.ORDER_ID_FIELD || "id",
    customerId: process.env.ORDER_CUSTOMER_ID_FIELD || "userId",
    status: process.env.ORDER_STATUS_FIELD || "status",
    paymentStatus: process.env.ORDER_PAYMENT_STATUS_FIELD || "paymentStatus"
  }
};

const memory = {
  products: seedProducts.map((product) => ({ ...product })),
  inventory: [],
  customers: [],
  orders: [],
  reviews: [],
  payments: [],
  refunds: [],
  pushTokens: [],
  discounts: []
};

const metrics = {
  startedAt: new Date().toISOString(),
  requests: 0,
  errors: 0,
  paymentsCreated: 0,
  paymentFailures: 0,
  webhooksReceived: 0
};

let mongo = null;
let database = null;

async function connectDatabase() {
  if (!process.env.MONGODB_URI) return;
  mongo = new MongoClient(process.env.MONGODB_URI, {
    appName: "norea-mobile-api",
    serverSelectionTimeoutMS: 8000
  });
  await mongo.connect();
  database = mongo.db(process.env.MONGODB_DB || "norea");

  if (process.env.MOBILE_SEED_ON_EMPTY === "true") {
    const count = await col("products").countDocuments();
    if (count === 0) await col("products").insertMany(seedProducts);
  }
}

function col(logicalName) {
  return database?.collection(collections[logicalName]);
}

function now() {
  return new Date().toISOString();
}

function log(level, message, meta = {}) {
  const line = {
    level,
    message,
    service: "norea-mobile-api",
    environment: process.env.NODE_ENV || "development",
    time: now(),
    ...meta
  };
  const writer = level === "error" ? console.error : console.log;
  writer(JSON.stringify(line));
}

function ok(req, res, data, status = 200, meta) {
  return res.status(status).json({
    data,
    ...(meta ? { meta } : {}),
    requestId: req.id
  });
}

function getPath(source, dottedPath) {
  if (!source || !dottedPath) return undefined;
  return dottedPath.split(".").reduce((value, key) => value?.[key], source);
}

function setPath(target, dottedPath, value) {
  const parts = dottedPath.split(".");
  const last = parts.pop();
  let cursor = target;
  for (const part of parts) {
    cursor[part] = cursor[part] || {};
    cursor = cursor[part];
  }
  cursor[last] = value;
}

function asArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function asNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function docId(doc, preferredField = "id") {
  return String(
    getPath(doc, preferredField) ??
    doc?.id ??
    doc?.slug ??
    doc?._id ??
    crypto.randomUUID()
  );
}

function publicCustomer(customer) {
  return {
    id: docId(customer, fields.customer.id),
    name: getPath(customer, fields.customer.name) || customer.name || "",
    email: getPath(customer, fields.customer.email) || customer.email || "",
    phone: getPath(customer, fields.customer.phone) || customer.phone || "",
    role: getPath(customer, fields.customer.role) || customer.role || "customer",
    createdAt: customer.createdAt
  };
}

function normalizeProduct(product, inventoryDoc) {
  const id = docId(product, fields.product.id);
  const gallery = asArray(getPath(product, fields.product.gallery));
  const imageUrl = String(
    getPath(product, fields.product.imageUrl) ||
    product.image ||
    product.images?.[0] ||
    gallery[0] ||
    ""
  );

  return {
    id,
    title: String(getPath(product, fields.product.title) || product.name || "Noréa Product"),
    category: String(getPath(product, fields.product.category) || "Activewear"),
    priceUsd: asNumber(getPath(product, fields.product.price) ?? product.price ?? product.usdPrice, 0),
    sizes: asArray(getPath(product, fields.product.sizes)).length
      ? asArray(getPath(product, fields.product.sizes))
      : ["XS", "S", "M", "L", "XL", "XXL"],
    colours: asArray(getPath(product, fields.product.colours) ?? product.colors).length
      ? asArray(getPath(product, fields.product.colours) ?? product.colors)
      : ["Onyx", "Blush", "Navy", "White"],
    rating: asNumber(getPath(product, fields.product.rating), 0),
    reviews: [],
    badge: String(getPath(product, fields.product.badge) || "Noréa"),
    imageUrl,
    gallery: gallery.length ? gallery : [imageUrl].filter(Boolean),
    description: String(getPath(product, fields.product.description) || ""),
    deliveryInfo: product.deliveryInfo || "Nation-wide delivery in Zimbabwe within 6-10 days.",
    returnsInfo: product.returnsInfo || "Returns accepted within 7 days if unworn and in original packaging.",
    inventory: asNumber(
      getPath(inventoryDoc, fields.inventory.quantity) ??
      getPath(product, fields.product.inventory) ??
      product.stock,
      0
    )
  };
}

function productActiveFilter() {
  return {
    $or: [
      { [fields.product.active]: { $exists: false } },
      { [fields.product.active]: true }
    ]
  };
}

function parsePagination(query) {
  const page = Math.max(1, Number.parseInt(String(query.page || "1"), 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(String(query.limit || "20"), 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

async function fetchInventoryMap(productIds) {
  const map = new Map();
  if (!productIds.length) return map;

  if (!database) {
    for (const item of memory.inventory) {
      const productId = String(getPath(item, fields.inventory.productId) || item.productId);
      if (productIds.includes(productId)) map.set(productId, item);
    }
    return map;
  }

  const docs = await col("inventory")
    .find({ [fields.inventory.productId]: { $in: productIds } })
    .toArray();
  for (const item of docs) {
    map.set(String(getPath(item, fields.inventory.productId)), item);
  }
  return map;
}

async function fetchProducts(query) {
  const { page, limit, skip } = parsePagination(query);
  const q = String(query.q || "").trim();
  const category = String(query.category || "").trim();
  const size = String(query.size || "").trim();
  const colour = String(query.colour || "").trim();
  const sort = String(query.sort || "best");
  const minPrice = query.minPrice ? Number(query.minPrice) : null;
  const maxPrice = query.maxPrice ? Number(query.maxPrice) : null;

  if (!database) {
    let rows = memory.products.filter((product) => product.active !== false);
    if (q) rows = rows.filter((product) => `${product.title} ${product.description}`.toLowerCase().includes(q.toLowerCase()));
    if (category) rows = rows.filter((product) => normalizeProduct(product).category === category);
    if (size) rows = rows.filter((product) => normalizeProduct(product).sizes.includes(size));
    if (colour) rows = rows.filter((product) => normalizeProduct(product).colours.includes(colour));
    if (minPrice !== null) rows = rows.filter((product) => normalizeProduct(product).priceUsd >= minPrice);
    if (maxPrice !== null) rows = rows.filter((product) => normalizeProduct(product).priceUsd <= maxPrice);
    rows = sortProducts(rows.map((product) => normalizeProduct(product)), sort);
    return paginateRows(rows, page, limit);
  }

  const filter = { $and: [productActiveFilter()] };
  if (q) {
    filter.$and.push({
      $or: [
        { [fields.product.title]: { $regex: q, $options: "i" } },
        { [fields.product.description]: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } }
      ]
    });
  }
  if (category) filter.$and.push({ [fields.product.category]: category });
  if (minPrice !== null || maxPrice !== null) {
    filter.$and.push({
      [fields.product.price]: {
        ...(minPrice !== null ? { $gte: minPrice } : {}),
        ...(maxPrice !== null ? { $lte: maxPrice } : {})
      }
    });
  }
  if (size) filter.$and.push({ [fields.product.sizes]: size });
  if (colour) filter.$and.push({ [fields.product.colours]: colour });

  const sortSpec =
    sort === "price_asc" ? { [fields.product.price]: 1 } :
    sort === "price_desc" ? { [fields.product.price]: -1 } :
    { [fields.product.rating]: -1, [fields.product.title]: 1 };

  const [total, rawProducts] = await Promise.all([
    col("products").countDocuments(filter),
    col("products").find(filter).sort(sortSpec).skip(skip).limit(limit).toArray()
  ]);
  const ids = rawProducts.map((product) => docId(product, fields.product.id));
  const inventory = await fetchInventoryMap(ids);
  return {
    items: rawProducts.map((product) =>
      normalizeProduct(product, inventory.get(docId(product, fields.product.id)))
    ),
    pagination: paginationMeta(page, limit, total)
  };
}

function sortProducts(products, sort) {
  if (sort === "price_asc") return products.sort((a, b) => a.priceUsd - b.priceUsd);
  if (sort === "price_desc") return products.sort((a, b) => b.priceUsd - a.priceUsd);
  return products.sort((a, b) => b.rating - a.rating);
}

function paginateRows(rows, page, limit) {
  const total = rows.length;
  const start = (page - 1) * limit;
  return {
    items: rows.slice(start, start + limit),
    pagination: paginationMeta(page, limit, total)
  };
}

function paginationMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
}

function objectIdQuery(id, fieldName) {
  const clauses = [{ [fieldName]: id }, { id }, { slug: id }];
  if (ObjectId.isValid(id)) clauses.push({ _id: new ObjectId(id) });
  return { $or: clauses };
}

async function getProduct(id) {
  if (!database) {
    const product = memory.products.find((item) => docId(item, fields.product.id) === id || item.id === id);
    return product ? normalizeProduct(product) : null;
  }
  const product = await col("products").findOne({
    $and: [productActiveFilter(), objectIdQuery(id, fields.product.id)]
  });
  if (!product) return null;
  const inventory = await fetchInventoryMap([docId(product, fields.product.id)]);
  return normalizeProduct(product, inventory.get(docId(product, fields.product.id)));
}

async function findCustomerByEmail(email) {
  const normalized = email.toLowerCase();
  if (!database) return memory.customers.find((customer) => getPath(customer, fields.customer.email) === normalized);
  return col("customers").findOne({ [fields.customer.email]: normalized });
}

async function findCustomerById(id) {
  if (!database) return memory.customers.find((customer) => docId(customer, fields.customer.id) === id);
  return col("customers").findOne(objectIdQuery(id, fields.customer.id));
}

async function saveCustomer(customer) {
  if (!database) {
    const id = docId(customer, fields.customer.id);
    const index = memory.customers.findIndex((item) => docId(item, fields.customer.id) === id);
    if (index >= 0) memory.customers[index] = customer;
    else memory.customers.push(customer);
    return customer;
  }
  const id = docId(customer, fields.customer.id);
  const result = await col("customers").updateOne(objectIdQuery(id, fields.customer.id), { $set: customer });
  if (result.matchedCount === 0) await col("customers").insertOne(customer);
  return customer;
}

async function insertDoc(logicalName, doc) {
  if (!database) {
    memory[logicalName].push(doc);
    return doc;
  }
  await col(logicalName).insertOne(doc);
  return doc;
}

async function updateDoc(logicalName, id, patch, idField = "id") {
  if (!database) {
    const index = memory[logicalName].findIndex((item) => docId(item, idField) === id || item.id === id);
    if (index >= 0) memory[logicalName][index] = { ...memory[logicalName][index], ...patch };
    return memory[logicalName][index];
  }
  await col(logicalName).updateOne(objectIdQuery(id, idField), { $set: patch });
  return findDoc(logicalName, id, idField);
}

async function findDoc(logicalName, id, idField = "id") {
  if (!database) return memory[logicalName].find((item) => docId(item, idField) === id || item.id === id);
  return col(logicalName).findOne(objectIdQuery(id, idField));
}

function customerRole(customer) {
  return getPath(customer, fields.customer.role) || customer.role || "customer";
}

function customerIsAdmin(customer) {
  const role = String(customerRole(customer)).toLowerCase();
  const adminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const email = String(getPath(customer, fields.customer.email) || "").toLowerCase();
  return role === "admin" || adminEmails.includes(email);
}

function sign(customer) {
  const publicData = publicCustomer(customer);
  return jwt.sign(
    { sub: publicData.id, email: publicData.email, role: publicData.role },
    jwtSecret,
    { expiresIn: "7d", issuer: "norea-mobile-api", audience: "norea-mobile" }
  );
}

function auth(requiredRole = "customer") {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || "";
      const [, token] = header.split(" ");
      if (!token) return res.status(401).json({ message: "Authentication required", requestId: req.id });
      const payload = jwt.verify(token, jwtSecret, {
        issuer: "norea-mobile-api",
        audience: "norea-mobile"
      });
      const customer = await findCustomerById(payload.sub);
      if (!customer) return res.status(401).json({ message: "Invalid session", requestId: req.id });
      if (requiredRole === "admin" && !customerIsAdmin(customer)) {
        return res.status(403).json({ message: "Admin access required", requestId: req.id });
      }
      req.user = customer;
      next();
    } catch {
      res.status(401).json({ message: "Invalid or expired session", requestId: req.id });
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
      size: z.string().min(1).max(24),
      colour: z.string().min(1).max(60)
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
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || origins.length === 0 || origins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json({ limit: "250kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 240,
  standardHeaders: true,
  legacyHeaders: false
}));
app.use((req, res, next) => {
  req.id = req.headers["x-request-id"] || crypto.randomUUID();
  metrics.requests += 1;
  res.setHeader("X-Request-Id", req.id);
  const started = Date.now();
  res.on("finish", () => {
    log(res.statusCode >= 500 ? "error" : "info", "request", {
      requestId: req.id,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - started
    });
  });
  next();
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/api/health", (req, res) => {
  ok(req, res, {
    status: "ok",
    service: "norea-mobile-api",
    database: database ? "mongodb" : "memory-dev",
    time: now()
  });
});

app.get("/api/ready", asyncRoute(async (req, res) => {
  const checks = {
    database: false,
    jwt: Boolean(jwtSecret),
    paymentsConfigured: paymentGatewayConfigured(),
    collections
  };
  if (database) {
    await database.command({ ping: 1 });
    checks.database = true;
  } else {
    checks.database = !isProduction;
  }
  ok(req, res, {
    status: checks.database && checks.jwt ? "ready" : "not_ready",
    checks
  }, checks.database && checks.jwt ? 200 : 503);
}));

app.get("/api/readiness", asyncRoute(async (req, res) => {
  const mongoStatus = {
    configured: Boolean(process.env.MONGODB_URI),
    connected: false,
    database: process.env.MONGODB_DB || "norea",
    collections
  };

  if (database) {
    try {
      await database.command({ ping: 1 });
      mongoStatus.connected = true;
    } catch (error) {
      mongoStatus.error = "MongoDB ping failed";
    }
  }

  const environment = readinessEnvVars.map((name) => ({
    name,
    present: Boolean(process.env[name]),
    required: requiredProductionEnv.includes(name)
  }));
  const missingRequired = environment
    .filter((item) => item.required && !item.present)
    .map((item) => item.name);
  const ready = mongoStatus.connected && missingRequired.length === 0;

  ok(req, res, {
    status: ready ? "ready" : "not_ready",
    server: {
      service: "norea-mobile-api",
      running: true,
      environment: process.env.NODE_ENV || "development",
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: now()
    },
    mongodb: mongoStatus,
    environment: {
      variables: environment,
      missingRequired
    }
  }, ready ? 200 : 503);
}));

app.get("/api/monitoring/readiness", asyncRoute(async (req, res) => {
  const ready = database ? await database.command({ ping: 1 }).then(() => true).catch(() => false) : !isProduction;
  ok(req, res, {
    ready,
    uptimeSeconds: Math.round(process.uptime()),
    metrics
  }, ready ? 200 : 503);
}));

app.get("/api/metrics", auth("admin"), (req, res) => {
  ok(req, res, metrics);
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
    <p>Noréa sells physical activewear and athleisure products only. The app does not sell digital goods, memberships, subscriptions, coins or digital fitness plans.</p>
    <p>Orders are subject to stock availability, payment confirmation and delivery coverage.</p>
    <p>Nation-wide delivery in Zimbabwe normally takes 6-10 days after payment confirmation.</p>
  `);
});

app.get("/legal/support", (_req, res) => {
  res.type("html").send(`<h1>Noréa Support</h1><p>WhatsApp support: +${supportNumber}</p>`);
});

app.post("/api/auth/register", asyncRoute(async (req, res) => {
  const input = registerSchema.parse(req.body);
  const email = input.email.toLowerCase();
  const existing = await findCustomerByEmail(email);
  if (existing) return res.status(409).json({ message: "Email already registered", requestId: req.id });

  const customer = {
    id: crypto.randomUUID(),
    source: orderSource,
    name: input.name,
    email,
    phone: input.phone,
    passwordHash: await bcrypt.hash(input.password, 12),
    role: "customer",
    addresses: [],
    wishlist: [],
    createdAt: now(),
    updatedAt: now()
  };
  await saveCustomer(customer);
  ok(req, res, { token: sign(customer), user: publicCustomer(customer) }, 201);
}));

app.post("/api/auth/login", asyncRoute(async (req, res) => {
  const input = loginSchema.parse(req.body);
  const customer = await findCustomerByEmail(input.email);
  const passwordHash = customer && getPath(customer, fields.customer.passwordHash);
  if (!customer || !passwordHash || !(await bcrypt.compare(input.password, passwordHash))) {
    return res.status(401).json({ message: "Invalid email or password", requestId: req.id });
  }
  ok(req, res, { token: sign(customer), user: publicCustomer(customer) });
}));

app.get("/api/products", asyncRoute(async (req, res) => {
  const { items, pagination } = await fetchProducts(req.query);
  ok(req, res, { items, pagination });
}));

app.get("/api/products/:id", asyncRoute(async (req, res) => {
  const product = await getProduct(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found", requestId: req.id });
  const reviews = await fetchReviewsForProduct(product.id);
  ok(req, res, { ...product, reviews });
}));

app.get("/api/wishlist", auth(), asyncRoute(async (req, res) => {
  ok(req, res, getPath(req.user, fields.customer.wishlist) || []);
}));

app.post("/api/wishlist", auth(), asyncRoute(async (req, res) => {
  const productId = z.object({ productId: z.string().min(2) }).parse(req.body).productId;
  const wishlist = new Set(getPath(req.user, fields.customer.wishlist) || []);
  wishlist.has(productId) ? wishlist.delete(productId) : wishlist.add(productId);
  const customer = { ...req.user };
  setPath(customer, fields.customer.wishlist, [...wishlist]);
  customer.updatedAt = now();
  await saveCustomer(customer);
  ok(req, res, [...wishlist]);
}));

app.get("/api/addresses", auth(), asyncRoute(async (req, res) => {
  ok(req, res, getPath(req.user, fields.customer.addresses) || []);
}));

app.post("/api/addresses", auth(), asyncRoute(async (req, res) => {
  const address = { ...addressSchema.parse(req.body), id: req.body.id || crypto.randomUUID() };
  const customer = { ...req.user };
  const addresses = getPath(customer, fields.customer.addresses) || [];
  setPath(customer, fields.customer.addresses, [...addresses.filter((item) => item.id !== address.id), address]);
  customer.updatedAt = now();
  await saveCustomer(customer);
  ok(req, res, getPath(customer, fields.customer.addresses));
}));

app.post("/api/orders", auth(), asyncRoute(async (req, res) => {
  const input = orderSchema.parse(req.body);
  const items = await buildOrderItems(input.items);
  const totalUsd = Number(items.reduce((sum, item) => sum + item.priceUsd * item.quantity, 0).toFixed(2));
  const order = {
    id: `NO-${Date.now().toString(36).toUpperCase()}`,
    source: orderSource,
    userId: docId(req.user, fields.customer.id),
    customer: publicCustomer(req.user),
    items,
    address: input.address,
    totalUsd,
    paymentMethod: input.paymentMethod,
    paymentStatus: "Pending",
    status: "Pending",
    createdAt: now(),
    updatedAt: now()
  };
  await insertDoc("orders", order);
  const payment = await createPayment(order, input.paymentMethod, req.user);
  metrics.paymentsCreated += 1;
  ok(req, res, {
    order,
    payment: publicPayment(payment),
    paymentInstructions: payment.instructions,
    redirectUrl: payment.redirectUrl
  }, 201);
}));

app.get("/api/orders/me", auth(), asyncRoute(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const customerId = docId(req.user, fields.customer.id);
  const filter = { [fields.order.customerId]: customerId, source: orderSource };
  if (!database) {
    const rows = memory.orders
      .filter((order) => order.userId === customerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const { items, pagination } = paginateRows(rows, page, limit);
    return ok(req, res, { items, pagination });
  }
  const [total, items] = await Promise.all([
    col("orders").countDocuments(filter),
    col("orders").find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()
  ]);
  ok(req, res, { items, pagination: paginationMeta(page, limit, total) });
}));

app.post("/api/reviews", auth(), asyncRoute(async (req, res) => {
  const input = reviewSchema.parse(req.body);
  const review = {
    id: crypto.randomUUID(),
    productId: input.productId,
    userId: docId(req.user, fields.customer.id),
    author: publicCustomer(req.user).name,
    rating: input.rating,
    body: input.body,
    approved: false,
    source: orderSource,
    createdAt: now()
  };
  await insertDoc("reviews", review);
  ok(req, res, review, 201);
}));

app.post("/api/notifications/register", auth(), asyncRoute(async (req, res) => {
  const pushToken = z.object({ pushToken: z.string().min(8).max(240) }).parse(req.body).pushToken;
  await insertDoc("pushTokens", {
    id: crypto.randomUUID(),
    userId: docId(req.user, fields.customer.id),
    pushToken,
    source: orderSource,
    createdAt: now()
  });
  ok(req, res, { ok: true });
}));

app.post("/api/support", asyncRoute(async (req, res) => {
  const input = z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    message: z.string().min(10).max(1000)
  }).parse(req.body);
  ok(req, res, {
    ok: true,
    support: `WhatsApp +${supportNumber}`,
    received: { name: input.name, email: input.email }
  }, 201);
}));

app.get("/api/payments/:orderId/verify", auth(), asyncRoute(async (req, res) => {
  const order = await getVisibleOrder(req.params.orderId, req.user);
  if (!order) return res.status(404).json({ message: "Order not found", requestId: req.id });
  const payment = await findPaymentForOrder(order.id);
  if (!payment) return res.status(404).json({ message: "Payment not found", requestId: req.id });
  const verified = await verifyPayment(payment, order);
  ok(req, res, { order: verified.order, payment: publicPayment(verified.payment) });
}));

app.post("/api/payments/paynow/result", asyncRoute(async (req, res) => {
  metrics.webhooksReceived += 1;
  const message = paymentMessageFromRequest(req);
  await handlePaynowMessage(message, "result_url");
  res.type("text").send("OK");
}));

app.all("/api/payments/paynow/return", asyncRoute(async (req, res) => {
  const message = paymentMessageFromRequest(req);
  if (Object.keys(message).length) await handlePaynowMessage(message, "return_url");
  res.redirect(302, process.env.PAYMENT_RETURN_APP_URL || "norea://orders");
}));

app.get("/api/admin/products", auth("admin"), asyncRoute(async (req, res) => {
  const { items, pagination } = await fetchProducts(req.query);
  ok(req, res, { items, pagination });
}));

app.post("/api/admin/products", auth("admin"), asyncRoute(async (req, res) => {
  const product = {
    ...productSchema.parse(req.body),
    source: orderSource,
    createdAt: now(),
    updatedAt: now()
  };
  await updateDoc("products", product.id, product, fields.product.id);
  ok(req, res, product, 201);
}));

app.get("/api/admin/orders", auth("admin"), asyncRoute(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = req.query.allSources === "true" ? {} : { source: orderSource };
  if (!database) {
    const rows = memory.orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const result = paginateRows(rows, page, limit);
    return ok(req, res, result);
  }
  const [total, items] = await Promise.all([
    col("orders").countDocuments(filter),
    col("orders").find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()
  ]);
  ok(req, res, { items, pagination: paginationMeta(page, limit, total) });
}));

app.patch("/api/admin/orders/:id/status", auth("admin"), asyncRoute(async (req, res) => {
  const status = z.object({ status: z.enum(orderStatuses) }).parse(req.body).status;
  const order = await findDoc("orders", req.params.id, fields.order.id);
  if (!order) return res.status(404).json({ message: "Order not found", requestId: req.id });
  const updated = await updateOrder(order.id, {
    status,
    updatedAt: now()
  });
  ok(req, res, updated);
}));

app.get("/api/admin/customers", auth("admin"), asyncRoute(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  if (!database) {
    const result = paginateRows(memory.customers.map(publicCustomer), page, limit);
    return ok(req, res, result);
  }
  const [total, docs] = await Promise.all([
    col("customers").countDocuments(),
    col("customers").find({}).skip(skip).limit(limit).toArray()
  ]);
  ok(req, res, {
    items: docs.map(publicCustomer),
    pagination: paginationMeta(page, limit, total)
  });
}));

app.get("/api/admin/reviews", auth("admin"), asyncRoute(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  if (!database) return ok(req, res, paginateRows(memory.reviews, page, limit));
  const [total, items] = await Promise.all([
    col("reviews").countDocuments(),
    col("reviews").find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()
  ]);
  ok(req, res, { items, pagination: paginationMeta(page, limit, total) });
}));

app.get("/api/admin/payments", auth("admin"), asyncRoute(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  if (!database) return ok(req, res, paginateRows(memory.payments, page, limit));
  const [total, items] = await Promise.all([
    col("payments").countDocuments({ source: orderSource }),
    col("payments").find({ source: orderSource }).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()
  ]);
  ok(req, res, { items, pagination: paginationMeta(page, limit, total) });
}));

app.post("/api/admin/payments/:id/refunds", auth("admin"), asyncRoute(async (req, res) => {
  const input = z.object({
    amountUsd: z.number().positive(),
    reason: z.string().min(4).max(500)
  }).parse(req.body);
  const payment = await findDoc("payments", req.params.id);
  if (!payment) return res.status(404).json({ message: "Payment not found", requestId: req.id });
  const refund = {
    id: crypto.randomUUID(),
    paymentId: payment.id,
    orderId: payment.orderId,
    amountUsd: input.amountUsd,
    reason: input.reason,
    status: "Requested",
    source: orderSource,
    createdAt: now(),
    createdBy: docId(req.user, fields.customer.id)
  };
  await insertDoc("refunds", refund);
  await updateDoc("payments", payment.id, {
    refundStatus: "Requested",
    updatedAt: now()
  });
  ok(req, res, refund, 201);
}));

app.get("/api/admin/refunds", auth("admin"), asyncRoute(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  if (!database) return ok(req, res, paginateRows(memory.refunds, page, limit));
  const [total, items] = await Promise.all([
    col("refunds").countDocuments({ source: orderSource }),
    col("refunds").find({ source: orderSource }).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()
  ]);
  ok(req, res, { items, pagination: paginationMeta(page, limit, total) });
}));

app.post("/api/admin/discounts", auth("admin"), asyncRoute(async (req, res) => {
  const discount = z.object({
    code: z.string().min(3).max(32),
    percentOff: z.number().int().min(1).max(80),
    active: z.boolean().default(true)
  }).parse(req.body);
  const record = { id: crypto.randomUUID(), ...discount, source: orderSource, createdAt: now() };
  await insertDoc("discounts", record);
  ok(req, res, record, 201);
}));

app.get("/api/admin/analytics", auth("admin"), asyncRoute(async (req, res) => {
  const [products, orders, customers, reviews, payments, refunds] = await Promise.all([
    countLogical("products", {}),
    countLogical("orders", { source: orderSource }),
    countLogical("customers", {}),
    countLogical("reviews", {}),
    countLogical("payments", { source: orderSource }),
    countLogical("refunds", { source: orderSource })
  ]);
  ok(req, res, { products, orders, customers, reviews, payments, refunds, metrics });
}));

app.use((error, req, res, _next) => {
  metrics.errors += 1;
  if (error instanceof z.ZodError) {
    return res.status(400).json({ message: "Validation failed", issues: error.issues, requestId: req.id });
  }
  const status = error.status || 500;
  const message = status >= 500 ? "Server error" : error.message;
  log(status >= 500 ? "error" : "warn", "request_failed", {
    requestId: req.id,
    status,
    error: error.message,
    stack: status >= 500 ? error.stack : undefined
  });
  res.status(status).json({ message, requestId: req.id });
});

async function countLogical(logicalName, filter) {
  if (!database) {
    return memory[logicalName].filter((item) =>
      Object.entries(filter).every(([key, value]) => item[key] === value)
    ).length;
  }
  return col(logicalName).countDocuments(filter);
}

async function buildOrderItems(items) {
  const output = [];
  for (const item of items) {
    const product = await getProduct(item.productId);
    if (!product) throw Object.assign(new Error(`Product ${item.productId} is unavailable`), { status: 400 });
    if (item.quantity > product.inventory) {
      throw Object.assign(new Error(`${product.title} does not have enough inventory`), { status: 400 });
    }
    if (!product.sizes.includes(item.size) || !product.colours.includes(item.colour)) {
      throw Object.assign(new Error(`${product.title} option is unavailable`), { status: 400 });
    }
    output.push({
      productId: product.id,
      title: product.title,
      priceUsd: product.priceUsd,
      quantity: item.quantity,
      size: item.size,
      colour: item.colour
    });
  }
  return output;
}

async function fetchReviewsForProduct(productId) {
  const filter = { productId, approved: true };
  if (!database) return memory.reviews.filter((review) => review.productId === productId && review.approved === true);
  return col("reviews").find(filter).sort({ createdAt: -1 }).limit(20).toArray();
}

async function getVisibleOrder(id, customer) {
  const order = await findDoc("orders", id, fields.order.id);
  if (!order) return null;
  if (customerIsAdmin(customer)) return order;
  return String(order.userId) === docId(customer, fields.customer.id) ? order : null;
}

async function updateOrder(id, patch) {
  const updated = await updateDoc("orders", id, patch, fields.order.id);
  return updated || findDoc("orders", id, fields.order.id);
}

async function createPayment(order, method, customer) {
  const payment = {
    id: crypto.randomUUID(),
    source: orderSource,
    orderId: order.id,
    customerId: order.userId,
    method,
    provider: providerForMethod(method),
    amountUsd: order.totalUsd,
    currency: "USD",
    status: "Initiated",
    refundStatus: "None",
    history: [{ status: "Initiated", at: now(), note: "Payment record created" }],
    createdAt: now(),
    updatedAt: now()
  };

  if (["PAYNOW", "VISA", "MASTERCARD"].includes(method)) {
    const initiated = await initiatePaynow(order, payment, customer, method);
    await insertDoc("payments", initiated);
    return initiated;
  }

  payment.status = "AwaitingManualVerification";
  payment.instructions = manualPaymentInstructions(order, method);
  payment.history.push({ status: payment.status, at: now(), note: payment.instructions });
  await insertDoc("payments", payment);
  return payment;
}

function providerForMethod(method) {
  if (["PAYNOW", "VISA", "MASTERCARD"].includes(method)) return "PAYNOW";
  return method;
}

function publicPayment(payment) {
  return {
    id: payment.id,
    orderId: payment.orderId,
    method: payment.method,
    provider: payment.provider,
    amountUsd: payment.amountUsd,
    status: payment.status,
    refundStatus: payment.refundStatus,
    redirectUrl: payment.redirectUrl,
    instructions: payment.instructions,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt
  };
}

function paymentGatewayConfigured() {
  return Boolean(process.env.PAYNOW_INTEGRATION_ID && process.env.PAYNOW_INTEGRATION_KEY);
}

async function initiatePaynow(order, payment, customer, method) {
  if (!paymentGatewayConfigured()) {
    if (isProduction) {
      metrics.paymentFailures += 1;
      throw Object.assign(new Error("Paynow/card payment is not configured"), { status: 503 });
    }
    return {
      ...payment,
      status: "ConfigurationRequired",
      instructions: `Development mode: configure Paynow credentials before accepting ${method} payments.`,
      history: [...payment.history, { status: "ConfigurationRequired", at: now(), note: "Missing Paynow credentials" }]
    };
  }

  const resultUrl = process.env.PAYNOW_RESULT_URL || `${publicBaseUrl}/api/payments/paynow/result`;
  const returnUrl = process.env.PAYNOW_RETURN_URL || `${publicBaseUrl}/api/payments/paynow/return`;
  const fieldsToSign = {
    id: process.env.PAYNOW_INTEGRATION_ID,
    reference: order.id,
    amount: order.totalUsd.toFixed(2),
    additionalinfo: `Noréa ${method} order ${order.id}`,
    returnurl: returnUrl,
    resulturl: resultUrl,
    authemail: publicCustomer(customer).email,
    status: "Message"
  };
  const payload = {
    ...fieldsToSign,
    hash: paynowHash(fieldsToSign)
  };
  const response = await fetch(process.env.PAYNOW_INIT_URL || "https://www.paynow.co.zw/interface/initiatetransaction", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(payload)
  });
  const text = await response.text();
  const parsed = parsePaynowBody(text);
  if (!response.ok || String(parsed.status || "").toLowerCase() !== "ok") {
    metrics.paymentFailures += 1;
    throw Object.assign(new Error(parsed.error || "Paynow initiation failed"), { status: 502 });
  }
  assertPaynowHash(parsed);
  return {
    ...payment,
    status: "RedirectRequired",
    redirectUrl: parsed.browserurl,
    pollUrl: parsed.pollurl,
    providerReference: parsed.reference || order.id,
    instructions: "Continue to the secure Paynow checkout to complete payment.",
    history: [...payment.history, { status: "RedirectRequired", at: now(), note: "Paynow checkout created" }],
    updatedAt: now()
  };
}

function paynowHash(fieldsToSign) {
  const source = Object.entries(fieldsToSign)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([, value]) => String(value))
    .join("") + process.env.PAYNOW_INTEGRATION_KEY;
  return crypto.createHash("sha512").update(source).digest("hex").toUpperCase();
}

function parsePaynowBody(body) {
  const params = new URLSearchParams(body);
  const result = {};
  for (const [key, value] of params.entries()) {
    result[key.toLowerCase()] = value;
  }
  return result;
}

function assertPaynowHash(message) {
  if (!message.hash) throw Object.assign(new Error("Missing Paynow hash"), { status: 400 });
  const values = { ...message };
  delete values.hash;
  const expected = paynowHash(values);
  if (String(message.hash).toUpperCase() !== expected) {
    throw Object.assign(new Error("Invalid Paynow hash"), { status: 400 });
  }
}

function paymentMessageFromRequest(req) {
  const source = req.method === "GET" ? req.query : req.body;
  return Object.fromEntries(
    Object.entries(source || {}).map(([key, value]) => [key.toLowerCase(), Array.isArray(value) ? value[0] : value])
  );
}

async function handlePaynowMessage(message, source, fallbackOrderId) {
  assertPaynowHash(message);
  const orderId = message.reference || message.orderid || fallbackOrderId;
  if (!orderId) throw Object.assign(new Error("Missing payment reference"), { status: 400 });
  const order = await findDoc("orders", orderId, fields.order.id);
  const payment = await findPaymentForOrder(orderId);
  if (!order || !payment) throw Object.assign(new Error("Payment target not found"), { status: 404 });
  const mapped = mapProviderStatus(message.status);
  const updatedPayment = {
    ...payment,
    status: mapped.paymentStatus,
    providerStatus: message.status,
    providerPayload: sanitizeProviderPayload(message),
    history: [...(payment.history || []), { status: mapped.paymentStatus, at: now(), source, providerStatus: message.status }],
    verifiedAt: mapped.verified ? now() : payment.verifiedAt,
    updatedAt: now()
  };
  await updateDoc("payments", payment.id, updatedPayment);
  await updateOrder(order.id, {
    status: mapped.orderStatus,
    paymentStatus: mapped.paymentStatus,
    updatedAt: now()
  });
  return updatedPayment;
}

async function verifyPayment(payment, order) {
  if (payment.provider !== "PAYNOW" || !payment.pollUrl) {
    return { payment, order };
  }
  const response = await fetch(payment.pollUrl);
  const text = await response.text();
  const message = parsePaynowBody(text);
  const updatedPayment = await handlePaynowMessage(message, "poll", order.id);
  const updatedOrder = await findDoc("orders", order.id, fields.order.id);
  return { payment: updatedPayment, order: updatedOrder };
}

async function findPaymentForOrder(orderId) {
  if (!database) return memory.payments.find((payment) => payment.orderId === orderId);
  return col("payments").findOne({ orderId });
}

function sanitizeProviderPayload(message) {
  const copy = { ...message };
  delete copy.hash;
  return copy;
}

function mapProviderStatus(status) {
  const value = String(status || "").toLowerCase();
  if (["paid", "awaiting delivery", "delivered"].includes(value)) {
    return { paymentStatus: "Paid", orderStatus: "Paid", verified: true };
  }
  if (["cancelled", "canceled", "failed", "disputed"].includes(value)) {
    return { paymentStatus: "Failed", orderStatus: "Pending", verified: true };
  }
  if (["created", "sent", "awaiting payment"].includes(value)) {
    return { paymentStatus: "Pending", orderStatus: "Pending", verified: false };
  }
  return { paymentStatus: "Pending", orderStatus: "Pending", verified: false };
}

function manualPaymentInstructions(order, method) {
  const amount = `USD ${order.totalUsd.toFixed(2)}`;
  if (method === "ECOCASH") {
    return `Pay ${amount} to EcoCash merchant: ${process.env.ECOCASH_MERCHANT_CODE || "configured by Noréa support"}. Use order ${order.id} as reference.`;
  }
  if (method === "ONEMONEY") {
    return `Pay ${amount} to OneMoney merchant: ${process.env.ONEMONEY_MERCHANT_CODE || "configured by Noréa support"}. Use order ${order.id} as reference.`;
  }
  if (method === "ZIPIT") {
    return `ZIPIT ${amount}. ${process.env.ZIPIT_DETAILS || "Noréa support will confirm the receiving bank details."} Reference: ${order.id}.`;
  }
  return `Bank transfer ${amount}. ${process.env.BANK_TRANSFER_DETAILS || "Noréa support will confirm bank details."} Reference: ${order.id}.`;
}

async function ensureAdminUser() {
  if (process.env.ADMIN_BOOTSTRAP_ENABLED !== "true") return;
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) return;
  const email = process.env.ADMIN_EMAIL.toLowerCase();
  const existing = await findCustomerByEmail(email);
  if (existing) return;
  await saveCustomer({
    id: crypto.randomUUID(),
    source: orderSource,
    name: "Noréa Admin",
    email,
    phone: process.env.WHATSAPP_SUPPORT_NUMBER || "",
    passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
    role: "admin",
    addresses: [],
    wishlist: [],
    createdAt: now(),
    updatedAt: now()
  });
}

await connectDatabase();
await ensureAdminUser();

app.listen(port, () => {
  log("info", "server_started", {
    port,
    database: database ? "mongodb" : "memory-dev",
    collections,
    publicBaseUrl
  });
});
