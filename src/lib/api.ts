import { supabase } from "@/integrations/supabase/client";

const BASE = "/api";

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

async function adminRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await authHeaders();
  return request<T>(path, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string> || {}) },
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const api = {
  listings: {
    list: () => request<Listing[]>("/listings"),
    get: (id: string) => request<Listing>(`/listings/${id}`),
  },
  agentProfile: {
    get: () => request<AgentProfile | null>("/agent-profile"),
  },
  reviews: {
    list: () => request<Review[]>("/reviews"),
    submit: (data: { client_name: string; rating: number; comment: string }) =>
      request<{ ok: boolean }>("/reviews", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  adminExists: () => request<{ exists: boolean }>("/admin-exists"),
  agents: {
    list: () => request<Agent[]>("/agents"),
  },
  neighborhoods: {
    list: () => request<Neighborhood[]>("/neighborhoods"),
    getBySlug: (slug: string) => request<Neighborhood>(`/neighborhoods/${slug}`),
    getListings: (slug: string) => request<Listing[]>(`/neighborhoods/${slug}/listings`),
  },
  inquiries: {
    submit: (data: InquirySubmit) =>
      request<{ ok: boolean; id?: string }>("/inquiries", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  newsletter: {
    subscribe: (data: { full_name: string; email: string }) =>
      request<{ ok: boolean }>("/newsletter", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  valuations: {
    submit: (data: ValuationSubmit) =>
      request<{ ok: boolean; id?: string }>("/home-valuations", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  heroVideos: {
    list: () => request<HeroVideo[]>("/hero-videos"),
  },
};

// ─── Admin API ────────────────────────────────────────────────────────────────

export const adminApi = {
  listings: {
    list: () => adminRequest<Listing[]>("/admin/listings"),
    create: (data: Partial<Listing>) =>
      adminRequest<{ ok: boolean }>("/admin/listings", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Listing>) =>
      adminRequest<{ ok: boolean }>(`/admin/listings/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      adminRequest<{ ok: boolean }>(`/admin/listings/${id}`, {
        method: "DELETE",
      }),
  },
  reviews: {
    list: () => adminRequest<Review[]>("/admin/reviews"),
    update: (id: string, data: Partial<Review>) =>
      adminRequest<{ ok: boolean }>(`/admin/reviews/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      adminRequest<{ ok: boolean }>(`/admin/reviews/${id}`, {
        method: "DELETE",
      }),
  },
  agentProfile: {
    get: () => adminRequest<AgentProfile | null>("/admin/agent-profile"),
    create: (data: Partial<AgentProfile>) =>
      adminRequest<{ ok: boolean }>("/admin/agent-profile", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<AgentProfile>) =>
      adminRequest<{ ok: boolean }>(`/admin/agent-profile/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },
  dashboardStats: () => adminRequest<DashboardStats>("/admin/dashboard-stats"),
  inquiries: {
    list: () => adminRequest<Inquiry[]>("/admin/inquiries"),
    update: (id: string, data: Partial<Inquiry>) =>
      adminRequest<{ ok: boolean }>(`/admin/inquiries/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) =>
      adminRequest<{ ok: boolean }>(`/admin/inquiries/${id}`, { method: "DELETE" }),
  },
  contacts: {
    list: () => adminRequest<Contact[]>("/admin/contacts"),
    create: (data: Partial<Contact>) =>
      adminRequest<{ ok: boolean }>("/admin/contacts", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Contact>) =>
      adminRequest<{ ok: boolean }>(`/admin/contacts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) =>
      adminRequest<{ ok: boolean }>(`/admin/contacts/${id}`, { method: "DELETE" }),
  },
  agents: {
    list: () => adminRequest<Agent[]>("/admin/agents"),
    update: (id: string, data: Partial<Agent>) =>
      adminRequest<{ ok: boolean }>(`/admin/agents/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  },
  neighborhoods: {
    list: () => adminRequest<Neighborhood[]>("/admin/neighborhoods"),
    create: (data: Partial<Neighborhood>) =>
      adminRequest<{ ok: boolean }>("/admin/neighborhoods", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Neighborhood>) =>
      adminRequest<{ ok: boolean }>(`/admin/neighborhoods/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) =>
      adminRequest<{ ok: boolean }>(`/admin/neighborhoods/${id}`, { method: "DELETE" }),
  },
  chatSessions: {
    list: () => adminRequest<ChatSession[]>("/admin/chat-sessions"),
    messages: (id: string) => adminRequest<ChatMessage[]>(`/admin/chat-sessions/${id}/messages`),
  },
  heroVideos: {
    list: () => adminRequest<HeroVideo[]>("/admin/hero-videos"),
    create: (data: { title?: string; cloudinary_url: string; display_order?: number; is_active?: boolean }) =>
      adminRequest<{ ok: boolean }>("/admin/hero-videos", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<HeroVideo>) =>
      adminRequest<{ ok: boolean }>(`/admin/hero-videos/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) =>
      adminRequest<{ ok: boolean }>(`/admin/hero-videos/${id}`, { method: "DELETE" }),
  },
  masterClients: {
    list: () => adminRequest<MasterClient[]>("/admin/master-clients"),
    create: (data: Partial<MasterClient>) =>
      adminRequest<{ ok: boolean }>("/admin/master-clients", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<MasterClient>) =>
      adminRequest<{ ok: boolean }>(`/admin/master-clients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) =>
      adminRequest<{ ok: boolean }>(`/admin/master-clients/${id}`, { method: "DELETE" }),
    sendBirthdayEmail: (id: string) =>
      adminRequest<{ ok: boolean }>("/admin/send-birthday-email", { method: "POST", body: JSON.stringify({ clientId: id }) }),
    birthdayClients: (params?: { from: string; to: string }) => {
      const qs = params ? `?from=${params.from}&to=${params.to}` : "";
      return adminRequest<MasterClient[]>(`/admin/birthday-clients${qs}`);
    },
  },
  leaseReminders: {
    list: () => adminRequest<LeaseReminder[]>("/admin/lease-reminders"),
    create: (data: Partial<LeaseReminder>) =>
      adminRequest<{ ok: boolean }>("/admin/lease-reminders", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<LeaseReminder>) =>
      adminRequest<{ ok: boolean }>(`/admin/lease-reminders/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) =>
      adminRequest<{ ok: boolean }>(`/admin/lease-reminders/${id}`, { method: "DELETE" }),
    sendRenewalEmail: (id: string) =>
      adminRequest<{ ok: boolean; sent: number; failed: number }>("/admin/send-lease-renewal-email", {
        method: "POST",
        body: JSON.stringify({ leaseId: id }),
      }),
  },
  emailCampaigns: {
    list: () => adminRequest<EmailCampaign[]>("/admin/email-campaigns"),
    recipients: (id: string) =>
      adminRequest<EmailCampaignRecipient[]>(`/admin/email-campaigns/${id}/recipients`),
    search: (q: string) =>
      adminRequest<EmailCampaignSearchResult[]>(`/admin/email-campaigns/search?q=${encodeURIComponent(q)}`),
  },
  holidays: {
    list: () => adminRequest<Holiday[]>("/admin/holidays"),
    create: (data: Partial<Holiday>) =>
      adminRequest<{ ok: boolean }>("/admin/holidays", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Holiday>) =>
      adminRequest<{ ok: boolean }>(`/admin/holidays/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) =>
      adminRequest<{ ok: boolean }>(`/admin/holidays/${id}`, { method: "DELETE" }),
    sendGreeting: (id: string) =>
      adminRequest<{ sent: number; failed: number; skipped: number }>(`/admin/send-holiday-greeting/${id}`, { method: "POST" }),
    preview: (id: string, audience?: string) => {
      const qs = audience ? `?audience=${audience}` : "";
      return adminRequest<{ html: string; subject: string; recipientCount: number }>(`/admin/preview-holiday-greeting/${id}${qs}`);
    },
    uploadFlyer: async (id: string, file: File, onProgress?: (pct: number) => void) => {
      const headers = await authHeaders();
      const form = new FormData();
      form.append("flyer", file);
      return new Promise<{ url: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${BASE}/admin/upload-holiday-flyer/${id}`);
        if (headers.Authorization) xhr.setRequestHeader("Authorization", headers.Authorization);
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            let body: any = {};
            try { body = JSON.parse(xhr.responseText); } catch {}
            reject(new Error(body.error || `Upload failed: ${xhr.status}`));
          }
        });
        xhr.addEventListener("error", () => reject(new Error("Upload failed: network error")));
        xhr.send(form);
      });
    },
  },
  appointments: {
    list: (filter?: string) => {
      const qs = filter ? `?filter=${filter}` : "";
      return adminRequest<Appointment[]>(`/admin/appointments${qs}`);
    },
    create: (data: Partial<Appointment>) =>
      adminRequest<{ ok: boolean; id: string }>("/admin/appointments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Appointment>) =>
      adminRequest<{ ok: boolean }>(`/admin/appointments/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      adminRequest<{ ok: boolean }>(`/admin/appointments/${id}`, { method: "DELETE" }),
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MasterClient {
  id: string;
  client_role: string | null;
  full_name: string | null;
  phone_number: string | null;
  email_address: string | null;
  birthdate: string | null;
  sender_email: string | null;
  email_opted_out?: boolean | null;
  greeting_preference?: string | null;
  created_at: string;
}

export interface Holiday {
  id: string;
  name: string;
  type: string;
  holiday_date: string;
  year: number;
  is_active: boolean;
  greeting_email_sent_at: string | null;
  flyer_url: string | null;
  created_at: string;
}

export interface LeaseReminder {
  id: string;
  client_type: string | null;
  property_address: string | null;
  owner1_name: string | null;
  owner1_phone: string | null;
  owner1_email: string | null;
  owner2_name: string | null;
  owner2_phone: string | null;
  owner2_email: string | null;
  tenant1_name: string | null;
  tenant1_phone: string | null;
  tenant1_email: string | null;
  tenant2_name: string | null;
  tenant2_phone: string | null;
  tenant2_email: string | null;
  lease_start_date: string | null;
  lease_end_date: string | null;
  notice_reminder_date: string | null;
  last_reminder_sent_at: string | null;
  reminder_status: string | null;
  lease_status: string | null;
  renewal_email_sent_at?: string | null;
  created_at: string;
}

export interface EmailCampaign {
  id: string;
  campaign_type: string;
  campaign_title: string;
  recipient_filter: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  skipped_count: number;
  created_by: string | null;
  content_html: string;
  sent_at: string;
}

export interface EmailCampaignRecipient {
  id: string;
  campaign_id: string;
  client_id: string;
  client_name: string;
  client_email: string | null;
  sender_used: string | null;
  status: "sent" | "failed" | "skipped";
  error_detail: string | null;
  sent_at: string;
}

export interface EmailCampaignSearchResult {
  id: string;
  campaign_id: string;
  client_id: string;
  client_name: string;
  client_email: string | null;
  sender_used: string | null;
  status: "sent" | "failed" | "skipped";
  error_detail: string | null;
  sent_at: string;
  campaign_title: string;
  campaign_type: string;
}

export interface Listing {
  id: string;
  title: string;
  price: string;
  address: string;
  city?: string | null;
  zip_code?: string | null;
  beds: number;
  baths: number;
  sqft: number;
  description: string | null;
  main_image: string | null;
  created_at: string;
  status?: string | null;
  property_type?: string | null;
  listing_type?: string | null;
  year_built?: number | null;
  garage_spaces?: number | null;
  has_pool?: boolean | null;
  is_featured?: boolean | null;
  agent_id?: string | null;
  neighborhood_id?: string | null;
  mls_number?: string | null;
  virtual_tour_url?: string | null;
  images?: string[] | null;
}

export interface Review {
  id: string;
  client_name: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
}

export interface AgentProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  license_number: string | null;
  iabs_url: string | null;
  consumer_notice_url: string | null;
  created_at: string;
}

export interface Agent {
  id: string;
  name: string;
  title: string | null;
  brokerage: string | null;
  phone: string | null;
  email: string | null;
  license_number: string | null;
  bio: string | null;
  photo_url: string | null;
  display_order: number | null;
  is_active: boolean | null;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  type?: string | null;
  status?: string | null;
  message?: string | null;
  property_id?: string | null;
  agent_id?: string | null;
  created_at: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  contact_type?: string | null;
  status?: string | null;
  source?: string | null;
  assigned_agent_id?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  min_beds?: number | null;
  min_baths?: number | null;
  preferred_cities?: string[] | null;
  notes?: string | null;
  created_at: string;
}

export interface Neighborhood {
  id: string;
  name: string;
  slug?: string | null;
  city?: string | null;
  state?: string | null;
  description?: string | null;
  lifestyle?: string | null;
  avg_price?: string | number | null;
  highlights?: string[] | null;
  image_url?: string | null;
  display_order?: number | null;
  is_active?: boolean | null;
  walk_score?: number | null;
  school_rating?: number | null;
  created_at?: string;
}

export interface ChatSession {
  id: string;
  visitor_name?: string | null;
  visitor_email?: string | null;
  page_url?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  is_converted?: boolean | null;
  inquiry_id?: string | null;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  message: string;
  is_agent?: boolean | null;
  sent_at?: string | null;
}

export interface InquirySubmit {
  full_name: string;
  email: string;
  phone?: string;
  message?: string;
  preferred_date?: string;
  type?: string;
  listing_id?: string;
}

export interface ValuationSubmit {
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  zip_code?: string;
  property_type?: string;
  bedrooms?: number | string;
  bathrooms?: number | string;
  sqft?: number | string;
  year_built?: number | string;
  condition?: string;
  notes?: string;
}

export interface HeroVideo {
  id: string;
  title: string | null;
  cloudinary_url: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  property_address: string;
  listing_id: string | null;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  master_client_id: string | null;
  agent: string;
  appointment_type: string;
  status: string;
  notes: string | null;
  follow_up_date: string | null;
  created_at: string;
}

export interface DashboardStats {
  totalListings: number;
  activeListings: number;
  totalInquiries: number;
  newInquiries: number;
  totalContacts: number;
  chatSessions: number;
  recentInquiries: Inquiry[];
  recentChatSessions: ChatSession[];
}
