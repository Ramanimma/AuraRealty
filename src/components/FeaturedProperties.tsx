import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BedDouble, Bath, Ruler } from "lucide-react";
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
  active: { label: "ACTIVE", bg: "#1E2A44", text: "#FFFFFF" },
  pending: { label: "PENDING", bg: "#F3E6DC", text: "#8A4F2A" },
  sold: { label: "SOLD", bg: "#141C2E", text: "#FFFFFF" },
  rented: { label: "RENTED", bg: "#E9EDF3", text: "#1E2A44" },
  off_market: { label: "OFF MARKET", bg: "#E9EDF3", text: "#4B5563" },
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
      style={{ display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: "#FFFFFF", border: "1px solid #E9EDF3", borderRadius: 12, cursor: "pointer", transition: "transform 200ms ease, box-shadow 200ms ease", transform: hovered ? "translateY(-3px)" : "translateY(0)", boxShadow: hovered ? "0 16px 36px rgba(30,42,68,0.12)" : "0 4px 14px rgba(30,42,68,0.04)" }}
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
        {/* Status badge top-right */}
        {statusStyle && (
          <div style={{ position: "absolute", top: "16px", right: "16px", backgroundColor: statusStyle.bg, color: statusStyle.text, padding: "5px 12px", fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: 6 }}>
            {statusStyle.label}
          </div>
        )}
      </div>
      <div style={{ padding: "20px 20px 18px" }}>
          {statusKey !== "sold" && price !== null && (
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "25px", fontWeight: 500, color: "#1E2A44", marginBottom: "5px", lineHeight: 1.2 }}>
              {price}
            </p>
          )}
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", fontWeight: 500, color: "#1E2A44", marginBottom: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {p.address}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: "1 1 190px", minWidth: 0 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#4B5563", whiteSpace: "nowrap" }}><BedDouble size={14} />{p.beds} Beds</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#4B5563", whiteSpace: "nowrap" }}><Bath size={14} />{p.baths} Baths</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#4B5563", whiteSpace: "nowrap" }}><Ruler size={14} />{Number(p.sqft).toLocaleString()} sqft</span>
            </div>
            <button
              data-testid={`button-view-details-${p.id}`}
              onClick={e => { e.stopPropagation(); navigate(`/property/${p.id}`); }}
              style={{ padding: "7px 12px", fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", backgroundColor: "transparent", color: "#1E2A44", border: "1px solid #E9EDF3", cursor: "pointer", transition: "border-color 0.2s, color 0.2s", borderRadius: 8, whiteSpace: "nowrap", flexShrink: 0 }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = GOLD; (e.currentTarget as HTMLButtonElement).style.color = GOLD; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#E9EDF3"; (e.currentTarget as HTMLButtonElement).style.color = "#1E2A44"; }}
            >
              View Details
            </button>
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
    <section id="properties" className="py-16 md:py-24" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="container mx-auto px-6">

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: GOLD, marginBottom: "16px" }}>
            Featured Listings
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(32px,4vw,48px)", fontWeight: 500, color: "#1E2A44", letterSpacing: "-0.01em" }}>
            Explore Austin's Finest Properties
          </h2>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse" style={{ paddingTop: "75%", backgroundColor: "#E9EDF3", position: "relative", borderRadius: 12 }} />
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
            className="public-button-secondary"
            onMouseEnter={() => setViewAllHovered(true)}
            onMouseLeave={() => setViewAllHovered(false)}
            style={{ padding: "14px 32px", fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", backgroundColor: viewAllHovered ? "#A8653A" : GOLD, color: "#FFFFFF", border: "none", cursor: "pointer", transition: "all 0.25s ease", borderRadius: 8 }}
          >
            View All Properties
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProperties;
