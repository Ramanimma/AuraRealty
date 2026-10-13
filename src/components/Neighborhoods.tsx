import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Neighborhood } from "@/lib/api";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const GOLD = "#C07A4A";

const CITY_IMAGES: Record<string, string> = {
  "Austin": "https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=600&h=600&fit=crop",
  "Leander": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=600&fit=crop",
  "Liberty Hill": "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&h=600&fit=crop",
  "Georgetown": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=600&fit=crop",
  "Round Rock": "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=600&h=600&fit=crop",
  "Cedar Park": "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&h=600&fit=crop",
  "Hutto": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=600&fit=crop",
};
const DEFAULT_SMALL = "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=600&h=600&fit=crop";

function getCardImage(n: Neighborhood): string {
  if (n.image_url) return n.image_url;
  return (n.city && CITY_IMAGES[n.city]) || DEFAULT_SMALL;
}

const FALLBACK_CARDS = [
  { name: "Downtown Austin", city: "Austin", image: CITY_IMAGES["Austin"], slug: null },
  { name: "Westlake Hills", city: "Austin", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=600&fit=crop", slug: null },
  { name: "South Congress", city: "Austin", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=600&fit=crop", slug: null },
  { name: "East Austin", city: "Austin", image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=600&fit=crop", slug: null },
  { name: "Mueller", city: "Austin", image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&h=600&fit=crop", slug: null },
  { name: "Lakeway", city: "Austin", image: "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=600&h=600&fit=crop", slug: null },
];

const CtaCard = () => (
  <div
    className="aspect-square flex flex-col items-center justify-center text-center px-8"
    style={{ backgroundColor: "#0D0D0D" }}
  >
    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontStyle: "italic", fontWeight: 400, color: GOLD, lineHeight: 1.3, marginBottom: "12px" }}>
      More Areas
      <br />Coming Soon
    </p>
    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 400, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
      Expanding across Central Texas
    </p>
  </div>
);

const Neighborhoods = () => {
  const navigate = useNavigate();
  const sectionRef = useScrollAnimation();

  const { data: neighborhoods = [], isLoading } = useQuery({
    queryKey: ["neighborhoods"],
    queryFn: () => api.neighborhoods.list(),
  });

  const showFallback = !isLoading && neighborhoods.length === 0;
  const items = showFallback ? FALLBACK_CARDS : neighborhoods;
  const needsCta = items.length % 3 === 1;

  return (
    <section
      id="neighborhoods"
      className="py-32"
      ref={sectionRef}
      style={{ backgroundColor: "#1A2438", opacity: 0 }}
    >
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 400, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, marginBottom: "16px" }}>
            Explore Austin
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(36px, 4vw, 48px)", fontWeight: 300, color: "#fff", letterSpacing: "-0.01em" }}>
            Neighborhood Spotlight
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0.5">
          {isLoading
            ? [1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square animate-pulse" style={{ backgroundColor: "#26324C" }} />
              ))
            : items.map((n, idx) => {
                const isNeighborhood = "id" in n;
                const name = n.name;
                const city = n.city;
                const avgPrice = isNeighborhood ? (n as Neighborhood).avg_price : null;
                const slug = isNeighborhood ? (n as Neighborhood).slug : null;
                const image = isNeighborhood
                  ? getCardImage(n as Neighborhood)
                  : (n as typeof FALLBACK_CARDS[0]).image;
                const clickable = !!slug;

                return (
                  <div
                    key={isNeighborhood ? (n as Neighborhood).id : idx}
                    data-testid={`card-neighborhood-${slug ?? idx}`}
                    className="group relative aspect-square overflow-hidden"
                    style={{ cursor: clickable ? "pointer" : "default" }}
                  >
                    <img
                      src={image}
                      alt={name}
                      className="w-full h-full object-cover"
                      style={{ transition: "transform 0.7s ease" }}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div
                      className="absolute inset-0"
                      onMouseEnter={(e) => {
                        const img = (e.currentTarget as HTMLDivElement).previousElementSibling?.previousElementSibling as HTMLImageElement;
                        if (img) img.style.transform = "scale(1.08)";
                      }}
                      onMouseLeave={(e) => {
                        const img = (e.currentTarget as HTMLDivElement).previousElementSibling?.previousElementSibling as HTMLImageElement;
                        if (img) img.style.transform = "scale(1)";
                      }}
                    />
                    {clickable && (
                      <Link
                        to={`/neighborhoods/${slug}`}
                        aria-label={`Explore ${name}`}
                        style={{ position: "absolute", inset: 0, zIndex: 20 }}
                      />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-7">
                      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontStyle: "italic", fontWeight: 400, color: "#fff", lineHeight: 1.2, marginBottom: "4px" }}>
                        {name}
                      </h3>
                      {(city || avgPrice) && (
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 400, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>
                          {city}{avgPrice ? ` · ${avgPrice}` : ""}
                        </p>
                      )}
                      {clickable && (
                        <p
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-2"
                          style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD }}
                        >
                          Explore →
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

          {!isLoading && needsCta && <CtaCard />}
        </div>
      </div>
    </section>
  );
};

export default Neighborhoods;
