import "dotenv/config";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";
import * as XLSX from "xlsx";
import ws from "ws";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";
import rateLimit from "express-rate-limit";
import { PDFParse } from "pdf-parse";
import { createChatbotRouter } from "./routes/chatbot.js";
import {
  sendTourRequestToAgent,
  sendTourConfirmationToVisitor,
  sendValuationRequestToAgent,
  sendValuationConfirmationToVisitor,
  sendNewsletterWelcome,
  sendNewLeadToAgent,
  sendBirthdayEmail,
  buildBirthdayEmailHtml,
} from "./lib/email.js";
import { sendCampaign } from "./lib/campaignSender.js";
import {
  buildTenantLeaseRenewalEmail,
  buildOwnerLeaseRenewalEmail,
  buildAgentLeaseRenewalNotificationEmail,
} from "./lib/templates/leaseRenewalEmail.js";
import {
  buildMarketUpdateEmail,
  buildMarketUpdateNewsletterHtml,
  type MarketUpdateData,
  type MarketUpdateNewsletterData,
} from "./lib/templates/marketUpdateEmail.js";
import { sendLeaseRenewalForLease } from "./lib/leaseRenewal.js";
import { sendTodaysBirthdayEmails, sendTodaysLeaseRenewalEmails, sendTodaysHolidayGreetings } from "./lib/automation.js";
import cron from "node-cron";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const resend = new Resend(process.env.RESEND_API_KEY);

// Strict limiter for public form submissions — 5 requests per 15 minutes per IP
const formSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many submissions. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// General limiter for public GET endpoints — 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cors());
app.use(express.static(path.join(__dirname, "../public")));

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing required Supabase environment variables");
  process.exit(1);
}

const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false }, realtime: { transport: ws } })
  : null;

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, { realtime: { transport: ws } });

// Ensure storage buckets exist (safe no-op if already exists)
if (supabaseAdmin) {
  supabaseAdmin.storage.createBucket("hero-videos", { public: true }).catch(() => {});
  supabaseAdmin.storage.createBucket("holiday-flyers", { public: true }).catch(() => {});
  supabaseAdmin.storage.createBucket("market-update-banners", { public: true }).catch(() => {});
  supabaseAdmin.storage.createBucket("campaign-images", { public: true }).catch(() => {});
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB max
});

const flyerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    cb(null, allowed.includes(file.mimetype));
  },
});

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf"));
  },
});

const campaignImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype));
  },
});

const AGENT_EMAIL_CONST = "ramanimma@texasrealtyhub.com";

// Helper: log email attempts to email_log table (best-effort, never throws)
async function logEmail(
  client: ReturnType<typeof createClient>,
  recipient: string,
  template: string,
  status: "sent" | "failed",
  error?: string
) {
  try {
    await client.from("email_log").insert({
      recipient_email: recipient,
      template_name: template,
      status,
      error_message: error || null,
    });
  } catch {
    // email_log table may not exist yet — silently ignore
  }
}

// Helper: verify admin session from Authorization header
async function verifyAdmin(req: express.Request, res: express.Response): Promise<string | null> {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const client = supabaseAdmin ?? supabaseAnon;
  const { data: { user }, error } = await client.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const { data: isAdmin } = await client.rpc("has_role", { _user_id: user.id, _role: "admin" });
  if (!isAdmin) {
    res.status(403).json({ error: "Forbidden: admin only" });
    return null;
  }
  return user.id;
}

// ─── PUBLIC ROUTES ───────────────────────────────────────────────────────────

// GET /api/listings
app.get("/api/listings", generalLimiter, async (_req, res) => {
  const { data, error } = await supabaseAnon
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/listings/:id
app.get("/api/listings/:id", generalLimiter, async (req, res) => {
  const { data, error } = await supabaseAnon
    .from("listings")
    .select("*")
    .eq("id", req.params.id)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

// GET /api/agent-profile
app.get("/api/agent-profile", generalLimiter, async (_req, res) => {
  const { data, error } = await supabaseAnon
    .from("agent_profile")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/reviews (approved only)
app.get("/api/reviews", generalLimiter, async (_req, res) => {
  const { data, error } = await supabaseAnon
    .from("reviews")
    .select("*")
    .eq("is_approved", true)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/reviews (public submission)
app.post("/api/reviews", formSubmitLimiter, async (req, res) => {
  if (req.body.honeypot) return res.json({ ok: true });
  const { client_name, rating, comment } = req.body;
  if (!client_name || !rating || !comment) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }
  if (client_name.length > 100 || comment.length > 1000) {
    return res.status(400).json({ error: "Input too long" });
  }
  const { error } = await (supabaseAdmin ?? supabaseAnon).from("reviews").insert({
    client_name: client_name.trim(),
    rating,
    comment: comment.trim(),
    is_approved: false,
  });
  if (error) {
    console.error("Review insert error:", JSON.stringify(error, null, 2));
    return res.status(500).json({ error: error.message, details: error });
  }
  res.json({ ok: true });
});

// GET /api/admin-exists
app.get("/api/admin-exists", async (_req, res) => {
  const { data, error } = await supabaseAnon.rpc("admin_exists");
  if (error) return res.status(500).json({ error: error.message });
  res.json({ exists: !!data });
});

// GET /api/agents (active agents, ordered by display_order)
app.get("/api/agents", async (_req, res) => {
  const { data, error } = await supabaseAnon
    .from("agent_profile")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// GET /api/hero-videos (active, ordered by display_order)
app.get("/api/hero-videos", async (_req, res) => {
  const { data, error } = await supabaseAnon
    .from("hero_videos")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// GET /api/neighborhoods
app.get("/api/neighborhoods", generalLimiter, async (_req, res) => {
  const { data, error } = await supabaseAnon
    .from("neighborhoods")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// GET /api/neighborhoods/:slug
app.get("/api/neighborhoods/:slug", generalLimiter, async (req, res) => {
  const { data, error } = await supabaseAnon
    .from("neighborhoods")
    .select("*")
    .eq("slug", req.params.slug)
    .single();
  if (error || !data) return res.status(404).json({ error: "Neighborhood not found" });
  res.json(data);
});

// GET /api/neighborhoods/:slug/listings
app.get("/api/neighborhoods/:slug/listings", generalLimiter, async (req, res) => {
  const { data: hood, error: hErr } = await supabaseAnon
    .from("neighborhoods")
    .select("city")
    .eq("slug", req.params.slug)
    .single();
  if (hErr || !hood) return res.status(404).json({ error: "Neighborhood not found" });
  const { data, error } = await supabaseAnon
    .from("listings")
    .select("*")
    .ilike("city", hood.city ?? "")
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// POST /api/inquiries — save tour/contact form submission
app.post("/api/inquiries", formSubmitLimiter, async (req, res) => {
  if (req.body.honeypot) return res.json({ ok: true });
  const { full_name, email, phone, message, preferred_date, type = "tour", listing_id } = req.body;
  if (!full_name || !email) return res.status(400).json({ error: "full_name and email are required" });
  if (typeof full_name !== "string" || full_name.length > 200) return res.status(400).json({ error: "Invalid full_name" });
  if (typeof email !== "string" || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Invalid email" });
  const client = supabaseAdmin ?? supabaseAnon;
  const combinedMessage = [preferred_date ? `Preferred date: ${preferred_date}` : null, message || null].filter(Boolean).join("\n") || null;
  const { data: inqData, error: inqError } = await client.from("inquiries").insert({
    full_name: full_name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone?.trim() || null,
    type,
    status: "new",
    message: combinedMessage,
    contact_id: null,
  }).select("id").single();
  if (inqError) return res.status(500).json({ error: inqError.message });
  // Upsert contact
  const { data: existing } = await client.from("contacts").select("id").eq("email", email.trim().toLowerCase()).maybeSingle();
  if (!existing) {
    await client.from("contacts").insert({ full_name: full_name.trim(), email: email.trim().toLowerCase(), phone: phone?.trim() || null, contact_type: "lead", source: "website" });
  } else {
    await client.from("contacts").update({ full_name: full_name.trim() }).eq("id", existing.id);
  }
  const inquiryId = inqData?.id;
  res.json({ ok: true, id: inquiryId });

  // Send emails (non-blocking)
  setImmediate(async () => {
    try {
      console.log('[EMAIL] Sending tour request emails to agents...');
      await sendTourRequestToAgent({
        full_name,
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        message: message || null,
        preferred_date: preferred_date || null,
        inquiry_id: inquiryId,
      });
      console.log('[EMAIL] Agent notification sent ✅');
      await sendTourConfirmationToVisitor({
        full_name,
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        message: message || null,
        preferred_date: preferred_date || null,
        inquiry_id: inquiryId,
      });
      console.log('[EMAIL] Visitor confirmation sent ✅');
    } catch (err: any) {
      console.error('[EMAIL ERROR] Failed to send emails:', err?.response?.body || err?.message || err);
    }
  });
});

// POST /api/newsletter — newsletter signup
app.post("/api/newsletter", formSubmitLimiter, async (req, res) => {
  if (req.body.honeypot) return res.json({ ok: true });
  const { full_name, email } = req.body;
  if (!email) return res.status(400).json({ error: "email is required" });
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Invalid email" });
  const client = supabaseAdmin ?? supabaseAnon;
  const { data: existingContact } = await client.from("contacts").select("id").eq("email", email.trim().toLowerCase()).maybeSingle();
  if (!existingContact) {
    await client.from("contacts").insert({ full_name: full_name?.trim() || null, email: email.trim().toLowerCase(), contact_type: "lead", source: "website" });
  } else if (full_name) {
    await client.from("contacts").update({ full_name: full_name.trim() }).eq("id", existingContact.id);
  }
  res.json({ ok: true });

  // Send emails — never fail the request
  try {
    await sendNewsletterWelcome({ full_name: full_name?.trim() || null, email: email.trim().toLowerCase() });
    await logEmail(client, email.trim().toLowerCase(), "newsletter_welcome", "sent");
  } catch (err: unknown) {
    console.error("[email] newsletter_welcome failed:", err);
    await logEmail(client, email.trim().toLowerCase(), "newsletter_welcome", "failed", String(err));
  }
  if (!existingContact) {
    try {
      await sendNewLeadToAgent({ full_name: full_name?.trim() || "Newsletter Subscriber", email: email.trim().toLowerCase(), source: "Newsletter Signup" });
      await logEmail(client, AGENT_EMAIL_CONST, "new_lead_agent", "sent");
    } catch (err: unknown) {
      console.error("[email] new_lead_agent failed:", err);
      await logEmail(client, AGENT_EMAIL_CONST, "new_lead_agent", "failed", String(err));
    }
  }
});

// POST /api/home-valuations — home valuation request
app.post("/api/home-valuations", formSubmitLimiter, async (req, res) => {
  if (req.body.honeypot) return res.json({ ok: true });
  const {
    full_name, email, phone, address, city, zip_code, state,
    property_type, bedrooms, bathrooms, sqft, year_built,
    condition, notes,
  } = req.body;
  if (!full_name || !email) return res.status(400).json({ error: "full_name and email are required" });
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Invalid email" });
  const client = supabaseAdmin ?? supabaseAnon;
  const { data: valData, error: valError } = await client.from("home_valuations").insert({
    full_name: full_name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone?.trim() || null,
    address: address?.trim() || null,
    city: city?.trim() || null,
    zip_code: zip_code?.trim() || null,
    property_type: property_type || null,
    bedrooms: bedrooms ? Number(bedrooms) : null,
    bathrooms: bathrooms ? Number(bathrooms) : null,
    sqft: sqft ? Number(sqft) : null,
    year_built: year_built ? Number(year_built) : null,
    condition: condition || null,
    notes: notes?.trim() || null,
    status: "pending",
  }).select("id").single();
  if (valError) return res.status(500).json({ error: valError.message });
  // Upsert contact
  const { data: existing } = await client.from("contacts").select("id").eq("email", email.trim().toLowerCase()).maybeSingle();
  if (!existing) {
    await client.from("contacts").insert({ full_name: full_name.trim(), email: email.trim().toLowerCase(), phone: phone?.trim() || null, contact_type: "lead", source: "website" });
  } else {
    await client.from("contacts").update({ full_name: full_name.trim() }).eq("id", existing.id);
  }
  res.json({ ok: true, id: valData?.id });

  // Send emails (non-blocking)
  const valuationData = {
    full_name: full_name.trim(), email: email.trim().toLowerCase(), phone: phone?.trim() || null,
    address: address?.trim() || null, city: city?.trim() || null, zip_code: zip_code?.trim() || null,
    state: state?.trim() || null, property_type: property_type || null,
    bedrooms: bedrooms ? Number(bedrooms) : null, bathrooms: bathrooms ? Number(bathrooms) : null,
    sqft: sqft ? Number(sqft) : null, year_built: year_built ? Number(year_built) : null,
    condition: condition || null, notes: notes?.trim() || null,
  };
  setImmediate(async () => {
    try {
      console.log('[EMAIL] Sending valuation emails...');
      await sendValuationRequestToAgent(valuationData);
      console.log('[EMAIL] Valuation agent notification sent ✅');
      await sendValuationConfirmationToVisitor(valuationData);
      console.log('[EMAIL] Valuation visitor confirmation sent ✅');
    } catch (err: any) {
      console.error('[EMAIL ERROR] Valuation emails failed:', err?.response?.body || err?.message || err);
    }
  });
});

// ─── ADMIN ROUTES (require auth token) ───────────────────────────────────────

// GET /api/admin/listings
app.get("/api/admin/listings", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  const client = supabaseAdmin ?? supabaseAnon;
  const { data, error } = await client
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/admin/listings
app.post("/api/admin/listings", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  const client = supabaseAdmin ?? supabaseAnon;
  const { error } = await client.from("listings").insert(req.body);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// PATCH /api/admin/listings/:id
app.patch("/api/admin/listings/:id", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  const client = supabaseAdmin ?? supabaseAnon;
  const { error } = await client.from("listings").update(req.body).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// DELETE /api/admin/listings/:id
app.delete("/api/admin/listings/:id", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  const client = supabaseAdmin ?? supabaseAnon;
  const { error } = await client.from("listings").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// GET /api/admin/reviews
app.get("/api/admin/reviews", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  const client = supabaseAdmin ?? supabaseAnon;
  const { data, error } = await client
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH /api/admin/reviews/:id
app.patch("/api/admin/reviews/:id", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  const client = supabaseAdmin ?? supabaseAnon;
  const { error } = await client.from("reviews").update(req.body).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// DELETE /api/admin/reviews/:id
app.delete("/api/admin/reviews/:id", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  const client = supabaseAdmin ?? supabaseAnon;
  const { error } = await client.from("reviews").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// GET /api/admin/agent-profile
app.get("/api/admin/agent-profile", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  const client = supabaseAdmin ?? supabaseAnon;
  const { data, error } = await client.from("agent_profile").select("*").limit(1).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/admin/agent-profile
app.post("/api/admin/agent-profile", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  const client = supabaseAdmin ?? supabaseAnon;
  const { error } = await client.from("agent_profile").insert(req.body);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// PATCH /api/admin/agent-profile/:id
app.patch("/api/admin/agent-profile/:id", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  const client = supabaseAdmin ?? supabaseAnon;
  const { error } = await client.from("agent_profile").update(req.body).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ─── ADDITIONAL ADMIN ROUTES ─────────────────────────────────────────────────

async function safeList(client: any, table: string, opts: { limit?: number; orderBy?: string; ascending?: boolean; filter?: [string, any] } = {}) {
  const { limit, orderBy, ascending = false, filter } = opts;
  let q = client.from(table).select("*");
  if (filter) q = q.eq(filter[0], filter[1]);
  if (orderBy) q = q.order(orderBy, { ascending });
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  return error ? [] : (data ?? []);
}

async function safeCount(client: any, table: string, filter?: [string, any]): Promise<number> {
  let q = client.from(table).select("*", { count: "exact", head: true });
  if (filter) q = q.eq(filter[0], filter[1]);
  const { count, error } = await q;
  return error ? 0 : (count ?? 0);
}

// GET /api/admin/dashboard-stats
app.get("/api/admin/dashboard-stats", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  const client = supabaseAdmin ?? supabaseAnon;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [totalListings, activeListings, totalInquiries, totalContacts, chatSessions, recentInquiries, recentSessions] = await Promise.all([
    safeCount(client, "listings"),
    safeCount(client, "listings", ["status", "Active"]),
    safeCount(client, "inquiries"),
    safeCount(client, "contacts"),
    safeCount(client, "chat_sessions"),
    safeList(client, "inquiries", { limit: 5, orderBy: "created_at" }),
    safeList(client, "chat_sessions", { limit: 5, orderBy: "started_at" }),
  ]);
  const { count: newInquiries } = await client.from("inquiries").select("*", { count: "exact", head: true }).gte("created_at", weekAgo);
  res.json({ totalListings, activeListings, totalInquiries, newInquiries: newInquiries ?? 0, totalContacts, chatSessions, recentInquiries, recentChatSessions: recentSessions });
});

// GET/PATCH/DELETE /api/admin/inquiries
app.get("/api/admin/inquiries", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  res.json(await safeList(supabaseAdmin ?? supabaseAnon, "inquiries", { orderBy: "created_at" }));
});
app.patch("/api/admin/inquiries/:id", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  const { error } = await (supabaseAdmin ?? supabaseAnon).from("inquiries").update(req.body).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});
app.delete("/api/admin/inquiries/:id", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  const { error } = await (supabaseAdmin ?? supabaseAnon).from("inquiries").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// GET/POST/PATCH/DELETE /api/admin/contacts
app.get("/api/admin/contacts", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  res.json(await safeList(supabaseAdmin ?? supabaseAnon, "contacts", { orderBy: "created_at" }));
});
app.post("/api/admin/contacts", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  const { error } = await (supabaseAdmin ?? supabaseAnon).from("contacts").insert(req.body);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});
app.patch("/api/admin/contacts/:id", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  const { error } = await (supabaseAdmin ?? supabaseAnon).from("contacts").update(req.body).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});
app.delete("/api/admin/contacts/:id", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  const { error } = await (supabaseAdmin ?? supabaseAnon).from("contacts").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// GET/PATCH /api/admin/agents (all from agent_profile)
app.get("/api/admin/agents", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  const client = supabaseAdmin ?? supabaseAnon;
  const { data, error } = await client.from("agent_profile").select("*").order("display_order", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});
app.patch("/api/admin/agents/:id", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  const updateData = { ...req.body };
  if (updateData.brokerage !== undefined) {
    updateData.brokerage_name = updateData.brokerage;
    delete updateData.brokerage;
  }
  const { error } = await (supabaseAdmin ?? supabaseAnon).from("agent_profile").update(updateData).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// GET/POST/PATCH/DELETE /api/admin/neighborhoods
app.get("/api/admin/neighborhoods", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  res.json(await safeList(supabaseAdmin ?? supabaseAnon, "neighborhoods", { orderBy: "display_order", ascending: true }));
});
app.post("/api/admin/neighborhoods", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  const { error } = await (supabaseAdmin ?? supabaseAnon).from("neighborhoods").insert(req.body);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});
app.patch("/api/admin/neighborhoods/:id", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  const { error } = await (supabaseAdmin ?? supabaseAnon).from("neighborhoods").update(req.body).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});
app.delete("/api/admin/neighborhoods/:id", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  const { error } = await (supabaseAdmin ?? supabaseAnon).from("neighborhoods").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// POST /api/admin/upload-hero-video
app.post("/api/admin/upload-hero-video", upload.single("video"), async (req, res) => {
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000);
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });
  const client = supabaseAdmin;
  if (!client) return res.status(500).json({ error: "Storage not configured" });
  const filename = `hero-${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
  const { error } = await client.storage
    .from("hero-videos")
    .upload(filename, file.buffer, { contentType: file.mimetype, upsert: true });
  if (error) {
    console.error("Supabase upload error:", error);
    return res.status(500).json({
      error: `Upload failed: ${error.message}. File may be too large or network timed out.`,
    });
  }
  const { data } = client.storage.from("hero-videos").getPublicUrl(filename);
  res.json({ url: data.publicUrl });
});

// POST /api/admin/upload-property-image
app.post("/api/admin/upload-property-image", upload.single("image"), async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });
  const client = supabaseAdmin;
  if (!client) return res.status(500).json({ error: "Storage not configured" });
  const filename = `property-${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
  const { error } = await client.storage
    .from("property-images")
    .upload(filename, file.buffer, { contentType: file.mimetype, upsert: true });
  if (error) {
    console.error("Supabase upload error:", error);
    return res.status(500).json({ error: `Upload failed: ${error.message}` });
  }
  const { data } = client.storage.from("property-images").getPublicUrl(filename);
  res.json({ url: data.publicUrl });
});

// POST /api/admin/upload-campaign-image
app.post("/api/admin/upload-campaign-image", campaignImageUpload.single("image"), async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No image uploaded" });
  if (!supabaseAdmin) return res.status(500).json({ error: "Storage not configured" });

  const filename = `campaign-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error } = await supabaseAdmin.storage
    .from("campaign-images")
    .upload(filename, file.buffer, { contentType: file.mimetype, upsert: true });
  if (error) {
    console.error("Campaign image upload error:", error);
    return res.status(500).json({ error: `Upload failed: ${error.message}` });
  }

  const { data } = supabaseAdmin.storage.from("campaign-images").getPublicUrl(filename);
  return res.json({ url: data.publicUrl });
});

// GET/POST/PATCH/DELETE /api/admin/hero-videos
app.get("/api/admin/hero-videos", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  res.json(await safeList(supabaseAdmin ?? supabaseAnon, "hero_videos", { orderBy: "display_order", ascending: true }));
});
app.post("/api/admin/hero-videos", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  const { title, cloudinary_url, display_order, is_active } = req.body;
  if (!cloudinary_url) return res.status(400).json({ error: "cloudinary_url is required" });
  const { error } = await (supabaseAdmin ?? supabaseAnon).from("hero_videos").insert({ title: title || null, cloudinary_url, display_order: display_order ?? 0, is_active: is_active ?? true });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});
app.patch("/api/admin/hero-videos/:id", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  const { error } = await (supabaseAdmin ?? supabaseAnon).from("hero_videos").update(req.body).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});
app.delete("/api/admin/hero-videos/:id", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  const { error } = await (supabaseAdmin ?? supabaseAnon).from("hero_videos").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// GET /api/admin/chat-sessions + messages
app.get("/api/admin/chat-sessions", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  res.json(await safeList(supabaseAdmin ?? supabaseAnon, "chat_sessions", { orderBy: "started_at" }));
});
app.get("/api/admin/chat-sessions/:id/messages", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  res.json(await safeList(supabaseAdmin ?? supabaseAnon, "chat_messages", { filter: ["session_id", req.params.id], orderBy: "sent_at", ascending: true }));
});

// ─── Helper: sync owner/tenant people to master_clients ──────────────────────
async function syncMasterClients(
  client: ReturnType<typeof createClient>,
  people: Array<{ name: string | null; phone: string | null; email: string | null; role: string }>
) {
  for (const person of people) {
    const name = person.name?.trim();
    if (!name) continue;
    const phone = person.phone?.trim() || null;
    const email = person.email?.trim() || null;

    const { data: existing } = await client
      .from("master_clients")
      .select("id, phone_number, email_address")
      .ilike("full_name", name)
      .limit(1);

    if (existing && existing.length > 0) {
      const row = existing[0];
      const phoneMatch = (row.phone_number ?? "") === (phone ?? "");
      const emailMatch = (row.email_address ?? "") === (email ?? "");
      if (!phoneMatch || !emailMatch) {
        await client
          .from("master_clients")
          .update({ phone_number: phone, email_address: email })
          .eq("id", row.id);
      }
    } else {
      await client.from("master_clients").insert({
        full_name: name,
        phone_number: phone,
        email_address: email,
        client_role: person.role,
      });
    }
  }
}

// ─── Shared: cascade phone/email across master_clients + all lease_reminders ──
async function syncContactAcrossAllRecords(
  client: ReturnType<typeof createClient>,
  fullName: string | null,
  newPhone: string | null,
  newEmail: string | null
) {
  if (!fullName?.trim()) return;
  const matchKey = fullName.trim().toLowerCase();
  const norm = (s: string | null) => s?.trim().toLowerCase() ?? "";

  // Update master_clients rows whose name matches
  try {
    const { data: mcRows } = await client
      .from("master_clients")
      .select("id, full_name")
      .ilike("full_name", fullName.trim());
    for (const row of mcRows ?? []) {
      if (norm(row.full_name) === matchKey) {
        await client.from("master_clients")
          .update({ phone_number: newPhone, email_address: newEmail })
          .eq("id", row.id);
      }
    }
  } catch (err: any) {
    console.error(`[sync] master_clients "${fullName}":`, err.message);
  }

  // Update every lease_reminders row where the name appears in any owner/tenant column
  try {
    const { data: allLeases } = await client
      .from("lease_reminders")
      .select("id, owner1_name, owner2_name, tenant1_name, tenant2_name");
    for (const lease of allLeases ?? []) {
      const updates: Record<string, string | null> = {};
      if (norm(lease.owner1_name)  === matchKey) { updates.owner1_phone  = newPhone; updates.owner1_email  = newEmail; }
      if (norm(lease.owner2_name)  === matchKey) { updates.owner2_phone  = newPhone; updates.owner2_email  = newEmail; }
      if (norm(lease.tenant1_name) === matchKey) { updates.tenant1_phone = newPhone; updates.tenant1_email = newEmail; }
      if (norm(lease.tenant2_name) === matchKey) { updates.tenant2_phone = newPhone; updates.tenant2_email = newEmail; }
      if (Object.keys(updates).length > 0) {
        const { error } = await client.from("lease_reminders").update(updates).eq("id", lease.id);
        if (error) console.error(`[sync] lease ${lease.id}:`, error.message);
      }
    }
  } catch (err: any) {
    console.error(`[sync] lease_reminders "${fullName}":`, err.message);
  }
}

function extractLeasePeople(body: Record<string, any>) {
  return [
    { name: body.owner1_name, phone: body.owner1_phone, email: body.owner1_email, role: "Owner" },
    { name: body.owner2_name, phone: body.owner2_phone, email: body.owner2_email, role: "Owner" },
    { name: body.tenant1_name, phone: body.tenant1_phone, email: body.tenant1_email, role: "Tenant" },
    { name: body.tenant2_name, phone: body.tenant2_phone, email: body.tenant2_email, role: "Tenant" },
  ];
}

function leaseFields(body: Record<string, any>) {
  return {
    client_type:          body.client_type || null,
    property_address:     body.property_address || null,
    owner1_name:          body.owner1_name || null,
    owner1_phone:         body.owner1_phone || null,
    owner1_email:         body.owner1_email || null,
    owner2_name:          body.owner2_name || null,
    owner2_phone:         body.owner2_phone || null,
    owner2_email:         body.owner2_email || null,
    tenant1_name:         body.tenant1_name || null,
    tenant1_phone:        body.tenant1_phone || null,
    tenant1_email:        body.tenant1_email || null,
    tenant2_name:         body.tenant2_name || null,
    tenant2_phone:        body.tenant2_phone || null,
    tenant2_email:        body.tenant2_email || null,
    lease_start_date:     body.lease_start_date || null,
    lease_end_date:       body.lease_end_date || null,
    notice_reminder_date: body.notice_reminder_date || null,
    lease_status: body.lease_status || "Active",
  };
}

// GET /api/admin/master-clients
app.get("/api/admin/master-clients", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not configured — SUPABASE_SERVICE_ROLE_KEY missing" });
  const { data, error } = await supabaseAdmin.from("master_clients").select("*").order("full_name", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// GET /api/admin/lease-reminders
app.get("/api/admin/lease-reminders", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not configured — SUPABASE_SERVICE_ROLE_KEY missing" });
  const { data, error } = await supabaseAdmin.from("lease_reminders").select("*").order("notice_reminder_date", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// POST /api/admin/master-clients
app.post("/api/admin/master-clients", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not configured" });
  const { client_role, full_name, phone_number, email_address, birthdate, sender_email, greeting_preference } = req.body;
  if (!full_name || !email_address) {
    return res.status(400).json({ error: "full_name and email_address are required" });
  }
  const { error } = await supabaseAdmin.from("master_clients").insert({
    client_role: client_role || null,
    full_name,
    phone_number,
    email_address,
    birthdate: birthdate || null,
    sender_email: sender_email || "ramanimma@texasrealtyhub.com",
    greeting_preference: greeting_preference || "us_only",
  });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// PUT /api/admin/master-clients/:id
app.put("/api/admin/master-clients/:id", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not configured" });
  const { client_role, full_name, phone_number, email_address, birthdate, sender_email, greeting_preference } = req.body;

  // Fetch old name before updating (needed for lease cascade lookup)
  const { data: oldRecord } = await supabaseAdmin
    .from("master_clients")
    .select("full_name")
    .eq("id", req.params.id)
    .single();
  const oldName = oldRecord?.full_name ?? null;

  // Update the master_clients row
  const { error } = await supabaseAdmin.from("master_clients").update({
    client_role: client_role || null,
    full_name,
    phone_number,
    email_address,
    birthdate: birthdate || null,
    sender_email: sender_email || "ramanimma@texasrealtyhub.com",
    greeting_preference: greeting_preference || "us_only",
  }).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });

  // Cascade phone/email across master_clients and all lease_reminders
  if (oldName) {
    await syncContactAcrossAllRecords(supabaseAdmin, oldName, phone_number ?? null, email_address ?? null);
  }

  res.json({ ok: true });
});

// Helper: log a single birthday send (success/failure) as its own mini-campaign
// so it shows up alongside bulk campaigns in the History tab.
async function logBirthdaySend(
  client: ReturnType<typeof createClient>,
  params: {
    clientId: string;
    clientName: string;
    clientEmail: string | null;
    senderEmail: string | null;
    status: "sent" | "failed";
    errorDetail: string | null;
  }
) {
  try {
    const { data: campaign, error: campaignError } = await client
      .from("email_campaigns")
      .insert({
        campaign_type: "birthday",
        campaign_title: `Birthday Wish — ${params.clientName}`,
        recipient_filter: JSON.stringify([params.clientId]),
        total_recipients: 1,
        sent_count: params.status === "sent" ? 1 : 0,
        failed_count: params.status === "failed" ? 1 : 0,
        skipped_count: 0,
        content_html: null,
      })
      .select("id")
      .single();

    if (campaignError || !campaign) return;

    await client.from("email_campaign_recipients").insert({
      campaign_id: campaign.id,
      client_id: params.clientId,
      client_name: params.clientName,
      client_email: params.clientEmail,
      sender_used: params.senderEmail,
      status: params.status,
      error_detail: params.errorDetail,
    });
  } catch (err) {
    // Logging failures should never break the actual send flow
    console.error("[birthday email] failed to log campaign history:", err);
  }
}

// POST /api/admin/send-birthday-email
app.post("/api/admin/send-birthday-email", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not configured" });

  const { clientId } = req.body;
  if (!clientId) return res.status(400).json({ error: "clientId is required" });

  const { data: client, error } = await supabaseAdmin
    .from("master_clients")
    .select("id, full_name, email_address, unsubscribe_token, email_opted_out, sender_email")
    .eq("id", clientId)
    .single();

  if (error || !client) return res.status(404).json({ error: "Client not found" });
  if (!client.email_address) return res.status(400).json({ error: "Client has no email address" });
  if (client.email_opted_out) return res.status(400).json({ error: "Client has opted out of emails" });

  const clientName = client.full_name || "Friend";
  const firstName = clientName.split(" ")[0];
  const senderEmail = client.sender_email || "ramanimma@texasrealtyhub.com";
  const senderName = senderEmail.includes("swetha") ? "Swetha Nimma" : "Rama Nimma";
  const unsubscribeToken = client.unsubscribe_token || "unknown";

  try {
    await sendBirthdayEmail({ toEmail: client.email_address, firstName, senderName, senderEmail, unsubscribeToken });
    await logBirthdaySend(supabaseAdmin, {
      clientId: client.id,
      clientName,
      clientEmail: client.email_address,
      senderEmail,
      status: "sent",
      errorDetail: null,
    });
    res.json({ ok: true });
  } catch (err: any) {
    console.error("[birthday email] error:", err.message);
    await logBirthdaySend(supabaseAdmin, {
      clientId: client.id,
      clientName,
      clientEmail: client.email_address,
      senderEmail,
      status: "failed",
      errorDetail: err.message ?? "Unknown error",
    });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/birthday-clients — today's birthdays, or ?from=MM-DD&to=MM-DD range
app.get("/api/admin/birthday-clients", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not configured" });

  const { data, error } = await supabaseAdmin
    .from("master_clients")
    .select("id, full_name, email_address, birthdate, sender_email, email_opted_out")
    .not("birthdate", "is", null);

  if (error) return res.status(500).json({ error: error.message });

  const monthDay = (dateStr: string): number => {
    const parts = dateStr.split("-");
    const mm = parseInt(parts[1], 10);
    const dd = parseInt(parts[2], 10);
    return mm * 100 + dd;
  };

  const { from, to } = req.query as { from?: string; to?: string };

  let fromNum: number | null = null;
  let toNum: number | null = null;

  const parseMmDd = (s: string): number | null => {
    const m = s.match(/^(\d{1,2})-(\d{1,2})$/);
    if (!m) return null;
    return parseInt(m[1], 10) * 100 + parseInt(m[2], 10);
  };

  if (from && to) {
    fromNum = parseMmDd(from);
    toNum = parseMmDd(to);
    if (fromNum === null || toNum === null) {
      return res.status(400).json({ error: "from/to must be in MM-DD format" });
    }
  } else {
    const today = new Date();
    const mm = today.getMonth() + 1;
    const dd = today.getDate();
    fromNum = toNum = mm * 100 + dd;
  }

  const inRange = (num: number): boolean => {
    if (fromNum === null || toNum === null) return false;
    if (fromNum <= toNum) return num >= fromNum && num <= toNum;
    // Wraparound range (e.g. Dec 28 to Jan 5)
    return num >= fromNum || num <= toNum;
  };

  const results = (data || []).filter((c) => {
    if (!c.birthdate || c.email_opted_out || !c.email_address) return false;
    try {
      return inRange(monthDay(c.birthdate));
    } catch {
      return false;
    }
  });

  res.json(results);
});

// GET /api/admin/preview-birthday-email/:id — returns rendered HTML, no email sent
app.get("/api/admin/preview-birthday-email/:id", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not configured" });

  const { data: client, error } = await supabaseAdmin
    .from("master_clients")
    .select("id, full_name, email_address, unsubscribe_token, sender_email")
    .eq("id", req.params.id)
    .single();

  if (error || !client) return res.status(404).json({ error: "Client not found" });

  const firstName = (client.full_name || "Friend").split(" ")[0];
  const senderEmail = client.sender_email || "ramanimma@texasrealtyhub.com";
  const senderName = senderEmail.includes("swetha") ? "Swetha Nimma" : "Rama Nimma";
  const unsubscribeToken = client.unsubscribe_token || "preview-token";

  const html = buildBirthdayEmailHtml({ toEmail: client.email_address || "", firstName, senderName, senderEmail, unsubscribeToken, isPreview: true });
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// POST /api/admin/send-lease-renewal-email
app.post("/api/admin/send-lease-renewal-email", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not configured" });

  const { leaseId } = req.body;
  if (!leaseId) return res.status(400).json({ error: "leaseId is required" });

  // Manual sends always go through regardless of renewal_email_sent_at —
  // only the automation cron job checks that field before sending.
  const result = await sendLeaseRenewalForLease(supabaseAdmin, leaseId, userId);
  if (!result.ok) return res.status(404).json({ error: result.error || "Failed to send lease renewal emails" });

  return res.json({ ok: true, sent: result.sent, failed: result.failed });
});

// GET /api/admin/preview-lease-renewal-email/:id — returns rendered HTML, no email sent
app.get("/api/admin/preview-lease-renewal-email/:id", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not configured" });

  const { data: lease, error } = await supabaseAdmin
    .from("lease_reminders")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error || !lease) return res.status(404).json({ error: "Lease not found" });

  const propertyAddress = lease.property_address || "your property";
  const leaseEndDate = lease.lease_end_date
    ? new Date(lease.lease_end_date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "N/A";
  const tenantName = lease.tenant1_name || lease.tenant2_name || "Tenant";
  const ownerName = lease.owner1_name || lease.owner2_name || "Owner";

  let senderEmail = "ramanimma@texasrealtyhub.com";
  if (lease.owner1_email) {
    const { data: ownerClient } = await supabaseAdmin
      .from("master_clients")
      .select("sender_email")
      .eq("email_address", lease.owner1_email)
      .maybeSingle();
    if (ownerClient?.sender_email) senderEmail = ownerClient.sender_email;
  }
  const senderName = senderEmail.includes("swetha") ? "Swetha Nimma" : "Rama Nimma";

  const role = typeof req.query.role === "string" ? req.query.role : "tenant";

  let html: string;
  if (role === "owner") {
    html = buildOwnerLeaseRenewalEmail(ownerName, propertyAddress, leaseEndDate, senderName, true);
  } else if (role === "agent") {
    html = buildAgentLeaseRenewalNotificationEmail(propertyAddress, tenantName, leaseEndDate, senderName, true);
  } else {
    html = buildTenantLeaseRenewalEmail(tenantName, propertyAddress, leaseEndDate, senderName, true);
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// POST /api/admin/generate-market-update-draft
app.post("/api/admin/generate-market-update-draft", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;

  const { roughNotes } = req.body;
  if (!roughNotes?.trim()) return res.status(400).json({ error: "roughNotes is required" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      error: "AI_NOT_CONFIGURED",
      message: "AI Draft Generation is not configured yet. Please add an Anthropic API key to enable this feature.",
    });
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: `You are a professional real estate email copywriter for Texas Realty Hub, a luxury real estate agency in Austin, TX.
Write a warm, professional, locally-specific real estate market update email body in HTML format.
Use ONLY these HTML tags: h2, h3, p, ul, li, strong, em, a. No inline styles, no divs, no spans, no tables.
Structure the email loosely around these sections (adapt naturally based on the notes):
1. A warm greeting / intro paragraph
2. Market Snapshot (key stats and trends)
3. Neighborhood Spotlight (Austin-specific insight)
4. Tip of the Month (actionable advice for buyers or sellers)
5. A warm closing paragraph with a call to action (e.g. reach out to discuss)
Keep the tone conversational yet authoritative. Write as if from a trusted local expert. Do not include a subject line, salutation ("Dear [Name]"), or signature — those are handled separately.
Return ONLY the HTML content, no markdown, no backticks, no explanation.`,
      messages: [
        {
          role: "user",
          content: `Write a market update email based on these notes:\n\n${roughNotes}`,
        },
      ],
    });

    const draftHtml =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";
    res.json({ draftHtml });
  } catch (err: any) {
    console.error("[generate-draft] error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/generate-newsletter-from-pdf — extract report text and generate newsletter HTML
app.post("/api/admin/generate-newsletter-from-pdf", pdfUpload.single("pdf"), async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;

  const userNotes = typeof req.body.userNotes === "string" ? req.body.userNotes.trim() : "";
  if (!req.file && !userNotes) {
    return res.status(400).json({ error: "Please upload a PDF or enter market notes." });
  }

  let extractedText = "";
  if (req.file) {
    try {
      const parser = new PDFParse({ data: req.file.buffer });
      const parsed = await parser.getText();
      extractedText = parsed.text?.trim() || "";
      await parser.destroy();
    } catch (err: any) {
      console.error("[generate-newsletter-from-pdf] PDF parsing error:", err.message);
      return res.status(400).json({
        error: "Failed to read PDF. Please make sure it is a valid text-based PDF.",
      });
    }
  }

  if (req.file && !extractedText && !userNotes) {
    return res.status(400).json({
      error: "Could not extract text from PDF. The file may be a scanned image PDF.",
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "AI generation failed. Please try again." });
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `You are a real estate data analyst. Extract information from this Austin market report and return ONLY a valid JSON object with no explanation, no markdown, no code blocks.

Extract these exact fields:
- medianPrice: median home price (e.g. "$485,000")
- medianPriceTrend: short trend vs last period (e.g. "▲ 2%" or "▼ $5,000") or ""
- homesSold: total homes sold (e.g. "342")
- homesSoldTrend: short trend (e.g. "▲ 24 vs last month") or ""
- daysOnMarket: average or median days on market (e.g. "28")
- daysOnMarketTrend: short trend (e.g. "▼ 3 days") or ""
- soldListRatio: sold-to-list price ratio (e.g. "96%")
- soldListRatioTrend: short trend or ""
- pricePerSqFt: price per square foot (e.g. "$245")
- pricePerSqFtTrend: short trend or ""
- inventory: months of supply or active inventory (e.g. "2.1 months")
- inventoryTrend: short trend or ""
- marketSummary: 2-3 sentence summary of overall market conditions using specific numbers
- neighborhoodSpotlight: 2-3 sentences about one specific Greater Austin area (Cedar Park, Leander, Georgetown, Round Rock, Liberty Hill, or Austin) with data from the report
- buyerInsights: exactly 3 bullet points as plain text separated by | character based on current market conditions
- sellerInsights: exactly 3 bullet points as plain text separated by | character based on current market conditions
- tipOfMonth: one practical actionable real estate tip based on current conditions

If a value cannot be found in the report, use empty string "".
IMPORTANT: buyerInsights and sellerInsights MUST always contain exactly 3 insights separated by the | character. Example format: "Homes are staying on market longer, giving buyers more time|Stable prices create better negotiating opportunities|Inventory has improved compared to earlier this year"
Never return empty string for buyerInsights or sellerInsights.
Return ONLY the JSON object, nothing else.

Market Report:
${extractedText}${userNotes ? `\n\nAdditional context: ${userNotes}` : ""}`,
      }],
    });

    let newsletterData: Partial<MarketUpdateNewsletterData>;
    try {
      const rawJson = message.content[0]?.type === "text" ? message.content[0].text.trim() : "";
      newsletterData = JSON.parse(rawJson);
    } catch {
      return res.status(500).json({ error: "Failed to parse AI response. Please try again." });
    }

    console.log("[DEBUG insights check] buyer:", JSON.stringify(newsletterData.buyerInsights), "seller:", JSON.stringify(newsletterData.sellerInsights));
    if (!newsletterData.buyerInsights?.trim() || !newsletterData.sellerInsights?.trim()) {
      const insightsMsg = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        messages: [{
          role: "user",
          content: `You are writing buyer and seller insights for a real estate newsletter.

Market statistics from the official report:
- Median Price: ${newsletterData.medianPrice} (${newsletterData.medianPriceTrend})
- Homes Sold: ${newsletterData.homesSold} (${newsletterData.homesSoldTrend})
- Days on Market: ${newsletterData.daysOnMarket} (${newsletterData.daysOnMarketTrend})
- Sold/List Ratio: ${newsletterData.soldListRatio}
- Price per Sq Ft: ${newsletterData.pricePerSqFt}

${userNotes ? `Additional notes from the agent: ${userNotes}` : ""}

Return ONLY this JSON with real content replacing the placeholders:
{
  "buyerInsights": "one sentence buyer insight using the stats above|one sentence buyer insight|one actionable buyer advice",
  "sellerInsights": "one sentence seller insight using the stats above|one sentence seller insight|one actionable seller advice"
}
`,
        }],
      });

      try {
        const insightsText = insightsMsg.content[0]?.type === "text" ? insightsMsg.content[0].text.trim() : "{}";
        const insightsData = JSON.parse(insightsText);
        if (insightsData.buyerInsights) newsletterData.buyerInsights = insightsData.buyerInsights;
        if (insightsData.sellerInsights) newsletterData.sellerInsights = insightsData.sellerInsights;
      } catch {
        // Keep empty if the focused response cannot be parsed.
      }
    }

    const currentMonth = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const contentHtml = buildMarketUpdateNewsletterHtml({
      medianPrice: newsletterData.medianPrice || "",
      medianPriceTrend: newsletterData.medianPriceTrend || "",
      homesSold: newsletterData.homesSold || "",
      homesSoldTrend: newsletterData.homesSoldTrend || "",
      daysOnMarket: newsletterData.daysOnMarket || "",
      daysOnMarketTrend: newsletterData.daysOnMarketTrend || "",
      soldListRatio: newsletterData.soldListRatio || "",
      soldListRatioTrend: newsletterData.soldListRatioTrend || "",
      pricePerSqFt: newsletterData.pricePerSqFt || "",
      pricePerSqFtTrend: newsletterData.pricePerSqFtTrend || "",
      inventory: newsletterData.inventory || "",
      inventoryTrend: newsletterData.inventoryTrend || "",
      marketSummary: newsletterData.marketSummary || "",
      neighborhoodSpotlight: newsletterData.neighborhoodSpotlight || "",
      buyerInsights: newsletterData.buyerInsights || "",
      sellerInsights: newsletterData.sellerInsights || "",
      tipOfMonth: newsletterData.tipOfMonth || "",
      month: currentMonth,
    });
    console.log("[DEBUG final] buyer:", newsletterData.buyerInsights?.substring(0, 50));
    return res.json({ newsletterHtml: contentHtml });
  } catch (err: any) {
    console.error("[generate-newsletter-from-pdf] AI generation error:", err.message);
    return res.status(500).json({ error: err.message || "AI generation failed. Please try again." });
  }
});

// POST /api/admin/preview-market-update — returns full market update HTML for preview
app.post("/api/admin/preview-market-update", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;

  const data: Partial<MarketUpdateData> = req.body;
  if (!data.medianPrice || !data.marketSummary) {
    return res.status(400).json({ error: "medianPrice and marketSummary are required" });
  }

  const html = buildMarketUpdateEmail({
    month: data.month || new Date().toLocaleString("en-US", { month: "long" }) + " " + new Date().getFullYear(),
    bannerImageUrl: data.bannerImageUrl,
    medianPrice: data.medianPrice || "",
    medianPriceTrend: data.medianPriceTrend,
    daysOnMarket: data.daysOnMarket || "—",
    daysOnMarketTrend: data.daysOnMarketTrend,
    homesSold: data.homesSold || "—",
    homesSoldTrend: data.homesSoldTrend,
    inventory: data.inventory || "—",
    inventoryTrend: data.inventoryTrend,
    neighborhoodSpotlight: data.neighborhoodSpotlight || "",
    buyerInsights: data.buyerInsights || "",
    sellerInsights: data.sellerInsights || "",
    tipOfTheMonth: data.tipOfTheMonth || "",
    marketSummary: data.marketSummary || "",
    recipientName: "Preview",
    senderName: "Rama Nimma",
    senderEmail: "ramanimma@texasrealtyhub.com",
    unsubscribeToken: "preview-token-00000000",
    isPreview: true,
  });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// POST /api/admin/generate-market-update-section — AI-generate one section of the market update
app.post("/api/admin/generate-market-update-section", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;

  const { section, month, medianPrice, daysOnMarket, homesSold, inventory, marketSummary } = req.body;
  if (!section) return res.status(400).json({ error: "section is required" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ error: "AI_NOT_CONFIGURED" });
  }

  const sectionDescriptions: Record<string, string> = {
    neighborhoodSpotlight: "a 2-3 paragraph neighborhood spotlight focusing on a specific Austin neighborhood (e.g. East Austin, South Congress, The Domain, Cedar Park). Include current vibe, recent development, and why buyers/sellers should pay attention to it right now.",
    buyerInsights: "2-3 paragraphs of actionable insights for buyers in the current Austin market. Address financing tips, competition levels, and negotiation advice.",
    sellerInsights: "2-3 paragraphs of actionable insights for sellers in the current Austin market. Address pricing strategy, timing, and what improvements yield best ROI.",
    tipOfTheMonth: "a concise, practical real estate tip relevant to the Austin market this month. Keep it to 1-2 paragraphs.",
  };

  const description = sectionDescriptions[section] || "a relevant real estate market section";
  const stats = [
    medianPrice && `Median home price: ${medianPrice}`,
    daysOnMarket && `Average days on market: ${daysOnMarket}`,
    homesSold && `Homes sold: ${homesSold}`,
    inventory && `Active inventory: ${inventory}`,
  ].filter(Boolean).join(", ");

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      system: `You are a professional real estate copywriter for Texas Realty Hub, a luxury real estate agency in Austin, TX.
Write warm, knowledgeable, locally-specific content.
Use ONLY these HTML tags: h3, p, ul, li, strong, em. No inline styles, no divs, no spans, no tables.
Return ONLY the HTML content — no markdown, no backticks, no explanation.`,
      messages: [
        {
          role: "user",
          content: `Write ${description} for the ${month || "current"} Austin Market Report newsletter.
Current market stats: ${stats || "no stats provided"}.
${marketSummary ? `Overall market summary: ${marketSummary}` : ""}`,
        },
      ],
    });

    const html = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    res.json({ html });
  } catch (err: any) {
    console.error("[generate-market-update-section] error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/upload-market-update-banner — upload a banner image
app.post("/api/admin/upload-market-update-banner", flyerUpload.single("banner"), async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not configured" });

  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  const ext = file.originalname.split(".").pop() || "jpg";
  const filename = `banner-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from("market-update-banners")
    .upload(filename, file.buffer, { contentType: file.mimetype, upsert: true });

  if (uploadError) return res.status(500).json({ error: uploadError.message });

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from("market-update-banners")
    .getPublicUrl(filename);

  res.json({ url: publicUrl });
});

// POST /api/admin/preview-campaign-email — returns branded HTML, no email sent
app.post("/api/admin/preview-campaign-email", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;

  const { contentHtml } = req.body;
  if (!contentHtml?.trim()) return res.status(400).json({ error: "contentHtml is required" });

  const { buildBrandedEmail } = await import("./lib/emailLayout.js");
  const html = buildBrandedEmail({
    contentHtml,
    recipientName: "Preview",
    unsubscribeToken: "preview-token-00000000",
    senderEmail: "ramanimma@texasrealtyhub.com",
    isPreview: true,
  });
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// POST /api/admin/send-test-email — sends ONLY to the admin email
app.post("/api/admin/send-test-email", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;

  const { contentHtml, subjectLine, testRecipientEmail, marketUpdateData } = req.body;
  if (!testRecipientEmail?.trim()) return res.status(400).json({ error: "testRecipientEmail is required" });
  if (!marketUpdateData && !contentHtml?.trim()) return res.status(400).json({ error: "contentHtml or marketUpdateData is required" });

  let html: string;
  if (marketUpdateData) {
    html = buildMarketUpdateEmail({
      ...marketUpdateData,
      recipientName: "Test Recipient",
      senderName: "Rama Nimma",
      senderEmail: "ramanimma@texasrealtyhub.com",
      unsubscribeToken: "test-token-00000000",
    });
  } else {
    const { buildBrandedEmail } = await import("./lib/emailLayout.js");
    html = buildBrandedEmail({
      contentHtml,
      recipientName: "Test Recipient",
      unsubscribeToken: "test-token-00000000",
      senderEmail: "ramanimma@texasrealtyhub.com",
    });
  }

  try {
    await resend.emails.send({
      from: `Texas Realty Hub <ramanimma@texasrealtyhub.com>`,
      to: testRecipientEmail,
      subject: `[TEST] ${subjectLine || "Campaign Preview"}`,
      html,
    });
    res.json({ ok: true });
  } catch (err: any) {
    console.error("[send-test-email] error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/send-campaign
app.post("/api/admin/send-campaign", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not configured" });

  const { campaignType, campaignTitle, recipientFilter, contentHtml, subjectLine, marketUpdateData } = req.body;
  if (!campaignType || !campaignTitle || !recipientFilter || !subjectLine) {
    return res.status(400).json({
      error: "Missing required fields: campaignType, campaignTitle, recipientFilter, subjectLine",
    });
  }
  if (campaignType === "monthly_market_update" && !marketUpdateData) {
    return res.status(400).json({ error: "marketUpdateData is required for monthly_market_update" });
  }
  if (campaignType !== "monthly_market_update" && !contentHtml) {
    return res.status(400).json({ error: "contentHtml is required for this campaign type" });
  }

  try {
    const result = await sendCampaign({
      campaignType,
      campaignTitle,
      recipientFilter,
      contentHtml: contentHtml || "",
      subjectLine,
      createdBy: userId,
      marketUpdateData: marketUpdateData ?? undefined,
    });
    res.json(result);
  } catch (err: any) {
    console.error("[send-campaign] error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/email-campaigns
app.get("/api/admin/email-campaigns", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not configured" });

  const { data, error } = await supabaseAdmin
    .from("email_campaigns")
    .select("*")
    .order("sent_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/admin/email-campaigns/:id/recipients
app.get("/api/admin/email-campaigns/:id/recipients", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not configured" });

  const { data, error } = await supabaseAdmin
    .from("email_campaign_recipients")
    .select("*")
    .eq("campaign_id", req.params.id)
    .order("sent_at", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/admin/email-campaigns/search?q={query}
app.get("/api/admin/email-campaigns/search", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not configured" });

  const q = (req.query.q as string || "").trim();
  if (!q) return res.json([]);

  const { data, error } = await supabaseAdmin
    .from("email_campaign_recipients")
    .select(
      "id, campaign_id, client_id, client_name, client_email, sender_used, status, error_detail, sent_at, email_campaigns(campaign_title, campaign_type, sent_at)"
    )
    .or(`client_name.ilike.%${q}%,client_email.ilike.%${q}%`)
    .order("sent_at", { ascending: false });

  if (error) {
    console.error("[email-campaigns/search] error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  const results = (data || []).map((r: any) => ({
    id: r.id,
    campaign_id: r.campaign_id,
    client_id: r.client_id,
    client_name: r.client_name,
    client_email: r.client_email,
    sender_used: r.sender_used,
    status: r.status,
    error_detail: r.error_detail,
    sent_at: r.email_campaigns?.sent_at ?? r.sent_at,
    campaign_title: r.email_campaigns?.campaign_title ?? "Untitled",
    campaign_type: r.email_campaigns?.campaign_type ?? "unknown",
  }));

  res.json(results);
});

// DELETE /api/admin/master-clients/:id
app.delete("/api/admin/master-clients/:id", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not configured" });
  const { error } = await supabaseAdmin.from("master_clients").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// DELETE /api/admin/lease-reminders/:id
app.delete("/api/admin/lease-reminders/:id", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not configured" });
  const { error } = await supabaseAdmin.from("lease_reminders").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// POST /api/admin/lease-reminders
app.post("/api/admin/lease-reminders", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not configured" });
  const { error } = await supabaseAdmin.from("lease_reminders").insert(leaseFields(req.body));
  if (error) return res.status(500).json({ error: error.message });
  // For a brand new lease, ensure every owner/tenant exists in master_clients (insert if missing, update phone/email if found)
  for (const person of extractLeasePeople(req.body)) {
    if (person.name) await syncMasterClients(supabaseAdmin, [person]);
  }
  res.json({ ok: true });
});

// PUT /api/admin/lease-reminders/:id
app.put("/api/admin/lease-reminders/:id", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not configured" });

  // Fetch the old lease before updating so we can detect name changes per slot
  const { data: oldLease } = await supabaseAdmin
    .from("lease_reminders")
    .select("owner1_name, owner1_phone, owner1_email, owner2_name, owner2_phone, owner2_email, tenant1_name, tenant1_phone, tenant1_email, tenant2_name, tenant2_phone, tenant2_email")
    .eq("id", req.params.id)
    .single();

  const { error } = await supabaseAdmin.from("lease_reminders").update(leaseFields(req.body)).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });

  const norm = (s: string | null | undefined) => s?.trim().toLowerCase() ?? "";

  const slots = [
    { oldName: oldLease?.owner1_name, newName: req.body.owner1_name, newPhone: req.body.owner1_phone, newEmail: req.body.owner1_email, role: "Owner" },
    { oldName: oldLease?.owner2_name, newName: req.body.owner2_name, newPhone: req.body.owner2_phone, newEmail: req.body.owner2_email, role: "Owner" },
    { oldName: oldLease?.tenant1_name, newName: req.body.tenant1_name, newPhone: req.body.tenant1_phone, newEmail: req.body.tenant1_email, role: "Tenant" },
    { oldName: oldLease?.tenant2_name, newName: req.body.tenant2_name, newPhone: req.body.tenant2_phone, newEmail: req.body.tenant2_email, role: "Tenant" },
  ];

  for (const slot of slots) {
    const newName = slot.newName?.trim();
    if (!newName) continue;

    if (norm(slot.oldName) !== norm(slot.newName)) {
      // Completely new person in this slot: add or update master_clients
      await syncMasterClients(supabaseAdmin, [{ name: newName, phone: slot.newPhone, email: slot.newEmail, role: slot.role }]);
    } else {
      // Same person, only contact info may have changed: cascade across master_clients + lease_reminders
      await syncContactAcrossAllRecords(supabaseAdmin, newName, slot.newPhone, slot.newEmail);
    }
  }

  res.json({ ok: true });
});

// POST /api/admin/import-client-database
app.post("/api/admin/import-client-database", upload.single("file"), async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });
  const client = supabaseAdmin;
  if (!client) return res.status(500).json({ error: "Supabase admin client not configured — SUPABASE_SERVICE_ROLE_KEY missing" });

  try {
    const workbook = XLSX.read(file.buffer, { type: "buffer", cellDates: true });

    // ── Master Clients ──────────────────────────────────────────────────────
    const mcSheet = workbook.Sheets["Master Clients"];
    if (!mcSheet) return res.status(400).json({ error: "Sheet 'Master Clients' not found in the workbook" });

    const formatDate = (val: any): string | null => {
      if (!val) return null;
      if (val instanceof Date) return val.toISOString().slice(0, 10);
      if (typeof val === "string" && val.trim()) return val.trim().slice(0, 10);
      return null;
    };

    const mcRows = XLSX.utils.sheet_to_json<Record<string, any>>(mcSheet, { defval: null });
    const masterClients = mcRows
      .map((row) => ({
        client_role: row["Client Role / Type"] ?? null,
        full_name: row["Full Name"] ?? null,
        phone_number: row["Phone Number"] != null ? String(row["Phone Number"]) : null,
        email_address: row["Email Address"] ?? null,
        birthdate: formatDate(row["Birthdate"]),
      }))
      .filter((r) => r.full_name || r.email_address);

    // ── Lease Reminders ─────────────────────────────────────────────────────
    const lrSheet = workbook.Sheets["Lease Reminders"];
    if (!lrSheet) return res.status(400).json({ error: "Sheet 'Lease Reminders' not found in the workbook" });

    const lrRaw = XLSX.utils.sheet_to_json<any[]>(lrSheet, { header: 1, defval: null });
    const lrDataRows = lrRaw.slice(1).filter((row) => row.some((v: any) => v !== null && v !== ""));

    const leaseReminders = lrDataRows.map((row: any[]) => ({
      client_type:            row[0]  ?? null,
      property_address:       row[1]  ?? null,
      owner1_name:            row[2]  ?? null,
      owner1_phone:           row[3]  != null ? String(row[3]) : null,
      owner1_email:           row[4]  ?? null,
      owner2_name:            row[5]  ?? null,
      owner2_phone:           row[6]  != null ? String(row[6]) : null,
      owner2_email:           row[7]  ?? null,
      tenant1_name:           row[8]  ?? null,
      tenant1_phone:          row[9]  != null ? String(row[9]) : null,
      tenant1_email:          row[10] ?? null,
      tenant2_name:           row[11] ?? null,
      tenant2_phone:          row[12] != null ? String(row[12]) : null,
      tenant2_email:          row[13] ?? null,
      lease_start_date:       formatDate(row[14]),
      lease_end_date:         formatDate(row[15]),
      notice_reminder_date:   formatDate(row[16]),
    })).filter((r) => r.property_address || r.owner1_name || r.tenant1_name);

    // ── Clear existing records ──────────────────────────────────────────────
    const { error: delMcErr } = await client.from("master_clients").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (delMcErr) return res.status(500).json({ error: `Failed to clear master_clients: ${delMcErr.message}` });

    const { error: delLrErr } = await client.from("lease_reminders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (delLrErr) return res.status(500).json({ error: `Failed to clear lease_reminders: ${delLrErr.message}` });

    // ── Insert fresh records ────────────────────────────────────────────────
    if (masterClients.length > 0) {
      const { error } = await client.from("master_clients").insert(masterClients);
      if (error) return res.status(500).json({ error: `Failed to insert master clients: ${error.message}` });
    }

    if (leaseReminders.length > 0) {
      const { error } = await client.from("lease_reminders").insert(leaseReminders);
      if (error) return res.status(500).json({ error: `Failed to insert lease reminders: ${error.message}` });
    }

    res.json({ success: true, masterClientsCount: masterClients.length, leaseRemindersCount: leaseReminders.length });
  } catch (err: any) {
    console.error("Import error:", err);
    res.status(500).json({ error: `Import failed: ${err.message}` });
  }
});

// ─── CHATBOT ROUTES ──────────────────────────────────────────────────────────
app.use("/api/chatbot", createChatbotRouter(supabaseAdmin, supabaseAnon));

// ─── SITEMAP & ROBOTS ────────────────────────────────────────────────────────
const BASE_URL = "https://texasrealtyhub.com";

app.get("/sitemap.xml", async (_req, res) => {
  const today = new Date().toISOString().split("T")[0];

  const [{ data: listings }, { data: neighborhoods }] = await Promise.all([
    supabaseAnon.from("listings").select("id").eq("status", "active"),
    supabaseAnon.from("neighborhoods").select("slug").eq("is_active", true),
  ]);

  const staticPages = [
    { path: "/",                    priority: "1.0", changefreq: "daily"   },
    { path: "/properties",          priority: "0.9", changefreq: "daily"   },
    { path: "/about",               priority: "0.6", changefreq: "monthly" },
    { path: "/contact",             priority: "0.6", changefreq: "monthly" },
    { path: "/home-valuation",      priority: "0.6", changefreq: "monthly" },
    { path: "/mortgage-calculator", priority: "0.6", changefreq: "monthly" },
    { path: "/sellers-netsheet",    priority: "0.6", changefreq: "monthly" },
    { path: "/title-calculator",    priority: "0.6", changefreq: "monthly" },
  ];

  const urls = [
    ...staticPages.map(({ path, priority, changefreq }) =>
      `  <url>\n    <loc>${BASE_URL}${path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
    ),
    ...(neighborhoods ?? []).map(({ slug }) =>
      `  <url>\n    <loc>${BASE_URL}/neighborhoods/${slug}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`
    ),
    ...(listings ?? []).map(({ id }) =>
      `  <url>\n    <loc>${BASE_URL}/property/${id}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.send(xml);
});

app.get("/robots.txt", (_req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.send(
    `User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${BASE_URL}/sitemap.xml\n`
  );
});

// ─── APPOINTMENTS ─────────────────────────────────────────────────────────────

function todayInCT(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
}
function sevenDaysLaterInCT(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
}

// GET /api/admin/appointments
app.get("/api/admin/appointments", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not configured" });

  const filter = (req.query.filter as string) || "all";
  const today = todayInCT();

  let query = supabaseAdmin
    .from("appointments")
    .select("*")
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true });

  if (filter === "today") {
    query = query.eq("appointment_date", today);
  } else if (filter === "upcoming") {
    query = query.gt("appointment_date", today).lte("appointment_date", sevenDaysLaterInCT());
  } else if (filter === "past") {
    query = query.lt("appointment_date", today);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// POST /api/admin/appointments
app.post("/api/admin/appointments", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not configured" });

  const { appointment_date, appointment_time, property_address, client_name } = req.body;
  if (!appointment_date || !appointment_time || !property_address || !client_name) {
    return res.status(400).json({ error: "appointment_date, appointment_time, property_address, and client_name are required" });
  }

  const { data, error } = await supabaseAdmin
    .from("appointments")
    .insert(req.body)
    .select("id")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, id: data.id });
});

// PUT /api/admin/appointments/:id
app.put("/api/admin/appointments/:id", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not configured" });

  const { id } = req.params;
  const { data: existing } = await supabaseAdmin.from("appointments").select("id").eq("id", id).single();
  if (!existing) return res.status(404).json({ error: "Appointment not found" });

  const { error } = await supabaseAdmin.from("appointments").update(req.body).eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// DELETE /api/admin/appointments/:id
app.delete("/api/admin/appointments/:id", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not configured" });

  const { error } = await supabaseAdmin.from("appointments").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// GET /api/unsubscribe?token={uuid}  — public, no auth required
app.get("/api/unsubscribe", async (req, res) => {
  const token = req.query.token as string | undefined;
  if (!token) return res.status(400).json({ error: "Missing token" });
  if (!supabaseAdmin) return res.status(500).json({ error: "Server not configured" });

  const { data, error } = await supabaseAdmin
    .from("master_clients")
    .select("id")
    .eq("unsubscribe_token", token)
    .single();

  if (error || !data) return res.status(404).json({ error: "Token not found or already processed" });

  const { error: updateErr } = await supabaseAdmin
    .from("master_clients")
    .update({ email_opted_out: true })
    .eq("unsubscribe_token", token);

  if (updateErr) return res.status(500).json({ error: updateErr.message });
  res.json({ ok: true, message: "Successfully unsubscribed" });
});

// ─── HOLIDAYS ────────────────────────────────────────────────────────────────

// GET /api/admin/holidays
app.get("/api/admin/holidays", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not configured" });

  const { data, error } = await supabaseAdmin
    .from("holidays")
    .select("*")
    .order("holiday_date", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// POST /api/admin/holidays
app.post("/api/admin/holidays", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not configured" });

  const { name, type, holiday_date, year, is_active } = req.body;
  if (!name || !holiday_date || !year) {
    return res.status(400).json({ error: "name, holiday_date, and year are required" });
  }

  const { error } = await supabaseAdmin.from("holidays").insert({
    name,
    type: type || "us",
    holiday_date,
    year,
    is_active: is_active !== undefined ? is_active : true,
  });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// PUT /api/admin/holidays/:id
app.put("/api/admin/holidays/:id", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not configured" });

  const { name, type, holiday_date, year, is_active } = req.body;

  const { error } = await supabaseAdmin.from("holidays").update({
    name,
    type,
    holiday_date,
    year,
    is_active,
  }).eq("id", req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// DELETE /api/admin/holidays/:id
app.delete("/api/admin/holidays/:id", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not configured" });

  const { error } = await supabaseAdmin.from("holidays").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// GET /api/admin/preview-holiday-greeting/:id
app.get("/api/admin/preview-holiday-greeting/:id", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not configured" });

  const { id } = req.params;
  const audience = (req.query.audience as string) || "us";

  const { data: holiday, error } = await supabaseAdmin
    .from("holidays")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !holiday) return res.status(404).json({ error: "Holiday not found" });

  const { data: clients, error: clientError } = await supabaseAdmin
    .from("master_clients")
    .select("full_name, email_address, greeting_preference, email_opted_out")
    .not("email_address", "is", null);

  if (clientError) return res.status(500).json({ error: clientError.message });

  const recipientCount = (clients || []).filter((c) => {
    if (!c.email_address || c.email_opted_out) return false;
    if (audience === "us") return c.greeting_preference !== "none";
    return c.greeting_preference === "indian_and_us";
  }).length;

  const { buildHolidayGreetingEmail } = await import("./lib/templates/holidayGreetingEmail.js");
  const html = buildHolidayGreetingEmail("Friend", holiday.name, holiday.type as "us" | "indian", "Rama Nimma", true, holiday.flyer_url);

  res.json({
    html,
    subject: `Happy ${holiday.name} from Texas Realty Hub! 🎉`,
    recipientCount,
  });
});

// POST /api/admin/send-holiday-greeting/:id
app.post("/api/admin/send-holiday-greeting/:id", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not configured" });

  const { id } = req.params;

  const { data: holiday, error } = await supabaseAdmin
    .from("holidays")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !holiday) return res.status(404).json({ error: "Holiday not found" });

  const { data: clients, error: clientError } = await supabaseAdmin
    .from("master_clients")
    .select("id, full_name, email_address, sender_email, greeting_preference, email_opted_out, unsubscribe_token")
    .not("email_address", "is", null);

  if (clientError) return res.status(500).json({ error: clientError.message });

  const isUS = holiday.type === "us";
  const recipients = (clients || []).filter((c) => {
    if (!c.email_address || c.email_opted_out) return false;
    if (isUS) return c.greeting_preference !== "none";
    return c.greeting_preference === "indian_and_us";
  });

  if (recipients.length === 0) {
    return res.json({ sent: 0, failed: 0, skipped: 0 });
  }

  const { sendHolidayGreetingEmail } = await import("./lib/email.js");
  let sent = 0;
  let failed = 0;
  const recipientLogs: Array<{
    client_id: string | null;
    client_name: string;
    client_email: string | null;
    sender_used: string | null;
    status: string;
    error_detail: string | null;
  }> = [];

  for (const client of recipients) {
    const senderEmail = client.sender_email || "ramanimma@texasrealtyhub.com";
    const senderName = senderEmail.includes("swetha") ? "Swetha Nimma" : "Rama Nimma";
    const firstName = (client.full_name || "Friend").split(" ")[0];

    let status: "sent" | "failed" = "sent";
    let errorDetail: string | null = null;

    try {
      await sendHolidayGreetingEmail({
        toEmail: client.email_address,
        recipientName: firstName,
        holidayName: holiday.name,
        holidayType: holiday.type as "us" | "indian",
        senderName,
        senderEmail,
        flyerUrl: holiday.flyer_url,
      });
      sent++;
    } catch (err: any) {
      failed++;
      status = "failed";
      errorDetail = err?.message || "Unknown error";
    }

    recipientLogs.push({
      client_id: client.id,
      client_name: client.full_name || "Friend",
      client_email: client.email_address,
      sender_used: senderEmail,
      status,
      error_detail: errorDetail,
    });
  }

  // Log campaign
  try {
    const { data: campaign } = await supabaseAdmin
      .from("email_campaigns")
      .insert({
        campaign_type: "holiday",
        campaign_title: `Holiday Greeting — ${holiday.name}`,
        recipient_filter: JSON.stringify({ holidayId: holiday.id, type: holiday.type }),
        total_recipients: recipients.length,
        sent_count: sent,
        failed_count: failed,
        skipped_count: 0,
        created_by: userId,
        content_html: null,
      })
      .select("id")
      .single();

    if (campaign) {
      await supabaseAdmin
        .from("email_campaign_recipients")
        .insert(recipientLogs.map((r) => ({ ...r, campaign_id: campaign.id })));
    }
  } catch (err) {
    console.error("[holiday send] failed to log campaign:", err);
  }

  // Mark holiday as sent
  if (sent > 0) {
    await supabaseAdmin
      .from("holidays")
      .update({ greeting_email_sent_at: new Date().toISOString() })
      .eq("id", id);
  }

  res.json({ sent, failed, skipped: 0 });
});

// POST /api/admin/upload-holiday-flyer/:id
app.post("/api/admin/upload-holiday-flyer/:id", flyerUpload.single("flyer"), async (req, res) => {
  const { id } = req.params;
  console.log("[flyer-upload] Starting upload for holiday:", id);

  const userId = await verifyAdmin(req, res);
  console.log("[flyer-upload] Admin verification complete:", userId ? "authenticated" : "rejected");
  if (!userId) return;

  const file = req.file;
  console.log("[flyer-upload] File received:", file ? "yes" : "no");
  if (!file) {
    console.error("[flyer-upload] No file was provided");
    return res.status(400).json({ error: "No file uploaded. JPG, PNG, WebP up to 2MB accepted." });
  }

  console.log("[flyer-upload] File:", file.originalname, file.mimetype, file.size);

  const client = supabaseAdmin;
  console.log("[flyer-upload] Supabase admin client available:", Boolean(client));
  if (!client) {
    console.error("[flyer-upload] Supabase admin client is not configured");
    return res.status(500).json({ error: "Storage not configured" });
  }

  const filename = `holiday-${id}-${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
  console.log("[flyer-upload] Storage filename:", filename);
  console.log("[flyer-upload] Uploading file to holiday-flyers bucket");
  const { error: uploadError } = await client.storage
    .from("holiday-flyers")
    .upload(filename, file.buffer, { contentType: file.mimetype, upsert: true });

  if (uploadError) {
    console.error("[flyer-upload] Supabase upload failed:", JSON.stringify({
      message: uploadError.message,
      name: uploadError.name,
      status: uploadError.status,
      statusCode: uploadError.statusCode,
      details: uploadError.details,
      hint: uploadError.hint,
    }));
    return res.status(500).json({ error: `Upload failed: ${uploadError.message}` });
  }
  console.log("[flyer-upload] Storage upload completed successfully");

  console.log("[flyer-upload] Generating public URL");
  const { data } = client.storage.from("holiday-flyers").getPublicUrl(filename);
  const publicUrl = data.publicUrl;
  console.log("[flyer-upload] Public URL generated:", publicUrl);

  console.log("[flyer-upload] Updating holiday flyer_url in database");
  const { error: dbError } = await client.from("holidays").update({ flyer_url: publicUrl }).eq("id", id);
  if (dbError) {
    console.error("[flyer-upload] Database update failed:", JSON.stringify({
      message: dbError.message,
      name: dbError.name,
      code: dbError.code,
      details: dbError.details,
      hint: dbError.hint,
    }));
    return res.status(500).json({ error: `Saved to storage but failed to update holiday: ${dbError.message}` });
  }

  console.log("[flyer-upload] Holiday flyer upload completed:", id);
  res.json({ url: publicUrl });
});

// POST /api/admin/trigger-automation-test — manually fire the daily automation for testing
app.post("/api/admin/trigger-automation-test", async (req, res) => {
  const userId = await verifyAdmin(req, res);
  if (!userId) return;
  try {
    await sendTodaysBirthdayEmails();
    await sendTodaysLeaseRenewalEmails();
    await sendTodaysHolidayGreetings();
    res.json({ ok: true, message: "Automation triggered successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Daily automation: birthday + lease renewal + holiday emails. Only runs in production —
// never in dev/testing — so local work never triggers real sends.
if (process.env.NODE_ENV === "production") {
  cron.schedule(
    "0 9 * * *",
    async () => {
      console.log("[Automation] Running daily email jobs...");
      await sendTodaysBirthdayEmails();
      await sendTodaysLeaseRenewalEmails();
      await sendTodaysHolidayGreetings();
    },
    { timezone: "America/Chicago" }
  );
  console.log("[Automation] Daily email cron job scheduled for 9:00 AM CT");
}

// ─── SERVE FRONTEND IN PRODUCTION ────────────────────────────────────────────
// Catch-all MUST be the LAST route registered so it doesn't intercept /api/*.
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "../dist");
  app.use(express.static(distPath));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const PORT = parseInt(process.env.PORT || "3001");
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
