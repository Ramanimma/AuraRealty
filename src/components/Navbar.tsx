import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Phone, Mail } from "lucide-react";
import AuraLogoMark from "@/components/AuraLogoMark";

const CHARCOAL = "#1E2A44";
const GOLD = "#C07A4A";
let brandAnimationClaimed = false;

const navLinks = [
  { label: "Home", href: "/", path: "/" },
  { label: "Properties", href: "/properties", path: "/properties" },
  { label: "Neighborhoods", href: "/#neighborhoods", path: "/#neighborhoods" },
  { label: "About", href: "/about", path: "/about" },
  { label: "Home Valuation", href: "/home-valuation", path: "/home-valuation" },
  { label: "Contact", href: "/contact", path: "/contact" },
];

const mobileLinks = [
  { label: "Home", href: "/" },
  { label: "Properties", href: "/properties" },
  { label: "Neighborhoods", href: "/#neighborhoods" },
  { label: "About", href: "/about" },
  { label: "Testimonials", href: "/#testimonials" },
  { label: "Home Valuation", href: "/home-valuation" },
  { label: "Contact Us", href: "/contact" },
];

function isLinkActive(path: string, href: string): boolean {
  if (path === "/" && (href === "/" || href === "#hero")) return true;
  if (href === "/about" && path === "/about") return true;
  if (href === "/home-valuation" && path === "/home-valuation") return true;
  if (href.startsWith("/neighborhoods") && path.startsWith("/neighborhoods")) return true;
  return false;
}

const Navbar = () => {
  const [animateBrand] = useState(() => {
    if (brandAnimationClaimed) return false;
    try {
      return sessionStorage.getItem("aura-brand-animation-played") !== "true";
    } catch {
      return true;
    }
  });
  useEffect(() => {
    brandAnimationClaimed = true;
    try {
      sessionStorage.setItem("aura-brand-animation-played", "true");
    } catch {
      // Keep navigation usable when browser storage is blocked.
    }
  }, []);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const overlayRef = useRef<HTMLDivElement>(null);

  const isHomepage = location.pathname === "/";
  const isOverlay = isHomepage && !scrolled;
  const textColor = isOverlay ? "#FFFFFF" : CHARCOAL;

  useEffect(() => {
    const updateScroll = () => setScrolled(window.scrollY > 40);
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => window.removeEventListener("scroll", updateScroll);
  }, []);

  const openMenu = () => {
    setMobileOpen(true);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setOverlayVisible(true));
    });
  };

  const closeMenu = () => {
    setOverlayVisible(false);
    setTimeout(() => {
      setMobileOpen(false);
      document.body.style.overflow = "";
    }, 320);
  };

  const handleMobileNav = (href: string) => {
    closeMenu();
    setTimeout(() => {
      if (href.startsWith("/#")) {
        const id = href.slice(2);
        if (location.pathname !== "/") {
          navigate("/");
          setTimeout(() => {
            document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
          }, 300);
        } else {
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        navigate(href);
      }
    }, 50);
  };

  return (
    <>
      <header
        style={{
          position: isHomepage ? "fixed" : "sticky",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          backgroundColor: isOverlay ? "rgba(20,28,46,0.85)" : "#FFFFFF",
          borderBottom: isOverlay ? "1px solid transparent" : "1px solid #E9EDF3",
          boxShadow: isOverlay ? "none" : "0 4px 18px rgba(30,42,68,0.07)",
          transition: "background-color 200ms ease, border-color 200ms ease, box-shadow 200ms ease",
        }}
      >
        <nav
          className="container mx-auto flex items-center justify-between px-6"
          style={{ height: "70px", whiteSpace: "nowrap", overflow: "visible" }}
        >
          {/* Logo */}
          <a
            href="/"
            onClick={e => { e.preventDefault(); navigate("/"); }}
            style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", flexShrink: 0 }}
          >
            <AuraLogoMark
              size={44}
              tone={isOverlay ? "dark" : "light"}
              animate={animateBrand}
              className="aura-brand-mark aura-navbar-mark"
            />
            <span className="aura-brand-name aura-brand-name-slot">
              <span className="aura-brand-name-measure" aria-hidden="true">AURA REALTY</span>
              <span className={`aura-brand-name-copy${animateBrand ? " aura-brand-name-animated" : ""}`}>
                <span style={{ color: isOverlay ? "#C07A4A" : "#A8653A" }}>AURA</span>{" "}
                <span style={{ color: isOverlay ? "#FFFFFF" : "#1E2A44" }}>REALTY</span>
              </span>
            </span>
          </a>

          {/* Desktop links */}
          <ul className="hidden lg:flex items-center gap-3 xl:gap-7">
            {navLinks.map(link => {
              const active = isLinkActive(location.pathname, link.path);
              return (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={e => {
                      if (link.href.startsWith("#")) {
                        e.preventDefault();
                        document.getElementById(link.href.slice(1))?.scrollIntoView({ behavior: "smooth" });
                      } else if (link.href.startsWith("/")) {
                        e.preventDefault();
                        navigate(link.href);
                      }
                    }}
                    style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: active && !isOverlay ? "#A8653A" : textColor, transition: "color 200ms ease", textDecoration: "none", position: "relative", paddingBottom: "5px", borderBottom: active && isOverlay ? `1px solid ${GOLD}` : "1px solid transparent" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = isOverlay ? "#FFFFFF" : "#A8653A"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = active && !isOverlay ? "#A8653A" : textColor; }}
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-5">
            <button
              onClick={() => navigate("/home-valuation")}
              data-testid="button-get-started"
              className="public-button-primary"
              style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", backgroundColor: "#A8653A", color: "#fff", border: "none", padding: "10px 24px", cursor: "pointer", transition: "all 0.3s ease", borderRadius: 8 }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#8F5530"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#A8653A"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
            >
              Get Started
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden"
            onClick={mobileOpen ? closeMenu : openMenu}
            aria-label="Toggle navigation menu"
            data-testid="button-hamburger"
            style={{ color: isOverlay ? "#fff" : CHARCOAL, background: "none", border: "none", cursor: "pointer", padding: "4px" }}
          >
            <Menu className="h-6 w-6" />
          </button>
        </nav>
      </header>

      {/* Full-screen mobile overlay */}
      {mobileOpen && (
        <div
          ref={overlayRef}
          onClick={e => { if (e.target === overlayRef.current) closeMenu(); }}
          style={{ position: "fixed", inset: 0, zIndex: 99, backgroundColor: CHARCOAL, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: overlayVisible ? "translateY(0)" : "translateY(-100%)", transition: "transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)", overflowY: "auto", paddingTop: "80px", paddingBottom: "48px" }}
        >
          <button
            onClick={closeMenu}
            aria-label="Close menu"
            data-testid="button-close-menu"
            style={{ position: "absolute", top: "20px", right: "24px", background: "none", border: "none", cursor: "pointer", color: "#fff", padding: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X className="h-7 w-7" />
          </button>

          <nav style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", width: "100%" }}>
            {mobileLinks.map(link => {
              const active = isLinkActive(location.pathname, link.href);
              const isHovered = hoveredLink === link.label;
              return (
                <button
                  key={link.label}
                  data-testid={`mobile-nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => handleMobileNav(link.href)}
                  onMouseEnter={() => setHoveredLink(link.label)}
                  onMouseLeave={() => setHoveredLink(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Cormorant Garamond', serif", fontSize: "36px", fontWeight: 300, letterSpacing: "0.03em", color: "#fff", padding: "10px 24px", position: "relative", transition: "color 0.25s ease", textTransform: "uppercase" }}
                >
                  <span style={{ position: "relative", display: "inline-block" }}>
                    {link.label}
                    <span style={{ position: "absolute", bottom: "-4px", left: 0, right: 0, height: "1px", backgroundColor: GOLD, transform: `scaleX(${isHovered || active ? 1 : 0})`, transformOrigin: "left center", transition: "transform 0.3s ease" }} />
                  </span>
                </button>
              );
            })}
          </nav>

          <div style={{ marginTop: "40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
            <a href="tel:5129001897" style={{ display: "flex", alignItems: "center", gap: "10px", fontFamily: "'Inter', sans-serif", fontSize: "15px", fontWeight: 400, color: "rgba(255,255,255,0.75)", textDecoration: "none", letterSpacing: "0.04em" }}>
              <Phone className="h-4 w-4" />
              (512) 900-1897
            </a>
            <a href="mailto:agent1@aurarealty.com" style={{ display: "flex", alignItems: "center", gap: "10px", fontFamily: "'Inter', sans-serif", fontSize: "15px", fontWeight: 300, color: "rgba(255,255,255,0.75)", textDecoration: "none", letterSpacing: "0.02em" }}>
              <Mail className="h-4 w-4" />
              agent1@aurarealty.com
            </a>
          </div>

          <button
            onClick={() => handleMobileNav("/home-valuation")}
            data-testid="mobile-button-get-started"
            className="public-button-primary"
            style={{ marginTop: "36px", fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", backgroundColor: "#A8653A", color: "#fff", border: "none", padding: "16px 48px", cursor: "pointer", transition: "background-color 0.3s ease", borderRadius: 8 }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#8F5530"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#A8653A"; }}
          >
            Get Started
          </button>
        </div>
      )}
    </>
  );
};

export default Navbar;
