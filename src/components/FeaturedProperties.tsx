import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const GOLD = "#C07A4A";

function formatPrice(price: string | null | undefined, listingType: string | null | undefined): string | null {
  if (!price || price.trim() === "") return null;
  if (price.toLowerCase().includes("/mo")) return price;
  const num = parseFloat(price.replace(/[^0-9.]/g, ""));
  if (!num) return price;
  const formatted = "$" + num.toLocaleString();
  if (listingType === "rent" || listingType === "lease") return formatted + "/mo";
  return formatted;
}

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  active: { label: "ACTIVE", bg: "#16a34a", text: "#fff" },
  pending: { label: "PENDING", bg: "#EA580C", text: "#fff" },
  sold: { label: "SOLD", bg: GOLD, text: "#111" },
  rented: { label: "RENTED", bg: "#16a34a", text: "#fff" },
  off_market: { label: "OFF MARKET", bg: "#525252", text: "#fff" },
};

const UNSPLASH_FALLBACKS = [
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
];

function getListingImage(mainImage: string | null | undefined, index: number): string {
  if (!mainImage || mainImage.startsWith("/assets/")) {
    return UNSPLASH_FALLBACKS[index % UNSPLASH_FALLBACKS.length];
  }
  return mainImage;
}

interface PropertyCardProps {
  p: {
    id: string | number;
    address: string;
    price: string;
    beds: number;
    baths: number;
    sqft: number;
    main_image?: string | null;
    status?: string | null;
    listing_type?: string | null;
    title: string;
  };
  idx: number;
}

const PropertyCard = ({ p, idx }: PropertyCardProps) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const price = formatPrice(p.price, p.listing_type);
  const statusKey = p.status?.toLowerCase() ?? "";
  const statusStyle = STATUS_STYLES[statusKey];

  return (
    <div
      data-testid={`card-property-${p.id}`}
      onClick={() => navigate(`/property/${p.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: "#26324C", cursor: "pointer" }}
    >
      {/* Image — 4:3 aspect ratio via padding trick */}
      <div style={{ position: "relative", paddingTop: "75%", overflow: "hidden", flexShrink: 0 }}>
        <img
          src={getListingImage(p.main_image, idx)}
          alt={p.address}
          loading="lazy"
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", transition: "transform 0.6s ease", transform: hovered ? "scale(1.03)" : "scale(1)" }}
        />

        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, rgba(0,0,0,${hovered ? "0.97" : "0.92"}) 0%, rgba(0,0,0,0.3) 55%, transparent 100%)`, transition: "background 0.4s ease" }} />

        {/* Price badge top-left — hidden for sold or null price */}
        {statusKey !== "sold" && price !== null && (
          <div style={{ position: "absolute", top: "16px", left: "16px", backgroundColor: "#16a34a", color: "#fff", padding: "5px 12px", fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {price}
          </div>
        )}

        {/* Status badge top-right */}
        {statusStyle && (
          <div style={{ position: "absolute", top: "16px", right: "16px", backgroundColor: statusStyle.bg, color: statusStyle.text, padding: "5px 12px", fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {statusStyle.label}
          </div>
        )}

        {/* Content bottom */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 20px 16px" }}>
          {statusKey !== "sold" && price !== null && (
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: 300, color: GOLD, marginBottom: "4px", lineHeight: 1.2 }}>
              {price}
            </p>
          )}
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 400, color: "rgba(255,255,255,0.85)", marginBottom: "10px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {p.address}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 400, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.50)" }}>
              {p.beds} Beds&nbsp;·&nbsp;{p.baths} Baths&nbsp;·&nbsp;{Number(p.sqft).toLocaleString()} sqft
            </p>
            <button
              data-testid={`button-view-details-${p.id}`}
              onClick={e => { e.stopPropagation(); navigate(`/property/${p.id}`); }}
              style={{ padding: "6px 14px", fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", backgroundColor: "transparent", color: "#fff", border: "0.5px solid rgba(255,255,255,0.3)", cursor: "pointer", transition: "border-color 0.2s, color 0.2s", borderRadius: 8, whiteSpace: "nowrap", flexShrink: 0 }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = GOLD; (e.currentTarget as HTMLButtonElement).style.color = GOLD; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.3)"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeaturedProperties = () => {
  const navigate = useNavigate();
  const [viewAllHovered, setViewAllHovered] = useState(false);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["listings"],
    queryFn: () => api.listings.list(),
  });

  return (
    <section id="properties" style={{ backgroundColor: "#141C2E", padding: "80px 0 80px" }}>
      <div className="container mx-auto px-6">

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: GOLD, marginBottom: "16px" }}>
            Featured Listings
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(32px,4vw,48px)", fontWeight: 300, color: "#fff", letterSpacing: "-0.01em" }}>
            Explore Austin's Finest Properties
          </h2>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse" style={{ paddingTop: "75%", backgroundColor: "#26324C", position: "relative" }} />
            ))}
          </div>
        ) : properties.length === 0 ? null : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((p, i) => (
              <PropertyCard key={p.id} p={p} idx={i} />
            ))}
          </div>
        )}

        {/* View All button */}
        <div style={{ textAlign: "center", marginTop: "48px" }}>
          <button
            data-testid="button-view-all-properties"
            onClick={() => navigate("/properties")}
            onMouseEnter={() => setViewAllHovered(true)}
            onMouseLeave={() => setViewAllHovered(false)}
            style={{ padding: "14px 48px", fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", backgroundColor: "transparent", color: viewAllHovered ? GOLD : "rgba(255,255,255,0.70)", border: `0.5px solid ${viewAllHovered ? GOLD : "rgba(255,255,255,0.25)"}`, cursor: "pointer", transition: "all 0.25s ease", borderRadius: 8 }}
          >
            View All Properties
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProperties;
