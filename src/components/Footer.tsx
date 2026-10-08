import { Phone, Mail, MapPin } from "lucide-react";

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import realtorLogo from "@/assets/realtor-logo.png";
import equalHousingLogo from "@/assets/equal-housing-logo.png";
import fullCircleLogo from "@/assets/full-circle-logo.jpeg";

const BG = "#050505";
const GOLD = "#C9A84C";

const Footer = () => {
  const { data: profile } = useQuery({
    queryKey: ["agent-profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_profile")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const phone = profile?.phone ?? "(512) 900-1897";
  const email = profile?.email ?? "info@texasrealtyhub.com";
  const consumerNoticeUrl = profile?.consumer_notice_url ?? "/docs/Consumer.pdf";
  const iabsUrl = profile?.iabs_url ?? "/docs/Brokerage_Services.pdf";

  const linkStyle = {
    fontFamily: "'Inter', sans-serif",
    fontSize: "12px",
    fontWeight: 400,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    color: "rgba(255,255,255,0.55)",
    textDecoration: "none",
    transition: "color 0.3s ease",
    display: "inline-block",
  };

  const headingStyle = {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "18px",
    fontWeight: 500,
    color: "#fff",
    letterSpacing: "0.02em",
    marginBottom: "20px",
  };

  return (
    <footer style={{ backgroundColor: BG, color: "#fff" }}>
      {/* Gold top divider */}
      <div style={{ height: "1px", backgroundColor: GOLD, opacity: 0.5 }} />

      <div className="container mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-14">
          {/* Brand */}
          <div>
            <h3
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "26px",
                fontWeight: 500,
                color: "#fff",
                marginBottom: "16px",
                letterSpacing: "0.01em",
              }}
            >
              Texas Realty Hub
            </h3>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "13px",
                fontWeight: 300,
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              Premium real estate services in Austin and Central Texas. Helping families find their perfect home.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <p style={headingStyle}>Quick Links</p>
            <div style={{ height: "1px", backgroundColor: GOLD, width: "32px", marginBottom: "16px", opacity: 0.7 }} />
            <ul className="space-y-3">
              {[
                { label: "Featured Properties", href: "#properties" },
                { label: "About Us", href: "/about" },
                { label: "Neighborhoods", href: "#neighborhoods" },
                { label: "Testimonials", href: "#testimonials" },
                { label: "Home Valuation", href: "/home-valuation" },
              ].map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    style={linkStyle}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = GOLD; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.55)"; }}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Useful Tools */}
          <div>
            <p style={headingStyle}>Useful Tools</p>
            <div style={{ height: "1px", backgroundColor: GOLD, width: "32px", marginBottom: "16px", opacity: 0.7 }} />
            <ul className="space-y-3">
              <li>
                <a
                  href="/mortgage-calculator"
                  style={linkStyle}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = GOLD; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.55)"; }}
                >
                  Mortgage Calculator
                </a>
              </li>
              <li>
                <a
                  href="/sellers-netsheet"
                  style={linkStyle}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = GOLD; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.55)"; }}
                >
                  Sellers Netsheet
                </a>
              </li>
              <li>
                <a
                  href="/title-calculator"
                  style={linkStyle}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = GOLD; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.55)"; }}
                >
                  Title Calculators
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p style={headingStyle}>Contact Us</p>
            <div style={{ height: "1px", backgroundColor: GOLD, width: "32px", marginBottom: "16px", opacity: 0.7 }} />
            <ul className="space-y-4">
              <li className="flex items-center gap-2.5">
                <Phone className="h-3.5 w-3.5 flex-shrink-0" style={{ color: GOLD }} />
                <a
                  href="tel:5129001897"
                  style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}
                >
                  512-900-1897
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-3.5 w-3.5 flex-shrink-0" style={{ color: GOLD }} />
                <a
                  href="mailto:ramanimma@texasrealtyhub.com"
                  style={linkStyle}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = GOLD; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.55)"; }}
                >
                  ramanimma@texasrealtyhub.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-3.5 w-3.5 flex-shrink-0" style={{ color: GOLD }} />
                <a
                  href={`mailto:${email}`}
                  style={linkStyle}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = GOLD; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.55)"; }}
                >
                  {email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: GOLD }} />
                <span style={{ ...linkStyle, cursor: "default" }}>Austin, Texas</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Gold divider */}
        <div style={{ height: "1px", backgroundColor: GOLD, marginTop: "56px", marginBottom: "40px", opacity: 0.3 }} />

        {/* Brokerage row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-10">
          <div className="flex items-center gap-4 lg:col-span-2">
            <div className="flex flex-col items-center gap-1">
              <img src={fullCircleLogo} alt="Full Circle RE" className="h-10 w-auto object-contain" />
              <p className="font-bold" style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", letterSpacing: "1.5px", color: "rgba(229,229,229,0.7)", marginTop: "2px", textTransform: "uppercase" }}>
                Real Estate
              </p>
              <p className="text-white/50 text-xs mt-1">Designated Broker: Chak Karri</p>
            </div>
          </div>

          <div className="hidden lg:block" />

          <div className="flex flex-col items-center">
            <p style={headingStyle}>Follow Us</p>
            <div className="flex gap-3">
              {[
                { icon: FacebookIcon, label: "Facebook", url: "https://www.facebook.com/Texasrealtyhub" },
                { icon: InstagramIcon, label: "Instagram", url: "https://www.instagram.com/texasrealtyhub" },
                { icon: YouTubeIcon, label: "YouTube", url: "https://www.youtube.com/@texasrealtyhub.s" },
              ].map(({ icon: Icon, label, url }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 flex items-center justify-center"
                  style={{
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.55)",
                    borderRadius: 0,
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = GOLD;
                    (e.currentTarget as HTMLAnchorElement).style.color = GOLD;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.15)";
                    (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.55)";
                  }}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom divider */}
        <div style={{ height: "1px", backgroundColor: "#2A2A2A", marginBottom: "28px" }} />

        {/* Compliance */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <a href={consumerNoticeUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.35)", textDecoration: "underline", textUnderlineOffset: "3px", transition: "color 0.3s ease" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = GOLD; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.35)"; }}>
            Texas Real Estate Commission Consumer Protection Notice
          </a>
          <a href={iabsUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.35)", textDecoration: "underline", textUnderlineOffset: "3px", transition: "color 0.3s ease" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = GOLD; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.35)"; }}>
            Texas Real Estate Commission Information About Brokerage Services
          </a>
          <a href="/docs/TREC_Disclaimer.pdf" target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.35)", textDecoration: "underline", textUnderlineOffset: "3px", transition: "color 0.3s ease" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = GOLD; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.35)"; }}>
            TREC Disclaimer
          </a>
        </div>

        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.3)", textAlign: "center", marginBottom: "24px" }}>
          All information is deemed reliable but not guaranteed and should be independently reviewed and verified.
        </p>

        <div className="flex items-center justify-center gap-10 mb-8">
          <img src={realtorLogo} alt="REALTOR®" className="h-12 w-auto object-contain brightness-0 invert opacity-50" />
          <img src={equalHousingLogo} alt="Equal Housing Opportunity" className="h-12 w-auto object-contain brightness-0 invert opacity-50" />
        </div>

        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.25)", textAlign: "center" }}>
          © {new Date().getFullYear()} Texas Realty Hub. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
