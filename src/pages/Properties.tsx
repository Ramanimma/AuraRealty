import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { api } from "@/lib/api";

const GOLD = "#C07A4A";

const UNSPLASH_FALLBACKS = [
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
];

interface Listing {
  id: string;
  title: string;
  price: string;
  address: string;
  city: string | null;
  zip_code: string | null;
  state: string | null;
  beds: number;
  baths: number;
  sqft: number;
  main_image: string | null;
  listing_type: string | null;
  status: string | null;
  property_type: string | null;
  is_featured: boolean | null;
}

function getImage(img: string | null | undefined, idx: number): string {
  if (!img || img.startsWith("/assets/")) return UNSPLASH_FALLBACKS[idx % UNSPLASH_FALLBACKS.length];
  return img;
}

function formatPrice(price: string | null | undefined, listingType: string | null | undefined): string | null {
  if (!price || price.trim() === "") return null;
  if (price.toLowerCase().includes("/mo")) return price;
  const num = parseFloat(price.replace(/[^0-9.]/g, ""));
  if (!num) return price;
  const formatted = "$" + num.toLocaleString();
  if (listingType === "rent" || listingType === "lease") return formatted + "/mo";
  return formatted;
}

function statusBadgeColor(status: string | null | undefined): string {
  if (!status) return GOLD;
  const s = status.toLowerCase();
  if (s === "active" || s === "rented") return ({ active: "#1E2A44", rented: "#E9EDF3" } as Record<string, string>)[s];
  if (s === "sold") return "#141C2E";
  if (s === "pending") return "#F3E6DC";
  if (s === "off_market") return "#E9EDF3";
  return GOLD;
}

function statusBadgeTextColor(status: string | null | undefined): string {
  if (!status) return "#fff";
  return status.toLowerCase() === "sold" ? "#FFFFFF" : ({ rented: "#1E2A44", pending: "#8A4F2A", off_market: "#4B5563" } as Record<string, string>)[status.toLowerCase()] ?? "#fff";
}

function statusLabel(status: string | null | undefined): string {
  if (!status) return "";
  const s = status.toLowerCase();
  if (s === "off_market") return "Off Market";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const PAGE_SIZE = 9;

type SortKey = "newest" | "price_asc" | "price_desc" | "beds_desc";
type TypeFilter = "all" | "sale" | "rent" | "lease";

interface CardProps {
  listing: Listing;
  idx: number;
}

const PropertyCard = ({ listing, idx }: CardProps) => {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const price = formatPrice(listing.price, listing.listing_type);

  return (
    <div
      className="public-property-card"
      data-testid={`card-property-${listing.id}`}
      onClick={() => navigate(`/property/${listing.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: "#FFFFFF", border: "1px solid #E9EDF3", borderRadius: 12, cursor: "pointer", transition: "transform 200ms ease, box-shadow 200ms ease", transform: hovered ? "translateY(-3px)" : "translateY(0)", boxShadow: hovered ? "0 16px 36px rgba(30,42,68,0.12)" : "0 4px 14px rgba(30,42,68,0.04)" }}
    >
      <div style={{ position: "relative", paddingTop: "75%", overflow: "hidden", flexShrink: 0 }}>
        <img
          src={getImage(listing.main_image, idx)}
          alt={listing.address}
          loading="lazy"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", transition: "transform 0.6s ease", transform: hovered ? "scale(1.05)" : "scale(1)" }}
        />
        <div style={{ display: "none" }} />
        {listing.status !== "sold" && price !== null && (
          <div style={{ display: "none" }}>{price}</div>
        )}
        {listing.status && (
          <div style={{ position: "absolute", top: "14px", right: "14px", backgroundColor: statusBadgeColor(listing.status), color: statusBadgeTextColor(listing.status), borderRadius: 6, padding: "5px 12px", fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {statusLabel(listing.status)}
          </div>
        )}
      </div>
      <div style={{ padding: "18px 18px 14px" }}>
        {listing.status !== "sold" && price !== null && (
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "24px", fontWeight: 500, color: "#1E2A44", marginBottom: "3px", lineHeight: 1.2 }}>
            {price}
          </p>
        )}
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 400, color: "#4B5563", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{listing.address}</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, padding: "12px 18px", backgroundColor: "#FFFFFF" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 400, letterSpacing: "0.09em", textTransform: "uppercase", color: "#4B5563", margin: 0 }}>
          {listing.beds} Beds&nbsp;·&nbsp;{listing.baths} Baths&nbsp;·&nbsp;{Number(listing.sqft).toLocaleString()} sqft
        </p>
        <Link
          to={`/property/${listing.id}`}
          data-testid={`link-view-details-${listing.id}`}
          onClick={e => e.stopPropagation()}
          className="public-button-secondary"
          style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", flexShrink: 0, padding: "6px 12px" }}
        >
          View Details →
        </Link>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="animate-pulse rounded-xl" style={{ backgroundColor: "#E9EDF3", height: "380px" }} />
);

const Properties = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const data = await api.listings.list();
        setListings(data as Listing[]);
      } catch (_) {
        // silently show empty state on error
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  const cities = ["all", ...Array.from(new Set(listings.map(l => l.city).filter(Boolean)))].filter((v): v is string => typeof v === "string");

  const filtered = listings
    .filter(l => typeFilter === "all" || l.listing_type === typeFilter)
    .filter(l => cityFilter === "all" || l.city === cityFilter)
    .sort((a, b) => {
      if (sort === "price_asc") return parseInt((a.price || "0").replace(/\D/g, ""), 10) - parseInt((b.price || "0").replace(/\D/g, ""), 10);
      if (sort === "price_desc") return parseInt((b.price || "0").replace(/\D/g, ""), 10) - parseInt((a.price || "0").replace(/\D/g, ""), 10);
      if (sort === "beds_desc") return (b.beds || 0) - (a.beds || 0);
      return 0;
    });

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const clearFilters = () => {
    setTypeFilter("all");
    setCityFilter("all");
    setSort("newest");
    setVisibleCount(PAGE_SIZE);
  };

  const typeButtons: { key: TypeFilter; label: string }[] = [
    { key: "all", label: "All Types" },
    { key: "sale", label: "For Sale" },
    { key: "rent", label: "For Rent" },
    { key: "lease", label: "Lease" },
  ];

  return (
    <>
      <SEOHead
        title="Properties | Aura Realty – DFW Homes"
        description="Browse homes, condos, and luxury properties for sale, rent, and lease in DFW and DFW. Find your perfect home with Aura Realty."
      />
      <Navbar />

      <header className="public-page-header">
        <p className="public-page-eyebrow">DFW & DFW</p>
        <h1 className="public-page-title">All Properties</h1>
        <div className="mx-auto my-3 h-px w-10 bg-[#C07A4A]" />
        <p className="public-page-subtitle">Homes for sale, rent, and lease across our available communities.</p>
      </header>

      {/* Sticky filter bar */}
      <div
        className="public-tool-inputs"
        style={{ backgroundColor: "#F7F8FA", borderBottom: "1px solid #E9EDF3", position: "sticky", top: "70px", zIndex: 30 }}
      >
        <div className="container mx-auto px-6" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", padding: "14px 24px" }}>
          {/* Type filter buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {typeButtons.map(btn => (
              <button
                key={btn.key}
                data-testid={`filter-type-${btn.key}`}
                onClick={() => { setTypeFilter(btn.key); setVisibleCount(PAGE_SIZE); }}
                style={{
                  padding: "7px 16px",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  border: `1.5px solid ${typeFilter === btn.key ? "#A8653A" : "#1E2A44"}`,
                  backgroundColor: typeFilter === btn.key ? "#A8653A" : "#FFFFFF",
                  color: typeFilter === btn.key ? "#FFFFFF" : "#1E2A44",
                  transition: "all 0.2s ease",
                  borderRadius: 8,
                }}
                onMouseEnter={e => {
                  if (typeFilter !== btn.key) {
                    e.currentTarget.style.backgroundColor = "#C07A4A";
                    e.currentTarget.style.borderColor = "#C07A4A";
                    e.currentTarget.style.color = "#FFFFFF";
                  }
                }}
                onMouseLeave={e => {
                  if (typeFilter !== btn.key) {
                    e.currentTarget.style.backgroundColor = "#FFFFFF";
                    e.currentTarget.style.borderColor = "#1E2A44";
                    e.currentTarget.style.color = "#1E2A44";
                  }
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Right side controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* City dropdown */}
            <select
              data-testid="filter-city"
              value={cityFilter}
              onChange={e => { setCityFilter(e.target.value); setVisibleCount(PAGE_SIZE); }}
              style={{ backgroundColor: "#FFFFFF", border: "1px solid #E9EDF3", color: "#1E2A44", fontFamily: "'Inter', sans-serif", fontSize: "11px", letterSpacing: "0.06em", padding: "8px 12px", cursor: "pointer", outline: "none", borderRadius: 8 }}
            >
              {cities.map(c => (
                <option key={c} value={c}>{c === "all" ? "All Cities" : c}</option>
              ))}
            </select>

            {/* Sort dropdown */}
            <select
              data-testid="filter-sort"
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              style={{ backgroundColor: "#FFFFFF", border: "1px solid #E9EDF3", color: "#1E2A44", fontFamily: "'Inter', sans-serif", fontSize: "11px", letterSpacing: "0.06em", padding: "8px 12px", cursor: "pointer", outline: "none", borderRadius: 8 }}
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="beds_desc">Most Beds</option>
            </select>

            {/* Count label */}
            {!loading && (
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#4B5563", letterSpacing: "0.06em" }}>
                {filtered.length} {filtered.length === 1 ? "property" : "properties"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Listings grid */}
      <main style={{ backgroundColor: "#FFFFFF", minHeight: "60vh", padding: "48px 0 80px" }}>
        <div className="container mx-auto px-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", paddingTop: "80px", paddingBottom: "80px" }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "15px", color: "#4B5563", marginBottom: "24px" }}>
                No properties match your filters
              </p>
              <button
                data-testid="button-clear-filters"
                onClick={clearFilters}
                className="public-button-secondary"
                style={{ padding: "12px 32px", fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", backgroundColor: "transparent", color: "#1E2A44", border: "1.5px solid #1E2A44", cursor: "pointer", transition: "all 0.2s ease", borderRadius: 8 }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "#C07A4A";
                  e.currentTarget.style.borderColor = "#C07A4A";
                  e.currentTarget.style.color = "#FFFFFF";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = "#1E2A44";
                  e.currentTarget.style.color = "#1E2A44";
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {visible.map((listing, i) => (
                    <PropertyCard key={listing.id} listing={listing} idx={i} />
                ))}
              </div>
              {hasMore && (
                <div style={{ textAlign: "center", marginTop: "48px" }}>
                  <button
                    data-testid="button-load-more"
                    onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                    className="public-button-secondary"
                    style={{ padding: "14px 48px", fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", backgroundColor: "transparent", color: "#1E2A44", border: "1.5px solid #1E2A44", cursor: "pointer", transition: "all 0.2s ease", borderRadius: 8 }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = "#C07A4A";
                      e.currentTarget.style.borderColor = "#C07A4A";
                      e.currentTarget.style.color = "#FFFFFF";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.borderColor = "#1E2A44";
                      e.currentTarget.style.color = "#1E2A44";
                    }}
                  >
                    Load More Properties
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Coming Soon banner */}
      <section style={{ backgroundColor: "#1E2A44", borderTop: "1px solid rgba(255,255,255,0.10)", padding: "64px 0", textAlign: "center" }}>
        <div className="container mx-auto px-6">
          <div style={{ width: "40px", height: "1px", backgroundColor: GOLD, margin: "0 auto 20px" }} />
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "#FFFFFF", marginBottom: "16px" }}>
            Exclusive Inventory
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(28px,4vw,44px)", fontWeight: 300, color: "#fff", marginBottom: "14px" }}>
            More Exceptional Properties Coming Soon
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.75)", marginBottom: "32px", maxWidth: "480px", margin: "0 auto 32px" }}>
            We have exclusive listings not yet on the market. Be the first to know when they're available.
          </p>
          <button
            data-testid="button-get-notified"
            onClick={() => navigate("/home-valuation")}
            className="public-button-secondary public-button-secondary-dark"
            style={{ padding: "14px 40px", fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", backgroundColor: "transparent", color: "#FFFFFF", border: "1.5px solid #FFFFFF", cursor: "pointer", transition: "all 0.2s ease", borderRadius: 8 }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "#C07A4A";
              e.currentTarget.style.borderColor = "#C07A4A";
              e.currentTarget.style.color = "#FFFFFF";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "#FFFFFF";
              e.currentTarget.style.color = "#FFFFFF";
            }}
          >
            Get Notified
          </button>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Properties;
