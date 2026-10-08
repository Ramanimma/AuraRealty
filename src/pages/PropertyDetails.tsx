import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Bed, Bath, Maximize, ArrowLeft, Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api, type Listing } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

const GOLD = "#C9A84C";

function getImages(listing: Listing): string[] {
  if (listing.images && listing.images.length > 0) return listing.images;
  if (listing.main_image) return [listing.main_image];
  return [];
}

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const { data: property, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => api.listings.get(id!),
    enabled: !!id,
  });

  const imgs = useMemo(() => (property ? getImages(property) : []), [property]);

  const prev = () => setActiveIdx((i) => Math.max(0, i - 1));
  const next = () => setActiveIdx((i) => Math.min(imgs.length - 1, i + 1));
  const handleShare = async () => {
    const shareData = {
      title: property.title || property.address,
      text: `Check out this property: ${property.address} — ${property.beds} bed, ${property.baths} bath at ${property.price}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied to clipboard!" });
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [imgs.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground font-sans">Loading property...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-serif text-3xl font-bold text-foreground mb-4">Property Not Found</h1>
            <Button onClick={() => navigate("/properties")} variant="outline" className="font-sans">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Listings
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const mainSrc = imgs[activeIdx] ?? "/placeholder.svg";

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={`${property.address} | ${property.beds} bed ${property.baths} bath | Texas Realty Hub`}
        description={`${property.beds} bedroom ${property.baths} bathroom home at ${property.address}. ${Number(property.sqft).toLocaleString()} sqft listed at ${property.price}. Contact Texas Realty Hub today.`}
        keywords={`${property.address}, homes for sale ${property.city} TX, ${property.beds} bedroom homes ${property.city}`}
        ogUrl={`https://texasrealtyhub.com/property/${property.id}`}
        ogImage={property.main_image || "https://xxiwznuuaouwsugtgsut.supabase.co/storage/v1/object/public/agent-photos/LogoWithTransBackgrnd%20(1).png"}
        schema={{
          "@context": "https://schema.org",
          "@type": "RealEstateListing",
          name: property.address,
          description: property.description,
          url: `https://texasrealtyhub.com/property/${property.id}`,
          image: property.main_image,
          offers: { "@type": "Offer", price: property.price, priceCurrency: "USD" },
        }}
      />
      <Navbar />
      <main className="flex-1">

        {/* ── Gallery ── */}
        <div style={{ backgroundColor: "#111" }}>
          {/* Main image */}
          <div
            style={{ position: "relative", width: "100%", height: "clamp(300px, 45vw, 500px)", overflow: "hidden", cursor: imgs.length > 0 ? "zoom-in" : "default" }}
            onClick={() => imgs.length > 0 && setLightboxOpen(true)}
          >
            <img
              src={mainSrc}
              alt={property.address}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            {/* Bottom gradient */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)", pointerEvents: "none" }} />

            {/* Left arrow */}
            {imgs.length > 1 && activeIdx > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                data-testid="button-gallery-prev"
                style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.55)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", transition: "background-color 0.2s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(0,0,0,0.8)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(0,0,0,0.55)"; }}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            {/* Right arrow */}
            {imgs.length > 1 && activeIdx < imgs.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                data-testid="button-gallery-next"
                style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.55)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", transition: "background-color 0.2s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(0,0,0,0.8)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(0,0,0,0.55)"; }}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}

            {/* Counter */}
            {imgs.length > 1 && (
              <div style={{ position: "absolute", bottom: "14px", right: "16px", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#fff", backgroundColor: "rgba(0,0,0,0.55)", padding: "3px 10px", borderRadius: "20px", pointerEvents: "none" }}>
                {activeIdx + 1} / {imgs.length}
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {imgs.length > 1 && (
            <div style={{ display: "flex", gap: "6px", padding: "10px 16px", overflowX: "auto", backgroundColor: "#0d0d0d" }}>
              {imgs.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  data-testid={`button-thumbnail-${i}`}
                  style={{ flexShrink: 0, width: "80px", height: "60px", padding: 0, border: `2px solid ${i === activeIdx ? GOLD : "transparent"}`, cursor: "pointer", backgroundColor: "transparent", transition: "border-color 0.2s, opacity 0.2s", opacity: i === activeIdx ? 1 : 0.55 }}
                  onMouseEnter={(e) => { if (i !== activeIdx) (e.currentTarget as HTMLButtonElement).style.opacity = "0.8"; }}
                  onMouseLeave={(e) => { if (i !== activeIdx) (e.currentTarget as HTMLButtonElement).style.opacity = "0.55"; }}
                >
                  <img src={src} alt={`View ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="container mx-auto px-6 py-12 md:py-16">
          <div className="max-w-4xl mx-auto">
            {/* Price & Address */}
            <div className="mb-8">
              <p className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">{property.price}</p>
              <p className="font-sans text-muted-foreground text-lg">{property.address}</p>
            </div>

            {/* Key Details */}
            <div className="flex flex-wrap gap-6 mb-10 pb-10 border-b border-border">
              <div className="flex items-center gap-2 text-foreground font-sans">
                <Bed className="h-5 w-5 text-accent" />
                <span className="text-lg font-semibold">{property.beds}</span>
                <span className="text-muted-foreground">Beds</span>
              </div>
              <div className="flex items-center gap-2 text-foreground font-sans">
                <Bath className="h-5 w-5 text-accent" />
                <span className="text-lg font-semibold">{property.baths}</span>
                <span className="text-muted-foreground">Baths</span>
              </div>
              <div className="flex items-center gap-2 text-foreground font-sans">
                <Maximize className="h-5 w-5 text-accent" />
                <span className="text-lg font-semibold">{property.sqft.toLocaleString()}</span>
                <span className="text-muted-foreground">Sq Ft</span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-12">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">About This Property</h2>
              <p className="font-sans text-muted-foreground leading-relaxed text-base">{property.description}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate("/contact", {
                  state: {
                    propertyAddress: property.address,
                    propertyTitle: property.title || property.address,
                  },
                })}
                className="inline-flex items-center gap-2 bg-[#C9A84C] text-black px-6 py-3 text-sm font-medium hover:bg-[#b8963d] transition-colors"
              >
                📅 Schedule a Tour
              </button>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-[#C9A84C] text-[#C9A84C] px-6 py-3 text-sm font-medium hover:bg-[#C9A84C] hover:text-black transition-colors"
              >
                📍 View on Map
              </a>
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 border border-[#C9A84C] text-[#C9A84C] px-6 py-3 text-sm font-medium hover:bg-[#C9A84C] hover:text-black transition-colors"
              >
                🔗 Share
              </button>
              <Button variant="outline" size="lg" className="font-sans font-semibold border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => navigate("/properties")}>
                <ArrowLeft className="h-4 w-4 mr-2" />Back to Listings
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* ── Lightbox ── */}
      {lightboxOpen && imgs.length > 0 && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxOpen(false)}
            data-testid="button-lightbox-close"
            style={{ position: "absolute", top: "16px", right: "16px", width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}
          >
            <X className="h-5 w-5" />
          </button>

          {/* Prev */}
          {activeIdx > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              data-testid="button-lightbox-prev"
              style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Image */}
          <img
            src={imgs[activeIdx]}
            alt={`${property.address} — ${activeIdx + 1}`}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", display: "block" }}
          />

          {/* Next */}
          {activeIdx < imgs.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              data-testid="button-lightbox-next"
              style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Counter */}
          {imgs.length > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#fff", backgroundColor: "rgba(0,0,0,0.55)", padding: "4px 14px", borderRadius: "20px" }}
            >
              {activeIdx + 1} / {imgs.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;
