import { useState } from "react";
import { api } from "@/lib/api";

const GOLD = "#C07A4A";

const MailingList = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.newsletter.subscribe({ full_name: fullName, email });
      setIsSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: "#FFFFFF",
    border: "1px solid #E9EDF3",
    color: "#1E2A44",
    fontFamily: "'Inter', sans-serif",
    fontSize: "14px",
    fontWeight: 300,
    letterSpacing: "0.03em",
    padding: "12px 14px",
    outline: "none",
    width: "100%",
    borderRadius: 8,
  };

  return (
    <section
      className="py-16 md:py-24"
      style={{
        backgroundColor: "#F7F8FA",
        minHeight: "300px",
      }}
    >
      <div className="container mx-auto px-6" style={{ maxWidth: "800px" }}>
        {isSubmitted ? (
          <div className="text-center">
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(28px, 4vw, 42px)",
                fontStyle: "italic",
                fontWeight: 500,
                color: "#1E2A44",
                lineHeight: 1.3,
              }}
            >
              Thank you! You've been added to our list.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-14">
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "clamp(36px, 5vw, 60px)",
                  fontWeight: 500,
                  color: "#1E2A44",
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                  marginBottom: "16px",
                }}
              >
                Join Our Exclusive Mailing List
              </h2>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "14px",
                  fontWeight: 300,
                  letterSpacing: "0.05em",
                  color: "#4B5563",
                  maxWidth: "480px",
                  margin: "0 auto",
                  lineHeight: 1.7,
                }}
              >
                Stay up-to-date with exclusive listings and market updates in DFW.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div
                className="flex flex-col sm:flex-row gap-6 sm:gap-8 mb-6"
                style={{ alignItems: "flex-end" }}
              >
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="placeholder:text-[#4B5563]"
                    style={inputStyle}
                    data-testid="input-mailing-name"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="placeholder:text-[#4B5563]"
                    style={inputStyle}
                    data-testid="input-mailing-email"
                  />
                </div>
                <div className="sm:flex-shrink-0">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    data-testid="button-mailing-subscribe"
                    className="public-button-primary"
                    style={{
                      padding: "12px 32px",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "11px",
                      fontWeight: 500,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      backgroundColor: "#A8653A",
                      color: "#fff",
                      border: "1px solid #A8653A",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      transition: "all 0.3s ease",
                      borderRadius: 8,
                      whiteSpace: "nowrap",
                      width: "100%",
                      opacity: isSubmitting ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!isSubmitting) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#8F5530";
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#A8653A";
                      (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                    }}
                  >
                    {isSubmitting ? "Subscribing..." : "Subscribe"}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3 mb-4">
                <input
                  type="checkbox"
                  id="ml-consent"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  data-testid="checkbox-mailing-consent"
                  style={{
                    marginTop: "2px",
                    accentColor: GOLD,
                    flexShrink: 0,
                    cursor: "pointer",
                    border: "1px solid #E9EDF3",
                  }}
                />
                <label
                  htmlFor="ml-consent"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "11px",
                    fontWeight: 300,
                    lineHeight: 1.6,
                    color: "#4B5563",
                    cursor: "pointer",
                    letterSpacing: "0.02em",
                  }}
                >
                  I agree to be contacted by Aura Realty via call, email, and text for real estate updates. Message and data rates may apply.
                </label>
              </div>

              {error && (
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "13px",
                    color: "#f87171",
                    marginTop: "8px",
                  }}
                >
                  {error}
                </p>
              )}
            </form>
          </>
        )}
      </div>
    </section>
  );
};

export default MailingList;
