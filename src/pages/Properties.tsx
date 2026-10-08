import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { api } from "@/lib/api";

const GOLD = "#C9A84C";

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
  if (s === "active" || s === "rented") return "#16a34a";
  if (s === "sold") return GOLD;
  if (s === "pending") return "#EA580C";
  if (s === "off_market") return "#525252";
  return GOLD;
}

function statusBadgeTextColor(status: string | null | undefined): string {
  if (!status) return "#fff";
  return status.toLowerCase() === "sold" ? "#111" : "#fff";
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
      data-testid={`card-property-${listing.id}`}
      onClick={() => navigate(`/property/${listing.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: "#1A1A1A", cursor: "pointer" }}
    >
      <div style={{ position: "relative", height: "240px", overflow: "hidden", flexShrink: 0 }}>
        <img
          src={getImage(listing.main_image, idx)}
          alt={listing.address}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", transition: "transform 0.6s ease", transform: hovered ? "scale(1.05)" : "scale(1)" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 55%, transparent 100%)", transition: "background 0.4s ease" }} />

        {/* Price badge top-left — hidden for sold or null price */}
        {listing.status !== "sold" && price !== null && (
          <div style={{ position: "absolute", top: "14px", left: "14px", backgroundColor: "#16a34a", color: "#fff", padding: "5px 12px", fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {price}
          </div>
        )}

        {/* Status badge top-right */}
        {listing.status && (
          <div style={{ position: "absolute", top: "14px", right: "14px", backgroundColor: statusBadgeColor(listing.status), color: statusBadgeTextColor(listing.status), padding: "5px 12px", fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {statusLabel(listing.status)}
          </div>
        )}

        {/* Content overlay bottom */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "18px 18px 14px" }}>
          {listing.status !== "sold" && price !== null && (
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "21px", fontWeight: 300, color: GOLD, marginBottom: "3px", lineHeight: 1.2 }}>
              {price}
            </p>
          )}
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 400, color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {listing.address}
          </p>
        </div>
      </div>

      {/* Footer bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", backgroundColor: "#1A1A1A", borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 400, letterSpacing: "0.09em", textTransform: "uppercase", color: "rgba(255,255,255,0.50)", margin: 0 }}>
          {listing.beds} Beds&nbsp;·&nbsp;{listing.baths} Baths&nbsp;·&nbsp;{Number(listing.sqft).toLocaleString()} sqft
        </p>
        <Link
          to={`/property/${listing.id}`}
          data-testid={`link-view-details-${listing.id}`}
          onClick={e => e.stopPropagation()}
          style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: GOLD, textDecoration: "none", flexShrink: 0 }}
        >
          View Details →
        </Link>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="animate-pulse" style={{ backgroundColor: "#1A1A1A", height: "380px" }} />
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

      {/* Dark cinematic header */}
      <section style={{ backgroundColor: "#111111", paddingTop: "128px", paddingBottom: "48px", textAlign: "center" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: GOLD, marginBottom: "18px" }}>
          DFW &amp; DFW
        </p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(40px,6vw,72px)", fontWeight: 300, color: "#fff", letterSpacing: "-0.01em", margin: 0 }}>
          All Properties
        </h1>
        <div style={{ width: "48px", height: "1px", backgroundColor: GOLD, margin: "24px auto 0" }} />
      </section>

      {/* Sticky filter bar */}
      <div
        style={{ backgroundColor: "#1A1A1A", borderBottom: "0.5px solid rgba(255,255,255,0.10)", position: "sticky", top: "70px", zIndex: 30 }}
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
                  border: `0.5px solid ${typeFilter === btn.key ? GOLD : "rgba(255,255,255,0.20)"}`,
                  backgroundColor: typeFilter === btn.key ? GOLD : "transparent",
                  color: typeFilter === btn.key ? "#111" : "rgba(255,255,255,0.60)",
                  transition: "all 0.2s ease",
                  borderRadius: 0,
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
              style={{ backgroundColor: "#2A2A2A", border: "0.5px solid rgba(255,255,255,0.20)", color: "rgba(255,255,255,0.70)", fontFamily: "'Inter', sans-serif", fontSize: "11px", letterSpacing: "0.06em", padding: "7px 12px", cursor: "pointer", outline: "none", borderRadius: 0 }}
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
              style={{ backgroundColor: "#2A2A2A", border: "0.5px solid rgba(255,255,255,0.20)", color: "rgba(255,255,255,0.70)", fontFamily: "'Inter', sans-serif", fontSize: "11px", letterSpacing: "0.06em", padding: "7px 12px", cursor: "pointer", outline: "none", borderRadius: 0 }}
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="beds_desc">Most Beds</option>
            </select>

            {/* Count label */}
            {!loading && (
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.30)", letterSpacing: "0.06em" }}>
                {filtered.length} {filtered.length === 1 ? "property" : "properties"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Listings grid */}
      <main style={{ backgroundColor: "#111111", minHeight: "60vh", padding: "48px 0 80px" }}>
        <div className="container mx-auto px-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", paddingTop: "80px", paddingBottom: "80px" }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "15px", color: "rgba(255,255,255,0.30)", marginBottom: "24px" }}>
                No properties match your filters
              </p>
              <button
                data-testid="button-clear-filters"
                onClick={clearFilters}
                style={{ padding: "12px 32px", fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", backgroundColor: "transparent", color: GOLD, border: `0.5px solid ${GOLD}`, cursor: "pointer", borderRadius: 0 }}
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
                    style={{ padding: "14px 48px", fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", backgroundColor: "transparent", color: "rgba(255,255,255,0.70)", border: "0.5px solid rgba(255,255,255,0.25)", cursor: "pointer", transition: "all 0.25s ease", borderRadius: 0 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = GOLD; (e.currentTarget as HTMLButtonElement).style.borderColor = GOLD; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.70)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.25)"; }}
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
      <section style={{ backgroundColor: "#1A1A1A", borderTop: "0.5px solid rgba(255,255,255,0.10)", padding: "64px 0", textAlign: "center" }}>
        <div className="container mx-auto px-6">
          <div style={{ width: "40px", height: "1px", backgroundColor: GOLD, margin: "0 auto 20px" }} />
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: GOLD, marginBottom: "16px" }}>
            Exclusive Inventory
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(28px,4vw,44px)", fontWeight: 300, color: "#fff", marginBottom: "14px" }}>
            More Exceptional Properties Coming Soon
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.50)", marginBottom: "32px", maxWidth: "480px", margin: "0 auto 32px" }}>
            We have exclusive listings not yet on the market. Be the first to know when they're available.
          </p>
          <button
            data-testid="button-get-notified"
            onClick={() => navigate("/home-valuation")}
            style={{ padding: "14px 40px", fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", backgroundColor: "transparent", color: GOLD, border: `0.5px solid ${GOLD}`, cursor: "pointer", transition: "all 0.25s ease", borderRadius: 0 }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = GOLD; (e.currentTarget as HTMLButtonElement).style.color = "#111"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = GOLD; }}
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
