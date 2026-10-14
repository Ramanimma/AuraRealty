import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Bed, Bath, Maximize, MapPin, TrendingUp, CheckCircle, Home, School, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MailingList from "@/components/MailingList";
import { api } from "@/lib/api";
import type { Listing, Neighborhood } from "@/lib/api";

const CITY_IMAGES: Record<string, string> = {
  "Austin": "https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=1200&h=600&fit=crop",
  "Leander": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=600&fit=crop",
  "Liberty Hill": "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&h=600&fit=crop",
  "Georgetown": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=600&fit=crop",
  "Round Rock": "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1200&h=600&fit=crop",
  "Frisco": "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&h=600&fit=crop",
  "Hutto": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&h=600&fit=crop",
};
const DEFAULT_HERO = "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1200&h=600&fit=crop";

function getHeroImage(n: Neighborhood): string {
  if (n.image_url) return n.image_url;
  return (n.city && CITY_IMAGES[n.city]) || DEFAULT_HERO;
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white border border-[#E9EDF3] p-6 flex flex-col items-center text-center shadow-sm" style={{ borderRadius: 8 }}>
      <div className="w-12 h-12 flex items-center justify-center mb-3" style={{ backgroundColor: "#F7F8FA", borderRadius: 8 }}>
        <span style={{ color: "#1E2A44" }}>{icon}</span>
      </div>
      <p className="text-2xl font-bold font-serif text-foreground">{value}</p>
      <p className="text-sm text-[#4B5563] font-sans mt-1">{label}</p>
    </div>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  const navigate = useNavigate();
  return (
    <div
      className="group bg-white overflow-hidden border border-[#E9EDF3] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
      style={{ borderRadius: 8 }}
      onClick={() => navigate(`/property/${listing.id}`)}
      data-testid={`card-listing-${listing.id}`}
    >
      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={listing.main_image || "/placeholder.svg"}
          alt={listing.address}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-semibold font-sans shadow-lg">
          {listing.price}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-serif text-lg font-semibold text-card-foreground mb-2 truncate">{listing.address}</h3>
        <div className="flex items-center gap-4 text-[#4B5563] text-sm font-sans mb-4">
          <span className="flex items-center gap-1"><Bed className="h-4 w-4" /> {listing.beds} Beds</span>
          <span className="flex items-center gap-1"><Bath className="h-4 w-4" /> {listing.baths} Baths</span>
          <span className="flex items-center gap-1"><Maximize className="h-4 w-4" /> {listing.sqft.toLocaleString()} sqft</span>
        </div>
        <Button
          variant="publicSecondary"
          size="sm"
          className="w-full font-sans font-semibold transition-colors"
        >
          View Details
        </Button>
      </div>
    </div>
  );
}

export default function NeighborhoodDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const { data: neighborhood, isLoading: loadingHood, error: hoodError } = useQuery({
    queryKey: ["neighborhood", slug],
    queryFn: () => api.neighborhoods.getBySlug(slug!),
    enabled: !!slug,
    retry: false,
  });

  const { data: listings = [], isLoading: loadingListings } = useQuery({
    queryKey: ["neighborhood-listings", slug],
    queryFn: () => api.neighborhoods.getListings(slug!),
    enabled: !!slug && !!neighborhood,
  });

  // 404 state
  if (!loadingHood && (hoodError || !neighborhood)) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center flex-col gap-4 px-6 text-center">
          <Home className="w-16 h-16 text-[#4B5563]/40" />
          <h1 className="font-serif text-3xl font-bold text-foreground">Neighborhood Not Found</h1>
          <p className="text-[#4B5563] font-sans max-w-md">
            We couldn't find the neighborhood you're looking for. It may have been removed or the link may be incorrect.
          </p>
          <Button
            onClick={() => navigate("/#neighborhoods")}
            variant="publicPrimary"
            className="mt-2 font-sans font-semibold"
          >
            ← Back to Neighborhoods
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  // Loading skeleton
  if (loadingHood) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="animate-pulse">
          <div className="h-[420px] bg-[#E9EDF3]" />
          <div className="container mx-auto px-6 py-16 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => <div key={i} className="h-32 bg-[#E9EDF3] rounded-xl" />)}
            </div>
            <div className="h-48 bg-[#E9EDF3] rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1,2,3].map(i => <div key={i} className="h-72 bg-[#E9EDF3] rounded-xl" />)}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const n = neighborhood!;
  const heroImage = getHeroImage(n);
  const avgPriceDisplay = n.avg_price ? String(n.avg_price) : "—";

  return (
    <div className="min-h-screen">
      <SEOHead
        title={`${neighborhood.name} TX Homes for Sale | Aura Realty`}
        description={`Find homes for sale in ${neighborhood.name}, TX. ${neighborhood.description?.slice(0, 120) ?? ""}. Expert real estate agents serving ${neighborhood.name} and DFW.`}
        keywords={`${neighborhood.name} TX homes for sale, ${neighborhood.name} real estate, homes in ${neighborhood.name} Texas, ${neighborhood.name} TX realtor`}
        ogUrl={`https://aurarealty.com/neighborhoods/${neighborhood.slug}`}
      />
      <Navbar />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative flex h-[220px] items-center justify-center overflow-hidden px-5 md:h-[320px]">
        <img src={heroImage} alt={n.name} className="absolute inset-0 h-full w-full object-cover" />
        <a href="/#neighborhoods" className="absolute left-5 top-4 z-10 flex items-center gap-2 rounded-full border border-white/60 bg-[#1E2A44]/70 px-3 py-2 text-xs text-white transition-colors hover:bg-[#1E2A44]" data-testid="link-back-neighborhoods">
          <ArrowLeft className="w-4 h-4" />Back to Neighborhoods
        </a>
        <div className="public-page-glass relative text-center">
          {n.city && (
            <p className="flex items-center justify-center gap-1.5 text-white/75 text-sm font-sans mb-2">
              <MapPin className="w-4 h-4" />
              {n.city}{n.state ? `, ${n.state}` : ""}
            </p>
          )}
          <h1 className="public-page-title">{n.name}</h1>
          <div className="mx-auto my-3 h-px w-10 bg-[#C07A4A]" />
          {n.avg_price && (
            <span className="inline-block text-sm font-semibold font-sans px-4 py-1.5 rounded-[6px]" style={{ backgroundColor: "#1E2A44", color: "#fff" }}>
              Avg. {avgPriceDisplay}
            </span>
          )}
        </div>
      </section>

      <main>
        {/* ── Stat Cards ──────────────────────────────────────────── */}
        <section className="py-12 bg-[#F7F8FA]">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="Average Price"
                value={avgPriceDisplay}
              />
              <StatCard
                icon={<Activity className="w-5 h-5" />}
                label="Walk Score"
                value={n.walk_score != null ? String(n.walk_score) : "N/A"}
              />
              <StatCard
                icon={<School className="w-5 h-5" />}
                label="School Rating"
                value={n.school_rating != null ? `${n.school_rating}/10` : "N/A"}
              />
              <StatCard
                icon={<Home className="w-5 h-5" />}
                label="Homes Available"
                value={loadingListings ? "…" : String(listings.length)}
              />
            </div>
          </div>
        </section>

        {/* ── About ───────────────────────────────────────────────── */}
        {(n.description || n.lifestyle || (n.highlights && n.highlights.length > 0)) && (
          <section className="py-16 bg-white">
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Left: description + lifestyle */}
                <div>
                  <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-6">
                    About {n.name}
                  </h2>
                  {n.description && (
                    <p className="text-[#4B5563] font-sans leading-relaxed mb-4">{n.description}</p>
                  )}
                  {n.lifestyle && (
                    <p className="text-[#4B5563] font-sans leading-relaxed">{n.lifestyle}</p>
                  )}
                </div>

                {/* Right: highlights */}
                {n.highlights && n.highlights.length > 0 && (
                  <div>
                    <h3 className="font-serif text-xl font-bold text-foreground mb-6">
                      Neighborhood Highlights
                    </h3>
                    <ul className="space-y-3">
                      {n.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-3 rounded-lg border border-[#1E2A44] px-4 py-3">
                          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#C07A4A" }} />
                          <span className="text-[#4B5563] font-sans">{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Available Listings ──────────────────────────────────── */}
        <section className="py-16 bg-[#F7F8FA]">
          <div className="container mx-auto px-6">
            <div className="mb-10">
              <p className="text-[#4B5563] font-semibold text-sm tracking-widest uppercase mb-2 font-sans">
                Available Now
              </p>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
                Listings in {n.name}
              </h2>
            </div>

            {loadingListings ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl overflow-hidden border border-[#E9EDF3] shadow-sm animate-pulse">
                    <div className="aspect-[4/3] bg-[#E9EDF3]" />
                    <div className="p-5 space-y-3">
                      <div className="h-5 bg-[#E9EDF3] rounded w-3/4" />
                      <div className="h-4 bg-[#E9EDF3] rounded w-1/2" />
                      <div className="h-9 bg-[#E9EDF3] rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#E9EDF3]">
                <Home className="w-12 h-12 text-[#4B5563]/30 mx-auto mb-4" />
                <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                  No current listings in {n.city || n.name}
                </h3>
                <p className="text-[#4B5563] font-sans max-w-md mx-auto mb-6">
                  New properties are coming soon. Contact us to be notified when listings become available in this area.
                </p>
                <a href="/#contact">
                  <Button variant="publicPrimary" className="font-sans font-semibold">
                    Contact an Agent
                  </Button>
                </a>
              </div>
            )}
          </div>
        </section>

        {/* ── Market Snapshot ─────────────────────────────────────── */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-6">
            <div className="mb-8">
              <p className="text-[#A8653A] font-semibold text-sm tracking-widest uppercase mb-2 font-sans">Market Data</p>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">Market Snapshot</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-[#E9EDF3] rounded-xl p-6 shadow-sm">
                <p className="text-sm text-[#4B5563] font-sans mb-1">Median List Price</p>
                <p className="text-2xl font-bold font-serif text-foreground">{avgPriceDisplay}</p>
              </div>
              <div className="bg-white border border-[#E9EDF3] rounded-xl p-6 shadow-sm">
                <p className="text-sm text-[#4B5563] font-sans mb-1">Active Listings</p>
                <p className="text-2xl font-bold font-serif text-foreground">
                  {loadingListings ? "…" : listings.length}
                </p>
              </div>
              <div className="bg-white border border-[#E9EDF3] rounded-xl p-6 shadow-sm">
                <p className="text-sm text-[#4B5563] font-sans mb-1">Market Update</p>
                <p className="text-sm font-sans text-[#4B5563] leading-relaxed">
                  Market data updated regularly by our team. Contact an agent for a personalized report.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────── */}
        <section className="py-20" style={{ backgroundColor: "#1E2A44" }}>
          <div className="container mx-auto px-6 text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
              Interested in {n.name}?
            </h2>
            <p className="text-white/75 font-sans max-w-xl mx-auto mb-10">
              Our local experts know this neighborhood inside and out. Let's find your perfect home here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/#contact" data-testid="button-schedule-consultation">
                <Button
                  size="lg"
                  variant="publicPrimary"
                  className="font-sans font-semibold w-full sm:w-auto"
                >
                  Schedule a Consultation
                </Button>
              </a>
              <a href="/mortgage-calculator" data-testid="button-mortgage-calculator">
                <Button
                  size="lg"
                  variant="publicSecondary"
                  className="public-button-secondary-dark font-sans font-semibold w-full sm:w-auto"
                >
                  Calculate Mortgage
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      <MailingList />
      <Footer />
    </div>
  );
}
