import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, BarChart2, Clock, ShieldCheck, Phone, Mail } from "lucide-react";
import Navbar from "@/components/Navbar";
import MailingList from "@/components/MailingList";
import Footer from "@/components/Footer";
import { api } from "@/lib/api";
import type { Agent } from "@/lib/api";
import SEOHead from "@/components/SEOHead";

const CHARCOAL = "#1E2A44";
const GOLD = "#C07A4A";
const CREAM = "#F7F8FA";

const CITIES = ["Leander", "Liberty Hill", "Georgetown", "Round Rock", "Cedar Park", "Hutto", "Austin", "Other"];
const PROPERTY_TYPES = ["Single Family", "Condo", "Townhouse", "Multi-Family", "Land"];
const CONDITIONS = ["Excellent", "Good", "Fair", "Needs Work"];

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontFamily: "'Inter', sans-serif",
  fontSize: "14px",
  color: CHARCOAL,
  backgroundColor: "#fff",
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  outline: "none",
  appearance: "none",
  WebkitAppearance: "none",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontFamily: "'Inter', sans-serif",
  fontSize: "14px",
  color: CHARCOAL,
  backgroundColor: "#fff",
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "'Inter', sans-serif",
  fontSize: "12px",
  fontWeight: 500,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#6B6B6B",
  marginBottom: "6px",
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: "#c0392b", marginLeft: "2px" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

export default function HomeValuation() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", address: "", city: "", zip_code: "",
    state: "TX", property_type: "", bedrooms: "", bathrooms: "", sqft: "", year_built: "",
    condition: "", notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["agents"],
    queryFn: () => api.agents.list(),
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.full_name.trim()) errs.full_name = "Required";
    if (!form.email.trim()) errs.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email";
    if (!form.phone.trim()) errs.phone = "Required";
    if (!form.address.trim()) errs.address = "Required";
    if (!form.city.trim()) errs.city = "Required";
    if (!form.zip_code.trim()) errs.zip_code = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await api.valuations.submit(form);
      setIsSubmitted(true);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Free Home Valuation | What Is My Home Worth in Central Texas?"
        description="Get a free home valuation in Leander, Cedar Park, Georgetown, Round Rock, Liberty Hill and Austin TX. Expert market analysis within 24 hours. No obligation."
        keywords="home valuation Leander TX, what is my home worth Cedar Park, Georgetown TX home value, sell my home Round Rock, free home valuation Austin"
        ogUrl="https://aurarealty.com/home-valuation"
      />
      <Navbar />

      {/* ── Hero ── */}
      <section
        className="flex flex-col items-center justify-center text-center px-6"
        style={{ backgroundColor: CHARCOAL, paddingTop: "140px", paddingBottom: "100px" }}
      >
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: GOLD,
            marginBottom: "20px",
          }}
        >
          Free Market Analysis
        </p>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(42px, 6vw, 72px)",
            fontWeight: 300,
            color: "#fff",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: "20px",
            maxWidth: "800px",
          }}
        >
          What Is Your Home Worth?
        </h1>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "16px",
            fontWeight: 300,
            color: "rgba(255,255,255,0.65)",
            lineHeight: 1.7,
            maxWidth: "520px",
            marginBottom: "48px",
          }}
        >
          Get a free, no-obligation market analysis from our local experts
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          {["Free Analysis", "No Obligation", "Local Experts"].map((badge) => (
            <div
              key={badge}
              style={{
                padding: "10px 24px",
                border: `1px solid ${GOLD}60`,
                fontFamily: "'Inter', sans-serif",
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: GOLD,
                borderRadius: 8,
              }}
            >
              {badge}
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ backgroundColor: CREAM, padding: "96px 24px" }}>
        <div className="container mx-auto" style={{ maxWidth: "1100px" }}>
          <div className="text-center mb-16">
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: GOLD,
                marginBottom: "12px",
              }}
            >
              The Process
            </p>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(32px, 4vw, 48px)",
                fontWeight: 300,
                color: CHARCOAL,
                letterSpacing: "-0.01em",
              }}
            >
              How It Works
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { num: "01", title: "Submit Your Details", desc: "Tell us about your property — address, size, condition, and any upgrades." },
              { num: "02", title: "We Analyze The Market", desc: "Our agents research comparable sales, current inventory, and market trends." },
              { num: "03", title: "Receive Your Report", desc: "Get a detailed valuation within 24 hours with no strings attached." },
            ].map((step) => (
              <div key={step.num} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "56px",
                    fontWeight: 300,
                    color: GOLD,
                    lineHeight: 1,
                    opacity: 0.7,
                  }}
                >
                  {step.num}
                </p>
                <h3
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "22px",
                    fontWeight: 500,
                    color: CHARCOAL,
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "14px",
                    fontWeight: 300,
                    lineHeight: 1.7,
                    color: "#6B6B6B",
                  }}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Valuation Form ── */}
      <section style={{ backgroundColor: "#FFFFFF", padding: "96px 24px" }}>
        <div className="container mx-auto" style={{ maxWidth: "900px" }}>
          <div className="text-center mb-14">
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: GOLD,
                marginBottom: "12px",
              }}
            >
              Get Started
            </p>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(32px, 4vw, 48px)",
                fontWeight: 300,
                color: CHARCOAL,
                letterSpacing: "-0.01em",
              }}
            >
              Request Your Free Valuation
            </h2>
          </div>

          {isSubmitted ? (
            <div
              className="text-center p-12 md:p-16"
              style={{ border: "1px solid #E5E7EB", backgroundColor: "#fff" }}
            >
              <CheckCircle2 className="mx-auto mb-6 h-14 w-14" style={{ color: GOLD }} />
              <h3
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "32px",
                  fontWeight: 400,
                  color: CHARCOAL,
                  marginBottom: "16px",
                }}
              >
                Thank You!
              </h3>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "15px",
                  fontWeight: 300,
                  color: "#6B6B6B",
                  lineHeight: 1.7,
                  maxWidth: "480px",
                  margin: "0 auto 32px",
                }}
              >
                Your valuation request has been received. One of our agents will contact you within 24 hours with your free market analysis.
              </p>
              <button
                onClick={() => navigate("/#properties")}
                style={{
                  padding: "13px 36px",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  backgroundColor: "transparent",
                  color: CHARCOAL,
                  border: `1px solid ${CHARCOAL}`,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  borderRadius: 8,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = CHARCOAL;
                  (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = CHARCOAL;
                }}
              >
                Explore Current Listings
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{ border: "1px solid #E5E7EB", padding: "48px", backgroundColor: "#fff" }}
            >
              {/* Contact Info */}
              <h3
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "22px",
                  fontWeight: 500,
                  color: CHARCOAL,
                  marginBottom: "24px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid #E5E7EB",
                }}
              >
                Your Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                <Field label="Full Name" required>
                  <input
                    data-testid="input-valuation-name"
                    style={{ ...inputStyle, borderColor: errors.full_name ? "#c0392b" : "#E5E7EB" }}
                    placeholder="John Smith"
                    value={form.full_name}
                    onChange={set("full_name")}
                    maxLength={200}
                  />
                  {errors.full_name && <p style={{ color: "#c0392b", fontSize: "12px", marginTop: "4px" }}>{errors.full_name}</p>}
                </Field>
                <Field label="Email Address" required>
                  <input
                    data-testid="input-valuation-email"
                    type="email"
                    style={{ ...inputStyle, borderColor: errors.email ? "#c0392b" : "#E5E7EB" }}
                    placeholder="john@example.com"
                    value={form.email}
                    onChange={set("email")}
                    maxLength={255}
                  />
                  {errors.email && <p style={{ color: "#c0392b", fontSize: "12px", marginTop: "4px" }}>{errors.email}</p>}
                </Field>
                <Field label="Phone Number" required>
                  <input
                    data-testid="input-valuation-phone"
                    type="tel"
                    style={{ ...inputStyle, borderColor: errors.phone ? "#c0392b" : "#E5E7EB" }}
                    placeholder="(512) 555-0123"
                    value={form.phone}
                    onChange={set("phone")}
                    maxLength={20}
                  />
                  {errors.phone && <p style={{ color: "#c0392b", fontSize: "12px", marginTop: "4px" }}>{errors.phone}</p>}
                </Field>
              </div>

              {/* Property Info */}
              <h3
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "22px",
                  fontWeight: 500,
                  color: CHARCOAL,
                  marginBottom: "24px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid #E5E7EB",
                }}
              >
                Property Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                <div className="md:col-span-2">
                  <Field label="Property Address" required>
                    <input
                      data-testid="input-valuation-address"
                      style={{ ...inputStyle, borderColor: errors.address ? "#c0392b" : "#E5E7EB" }}
                      placeholder="123 Oak Lane"
                      value={form.address}
                      onChange={set("address")}
                      maxLength={300}
                    />
                    {errors.address && <p style={{ color: "#c0392b", fontSize: "12px", marginTop: "4px" }}>{errors.address}</p>}
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="City" required>
                    <input
                      data-testid="input-valuation-city"
                      style={{ ...inputStyle, borderColor: errors.city ? "#c0392b" : "#E5E7EB" }}
                      placeholder="e.g. Cedar Park, Leander, Austin"
                      value={form.city}
                      onChange={set("city")}
                      maxLength={100}
                    />
                    {errors.city && <p style={{ color: "#c0392b", fontSize: "12px", marginTop: "4px" }}>{errors.city}</p>}
                  </Field>
                </div>
                <Field label="ZIP Code" required>
                  <input
                    data-testid="input-valuation-zip"
                    style={{ ...inputStyle, borderColor: errors.zip_code ? "#c0392b" : "#E5E7EB" }}
                    placeholder="78641"
                    value={form.zip_code}
                    onChange={set("zip_code")}
                    maxLength={10}
                  />
                  {errors.zip_code && <p style={{ color: "#c0392b", fontSize: "12px", marginTop: "4px" }}>{errors.zip_code}</p>}
                </Field>
                <Field label="State">
                  <input
                    data-testid="input-valuation-state"
                    style={inputStyle}
                    placeholder="TX"
                    value={form.state}
                    onChange={set("state")}
                    maxLength={2}
                  />
                </Field>
                <Field label="Property Type">
                  <div style={{ position: "relative" }}>
                    <select
                      data-testid="select-valuation-type"
                      style={selectStyle}
                      value={form.property_type}
                      onChange={set("property_type")}
                    >
                      <option value="">Select type…</option>
                      {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6B6B6B", fontSize: "12px" }}>▾</span>
                  </div>
                </Field>
                <Field label="Property Condition">
                  <div style={{ position: "relative" }}>
                    <select
                      data-testid="select-valuation-condition"
                      style={selectStyle}
                      value={form.condition}
                      onChange={set("condition")}
                    >
                      <option value="">Select condition…</option>
                      {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6B6B6B", fontSize: "12px" }}>▾</span>
                  </div>
                </Field>
                <Field label="Bedrooms">
                  <input
                    data-testid="input-valuation-beds"
                    type="number"
                    min={0}
                    max={20}
                    style={inputStyle}
                    placeholder="4"
                    value={form.bedrooms}
                    onChange={set("bedrooms")}
                  />
                </Field>
                <Field label="Bathrooms">
                  <input
                    data-testid="input-valuation-baths"
                    type="number"
                    min={0}
                    max={20}
                    step={0.5}
                    style={inputStyle}
                    placeholder="2.5"
                    value={form.bathrooms}
                    onChange={set("bathrooms")}
                  />
                </Field>
                <Field label="Square Footage">
                  <input
                    data-testid="input-valuation-sqft"
                    type="number"
                    min={0}
                    style={inputStyle}
                    placeholder="2400"
                    value={form.sqft}
                    onChange={set("sqft")}
                  />
                </Field>
                <Field label="Year Built">
                  <input
                    data-testid="input-valuation-year"
                    type="number"
                    min={1800}
                    max={new Date().getFullYear()}
                    style={inputStyle}
                    placeholder="2005"
                    value={form.year_built}
                    onChange={set("year_built")}
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Additional Notes">
                    <textarea
                      data-testid="input-valuation-notes"
                      style={{ ...inputStyle, height: "100px", resize: "vertical" }}
                      placeholder="Any renovations, upgrades, or special features?"
                      value={form.notes}
                      onChange={set("notes")}
                      maxLength={1000}
                    />
                  </Field>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                data-testid="button-submit-valuation"
                style={{
                  width: "100%",
                  padding: "16px",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  backgroundColor: GOLD,
                  color: "#fff",
                  border: "none",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                  borderRadius: 8,
                  opacity: isSubmitting ? 0.7 : 1,
                }}
                onMouseEnter={(e) => { if (!isSubmitting) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#A8653A"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = GOLD; }}
              >
                {isSubmitting ? "Submitting…" : "Request Free Valuation"}
              </button>

              <p
                style={{
                  textAlign: "center",
                  marginTop: "12px",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "11px",
                  fontWeight: 300,
                  color: "#9B9B9B",
                  letterSpacing: "0.03em",
                }}
              >
                We respect your privacy. Your information is never shared.
              </p>

              {submitError && (
                <p style={{ color: "#c0392b", textAlign: "center", marginTop: "8px", fontFamily: "'Inter', sans-serif", fontSize: "13px" }}>
                  {submitError}
                </p>
              )}
            </form>
          )}
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section style={{ backgroundColor: CREAM, padding: "96px 24px" }}>
        <div className="container mx-auto" style={{ maxWidth: "1100px" }}>
          <div className="text-center mb-16">
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: GOLD,
                marginBottom: "12px",
              }}
            >
              Our Advantage
            </p>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(32px, 4vw, 48px)",
                fontWeight: 300,
                color: CHARCOAL,
                letterSpacing: "-0.01em",
              }}
            >
              Why Choose Us for Your Valuation
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <BarChart2 className="h-6 w-6" />, title: "Local Market Expert", desc: "Deep knowledge of Austin and Central Texas neighborhoods, trends, and comparable sales." },
              { icon: <CheckCircle2 className="h-6 w-6" />, title: "Data-Driven Analysis", desc: "Every valuation is backed by real MLS data, not generic estimates or algorithms." },
              { icon: <ShieldCheck className="h-6 w-6" />, title: "No Obligation", desc: "Your free valuation comes with zero pressure. Our goal is to inform, not to sell." },
              { icon: <Clock className="h-6 w-6" />, title: "Fast 24hr Turnaround", desc: "Receive your personalized market analysis within 24 hours of submitting your request." },
            ].map((card) => (
              <div
                key={card.title}
                style={{
                  backgroundColor: "#fff",
                  border: "1px solid #E5E7EB",
                  padding: "36px 28px",
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: CHARCOAL,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: GOLD,
                    marginBottom: "20px",
                    borderRadius: 8,
                  }}
                >
                  {card.icon}
                </div>
                <h3
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "20px",
                    fontWeight: 500,
                    color: CHARCOAL,
                    marginBottom: "10px",
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "13px",
                    fontWeight: 300,
                    lineHeight: 1.7,
                    color: "#6B6B6B",
                  }}
                >
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Agent CTA ── */}
      <section style={{ backgroundColor: CHARCOAL, padding: "96px 24px" }}>
        <div className="container mx-auto" style={{ maxWidth: "900px" }}>
          <div className="text-center mb-14">
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: GOLD,
                marginBottom: "12px",
              }}
            >
              Meet Your Experts
            </p>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(32px, 4vw, 48px)",
                fontWeight: 300,
                color: "#fff",
                letterSpacing: "-0.01em",
              }}
            >
              Speak Directly With An Agent
            </h2>
          </div>

          <div className={`grid gap-8 ${agents.length === 1 ? "grid-cols-1 max-w-sm mx-auto" : "grid-cols-1 md:grid-cols-2"}`}>
            {agents.length > 0 ? agents.map((agent) => (
              <div
                key={agent.id}
                style={{
                  backgroundColor: "#26324C",
                  border: "1px solid #333333",
                  padding: "36px",
                  borderRadius: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  {agent.photo_url ? (
                    <img
                      src={agent.photo_url}
                      alt={agent.name}
                      style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: "64px", height: "64px", backgroundColor: "#3A3A3A", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", color: GOLD }}>
                        {agent.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: "22px",
                        fontWeight: 500,
                        color: "#fff",
                        marginBottom: "4px",
                      }}
                    >
                      {agent.name}
                    </h3>
                    {agent.title && (
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: GOLD }}>
                        {agent.title}
                      </p>
                    )}
                    {(agent.brokerage || agent.brokerage_name) && (
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#9CA3AF" }}>
                        🏢 {agent.brokerage || agent.brokerage_name}
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {agent.phone && (
                    <a
                      href={`tel:${agent.phone.replace(/\D/g, "")}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "14px",
                        fontWeight: 400,
                        color: "rgba(255,255,255,0.7)",
                        textDecoration: "none",
                        transition: "color 0.3s ease",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = GOLD; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.7)"; }}
                    >
                      <Phone className="h-4 w-4 flex-shrink-0" style={{ color: GOLD }} />
                      {agent.phone}
                    </a>
                  )}
                  {agent.email && (
                    <a
                      href={`mailto:${agent.email}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "14px",
                        fontWeight: 400,
                        color: "rgba(255,255,255,0.7)",
                        textDecoration: "none",
                        transition: "color 0.3s ease",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = GOLD; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.7)"; }}
                    >
                      <Mail className="h-4 w-4 flex-shrink-0" style={{ color: GOLD }} />
                      {agent.email}
                    </a>
                  )}
                </div>
              </div>
            )) : (
              <div
                style={{
                  gridColumn: "1 / -1",
                  backgroundColor: "#26324C",
                  border: "1px solid #333333",
                  padding: "48px",
                  borderRadius: 8,
                  textAlign: "center",
                }}
              >
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontStyle: "italic", color: "rgba(255,255,255,0.6)" }}>
                  Our agents are ready to assist you.
                </p>
                <a
                  href="tel:5129001897"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "16px",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "14px",
                    color: GOLD,
                    textDecoration: "none",
                  }}
                >
                  <Phone className="h-4 w-4" /> (512) 900-1897
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      <MailingList />
      <Footer />
    </div>
  );
}
