import { useState, useRef, useEffect } from "react";
import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import ReviewModal from "@/components/ReviewModal";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const GOLD = "#C07A4A";

const staticTestimonials = [
  { client_name: "Sarah & James Mitchell", comment: "Aura Realty made our home-buying experience seamless. Their market knowledge in the DFW area is unmatched. We found our dream home in Westlake within weeks.", rating: 5 },
  { client_name: "David Chen", comment: "As an out-of-state investor, I needed a team I could trust. They guided me through every step and helped me build a profitable rental portfolio in East Austin.", rating: 5 },
  { client_name: "Maria Gonzalez", comment: "Professional, responsive, and genuinely caring. They negotiated an incredible deal on our first home. I recommend Aura Realty to everyone I know.", rating: 5 },
];

const Testimonials = () => {
  const [reviewOpen, setReviewOpen] = useState(false);
  const sectionRef = useScrollAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const { data: approvedReviews } = useQuery({
    queryKey: ["approved-reviews"],
    queryFn: () => api.reviews.list(),
  });

  const dynamicSlides = (approvedReviews ?? []).map((r) => ({
    client_name: r.client_name,
    comment: r.comment,
    rating: r.rating,
  }));

  const allSlides = [...dynamicSlides, ...staticTestimonials];
  const loopedReviews = [...allSlides, ...allSlides];

  useEffect(() => {
    const update = () => {
      const container = containerRef.current;
      const track = trackRef.current;
      if (container && track) {
        const containerRect = container.getBoundingClientRect();
        const containerCenter = containerRect.left + containerRect.width / 2;
        const cards = track.querySelectorAll<HTMLDivElement>("[data-card]");
        cards.forEach((card) => {
          const rect = card.getBoundingClientRect();
          const cardCenter = rect.left + rect.width / 2;
          const dist = Math.abs(cardCenter - containerCenter);
          if (dist < 160) {
            card.style.transform = "scale(1.07)";
            card.style.opacity = "1";
          } else {
            card.style.transform = "scale(0.93)";
            card.style.opacity = "0.55";
          }
        });
      }
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section
      id="testimonials"
      className="py-16 md:py-24"
      ref={sectionRef}
      style={{ backgroundColor: "#1E2A44", opacity: 0 }}
    >
      <style>{`
        @keyframes scrollLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .testimonial-track {
          animation: scrollLeft 30s linear infinite;
        }
        .testimonial-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 400, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, marginBottom: "16px" }}>
            Client Stories
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(36px, 4vw, 48px)", fontWeight: 400, color: "#fff", letterSpacing: "-0.01em" }}>
            What Our Clients Say
          </h2>
        </div>
      </div>

      {/* Scrolling carousel */}
      <div ref={containerRef} style={{ overflow: "hidden", width: "100%" }}>
        <div
          ref={trackRef}
          className="testimonial-track"
          style={{ display: "flex", width: "max-content", gap: "24px", padding: "24px 0" }}
        >
          {loopedReviews.map((t, idx) => (
            <div
              key={`${t.client_name}-${idx}`}
              data-card=""
              style={{
                width: "min(360px, 82vw)",
                flexShrink: 0,
                transition: "transform 0.3s ease, opacity 0.3s ease",
              }}
            >
              <div
                className="h-full flex flex-col p-10"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, position: "relative" }}
              >
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "80px", lineHeight: 1, color: GOLD, opacity: 0.2, position: "absolute", top: "20px", left: "28px", userSelect: "none" }}>
                  "
                </div>
                <div className="flex gap-1 mb-5 relative z-10">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#C07A4A] text-[#C07A4A]" />
                  ))}
                </div>
                <p
                  className="flex-1 mb-6 relative z-10"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontStyle: "italic", fontWeight: 400, lineHeight: 1.6, color: "rgba(255,255,255,0.75)" }}
                >
                  "{t.comment}"
                </p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD }}>
                  {t.client_name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leave a Review — static, below the carousel */}
      <div className="text-center mt-14">
        <button
          onClick={() => setReviewOpen(true)}
          data-testid="button-leave-review"
          className="public-button-secondary public-button-secondary-dark px-8 py-3 text-xs tracking-widest uppercase"
        >
          Leave a Review
        </button>
      </div>

      <ReviewModal open={reviewOpen} onOpenChange={setReviewOpen} />
    </section>
  );
};

export default Testimonials;
