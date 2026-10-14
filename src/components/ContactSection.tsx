import { useState } from "react";
import { useLocation } from "react-router-dom";
import { CalendarIcon, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { api } from "@/lib/api";

const GOLD = "#C07A4A";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: "#FFFFFF",
  border: "1px solid #E9EDF3",
  color: "#1E2A44",
  fontFamily: "'Inter', sans-serif",
  fontSize: "14px",
  fontWeight: 300,
  outline: "none",
  borderRadius: 8,
  transition: "border-color 0.2s ease",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "'Inter', sans-serif",
  fontSize: "10px",
  fontWeight: 500,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#4B5563",
  marginBottom: "8px",
};

const ContactSection = () => {
  const location = useLocation();
  const prefill = (location.state as any) || {};
  const [date, setDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focused, setFocused] = useState<string | null>(null);
  const sectionRef = useScrollAnimation();

  const validate = (form: HTMLFormElement) => {
    const errs: Record<string, string> = {};
    const fullName = (form.elements.namedItem("fullName") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value.trim();

    if (!fullName) errs.fullName = "Full name is required.";
    if (!email) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Please enter a valid email address.";
    if (!phone) errs.phone = "Phone number is required.";
    if (!date) errs.date = "Preferred tour date is required.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate(e.currentTarget)) return;

    const form = e.currentTarget;
    const fullName = (form.elements.namedItem("fullName") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value.trim();
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement).value.trim();

    setIsSubmitting(true);
    try {
      await api.inquiries.submit({
        full_name: fullName,
        email,
        phone,
        message,
        preferred_date: date ? format(date, "yyyy-MM-dd") : undefined,
        type: "tour",
      });
      setIsSubmitted(true);
      form.reset();
      setDate(undefined);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldStyle = (name: string): React.CSSProperties => ({
    ...inputStyle,
    borderColor: focused === name ? "#1E2A44" : errors[name] ? "#f87171" : "#E9EDF3",
    boxShadow: focused === name ? "0 0 0 3px rgba(30,42,68,0.10)" : "none",
  });

  return (
    <section
      id="contact"
      className="py-16 md:py-24"
      ref={sectionRef}
      style={{ backgroundColor: "#FFFFFF", opacity: 0 }}
    >
      <style>{`
        .dark-input::placeholder { color: #9AA3B2; }
        .dark-input:focus { border-color: #1E2A44 !important; box-shadow: 0 0 0 3px rgba(30,42,68,0.10); }
      `}</style>

      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 400, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, marginBottom: "16px" }}>
            Get In Touch
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(36px, 4vw, 48px)", fontWeight: 500, color: "#1E2A44", letterSpacing: "-0.01em", marginBottom: "16px" }}>
            Schedule a Tour
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "15px", fontWeight: 400, color: "#4B5563", lineHeight: 1.7 }}>
            Interested in a property? Fill out the form below and one of our agents will reach out to arrange a private showing at your convenience.
          </p>
        </div>

        {isSubmitted ? (
          <div
            className="max-w-2xl mx-auto p-8 md:p-12 text-center space-y-4"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid #E9EDF3", borderRadius: 12 }}
          >
            <CheckCircle2 className="h-12 w-12 mx-auto" style={{ color: GOLD }} />
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontWeight: 500, color: "#1E2A44" }}>
              Thank You!
            </h3>
            <p style={{ fontFamily: "'Inter', sans-serif", color: "#4B5563", fontSize: "15px" }}>
              Thank you for your request. Our team will contact you shortly.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="public-button-secondary public-button-secondary-dark"
              style={{ marginTop: "16px", padding: "10px 28px", fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", backgroundColor: "transparent", color: GOLD, border: `1px solid ${GOLD}`, cursor: "pointer", transition: "all 0.3s ease", borderRadius: 8 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = GOLD; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = GOLD; }}
            >
              Submit Another Request
            </button>
          </div>
        ) : (
          <>
            {prefill.propertyAddress && (
              <p style={{ color: "#C07A4A", fontSize: "14px", marginBottom: "16px" }}>
                🏠 Scheduling a tour for: <strong>{prefill.propertyAddress}</strong>
              </p>
            )}

            <form
              onSubmit={handleSubmit}
              className="max-w-2xl mx-auto p-6 md:p-10 space-y-6"
              style={{ backgroundColor: "#FFFFFF", border: "1px solid #E9EDF3", borderRadius: 12, boxShadow: "0 12px 32px rgba(30,42,68,0.05)" }}
            >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="fullName" style={labelStyle}>Full Name <span style={{ color: "#f87171" }}>*</span></label>
                <input
                  id="fullName"
                  name="fullName"
                  placeholder="John Doe"
                  maxLength={100}
                  className="dark-input"
                  style={fieldStyle("fullName")}
                  onFocus={() => setFocused("fullName")}
                  onBlur={() => setFocused(null)}
                />
                {errors.fullName && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#f87171" }}>{errors.fullName}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="email" style={labelStyle}>Email Address <span style={{ color: "#f87171" }}>*</span></label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  maxLength={255}
                  className="dark-input"
                  style={fieldStyle("email")}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                />
                {errors.email && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#f87171" }}>{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" style={labelStyle}>Phone Number <span style={{ color: "#f87171" }}>*</span></label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="(512) 555-0123"
                  maxLength={20}
                  className="dark-input"
                  style={fieldStyle("phone")}
                  onFocus={() => setFocused("phone")}
                  onBlur={() => setFocused(null)}
                />
                {errors.phone && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#f87171" }}>{errors.phone}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="property" style={labelStyle}>Property of Interest</label>
                <input
                  id="property"
                  name="property"
                  placeholder="e.g. 1234 Oak Lane"
                  maxLength={200}
                  className="dark-input"
                  style={fieldStyle("property")}
                  defaultValue={prefill.propertyAddress || ""}
                  onFocus={() => setFocused("property")}
                  onBlur={() => setFocused(null)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label style={labelStyle}>Preferred Tour Date <span style={{ color: "#f87171" }}>*</span></label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn("w-full flex items-center gap-2 dark-input", !date && "text-white/30")}
                    style={{ ...inputStyle, borderColor: errors.date ? "#f87171" : "rgba(255,255,255,0.15)", textAlign: "left", cursor: "pointer" }}
                  >
                    <CalendarIcon className="h-4 w-4 flex-shrink-0" style={{ color: "#667085" }} />
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", fontWeight: 400, color: date ? "#1E2A44" : "#8A94A3" }}>
                      {date ? format(date, "PPP") : "Pick a date"}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(d) => d < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {errors.date && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#f87171" }}>{errors.date}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="message" style={labelStyle}>Message</label>
              <textarea
                id="message"
                name="message"
                placeholder="Tell us about what you're looking for..."
                rows={4}
                maxLength={1000}
                className="dark-input"
                style={{ ...inputStyle, resize: "vertical" }}
                defaultValue={prefill.propertyAddress ? `I would like to schedule a tour for ${prefill.propertyAddress}.` : ""}
                onFocus={() => setFocused("message")}
                onBlur={() => setFocused(null)}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="button-submit-tour"
              className="public-button-primary"
              style={{ width: "100%", padding: "14px", fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", backgroundColor: GOLD, color: "#fff", border: "none", cursor: isSubmitting ? "not-allowed" : "pointer", transition: "all 0.3s ease", borderRadius: 8, opacity: isSubmitting ? 0.7 : 1 }}
              onMouseEnter={(e) => { if (!isSubmitting) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#A8653A"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = GOLD; }}
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>

            {submitError && (
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#f87171", textAlign: "center" }}>{submitError}</p>
            )}
            </form>
          </>
        )}
      </div>
    </section>
  );
};

export default ContactSection;
