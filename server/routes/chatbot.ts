import { Router, Request, Response } from "express";

function parsePriceText(price: string): number | null {
  if (!price) return null;
  const cleaned = price.replace(/[$,\s]/g, "").replace(/\/mo.*/i, "");
  const kM = cleaned.match(/^([\d.]+)k$/i);
  if (kM) return parseFloat(kM[1]) * 1000;
  const mM = cleaned.match(/^([\d.]+)m$/i);
  if (mM) return parseFloat(mM[1]) * 1_000_000;
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

async function silentInsert(db: any, table: string, data: object) {
  try { await db.from(table).insert(data); } catch (_) {}
}

export function createChatbotRouter(supabaseAdmin: any, supabaseAnon: any) {
  const router = Router();

  router.post("/search", async (req: Request, res: Response) => {
    const { filters = {}, session_token, user_message = "" } = req.body;
    const db = supabaseAdmin ?? supabaseAnon;

    try {
      let query = db.from("listings").select("*");

      if (filters.city) query = query.ilike("city", filters.city);
      if (filters.beds) query = query.eq("beds", Number(filters.beds));
      if (filters.baths) query = query.gte("baths", Number(filters.baths));
      if (filters.property_type) query = query.ilike("property_type", `%${filters.property_type}%`);
      if (filters.listing_type) query = query.ilike("listing_type", filters.listing_type);
      if (filters.status) query = query.ilike("status", filters.status);

      query = query.order("created_at", { ascending: false }).limit(20);

      const { data: raw, error } = await query;
      if (error) return res.status(500).json({ error: error.message });

      let listings = raw ?? [];

      if (filters.max_price) {
        listings = listings.filter((l: any) => {
          const p = parsePriceText(l.price ?? "");
          return p === null || p <= Number(filters.max_price);
        });
      }
      if (filters.min_price) {
        listings = listings.filter((l: any) => {
          const p = parsePriceText(l.price ?? "");
          return p === null || p >= Number(filters.min_price);
        });
      }

      if (session_token) {
        await silentInsert(db, "chat_sessions", {
          id: session_token,
          page_url: req.headers.referer ?? null,
          started_at: new Date().toISOString(),
        });

        if (user_message) {
          await silentInsert(db, "chat_messages", {
            session_id: session_token,
            message: user_message,
            is_agent: false,
            sent_at: new Date().toISOString(),
          });
        }
      }

      await silentInsert(db, "search_analytics", {
        query_text: user_message,
        parsed_filters: filters,
        results_count: listings.length,
        searched_at: new Date().toISOString(),
      });

      res.json({ listings });
    } catch (err: any) {
      res.status(500).json({ error: err?.message ?? "Internal server error" });
    }
  });

  return router;
}
