import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { api } from "@/lib/api";
import { PropertyCard } from "@/components/FeaturedProperties";
import PublicPageHeader from "@/components/PublicPageHeader";

const GOLD = "#C07A4A";

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

const PAGE_SIZE = 9;

type SortKey = "newest" | "price_asc" | "price_desc" | "beds_desc";
type TypeFilter = "all" | "sale" | "rent" | "lease";

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

      <PublicPageHeader eyebrow="DFW & DFW" title="All Properties" subtitle="Homes for sale, rent, and lease across our available communities." />

      {/* Sticky filter bar */}
      <div
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
                  border: `1px solid ${typeFilter === btn.key ? GOLD : "#E9EDF3"}`,
                  backgroundColor: typeFilter === btn.key ? GOLD : "#FFFFFF",
                  color: typeFilter === btn.key ? "#FFFFFF" : "#1E2A44",
                  transition: "all 0.2s ease",
                  borderRadius: 8,
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
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "15px", color: "rgba(255,255,255,0.75)", marginBottom: "24px" }}>
                No properties match your filters
              </p>
              <button
                data-testid="button-clear-filters"
                onClick={clearFilters}
                className="public-button-secondary public-button-secondary-dark"
                style={{ padding: "12px 32px", fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", backgroundColor: "transparent", color: GOLD, border: `0.5px solid ${GOLD}`, cursor: "pointer", borderRadius: 8 }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {visible.map((listing, i) => (
                  <PropertyCard key={listing.id} p={listing} idx={i} />
                ))}
              </div>
              {hasMore && (
                <div style={{ textAlign: "center", marginTop: "48px" }}>
                  <button
                    data-testid="button-load-more"
                    onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                    className="public-button-secondary public-button-secondary-dark"
                    style={{ padding: "14px 48px", fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", backgroundColor: "transparent", color: "rgba(255,255,255,0.75)", border: "0.5px solid rgba(255,255,255,0.25)", cursor: "pointer", transition: "all 0.25s ease", borderRadius: 8 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = GOLD; (e.currentTarget as HTMLButtonElement).style.borderColor = GOLD; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.75)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.25)"; }}
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
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: GOLD, marginBottom: "16px" }}>
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
            className="public-button-primary"
            style={{ padding: "14px 40px", fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", backgroundColor: "transparent", color: GOLD, border: `0.5px solid ${GOLD}`, cursor: "pointer", transition: "all 0.25s ease", borderRadius: 8 }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = GOLD; (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF"; }}
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
