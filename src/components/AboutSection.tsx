import { MapPin, Users, TrendingUp, Award } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const features = [
  { icon: MapPin, title: "Local Expertise", desc: "Deep knowledge of Austin's neighborhoods, schools, and market trends." },
  { icon: Users, title: "Personalized Service", desc: "Tailored guidance for every client, from first-time buyers to investors." },
  { icon: TrendingUp, title: "Market Knowledge", desc: "Data-driven insights to help you make confident decisions." },
  { icon: Award, title: "Proven Results", desc: "Hundreds of successful transactions and satisfied clients across Texas." },
];

const AboutSection = () => {
  const sectionRef = useScrollAnimation();

  return (
    <section
      id="about"
      className="py-16 md:py-24"
      ref={sectionRef}
      style={{ backgroundColor: "#F7F8FA", opacity: 0, scrollMarginTop: "84px" }}
    >
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Image */}
          <div className="relative">
            <div style={{ position: "relative" }}>
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop"
                alt="Luxury Austin home exterior"
                className="w-full object-cover aspect-[4/5]"
                style={{ borderRadius: 12, display: "block" }}
                loading="lazy"
              />
              <div style={{ position: "absolute", inset: 0, background: "rgba(30,42,68,0.08)", borderRadius: 12 }} />
            </div>
          </div>

          {/* Content */}
          <div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 400, letterSpacing: "0.22em", textTransform: "uppercase", color: "#A8653A", marginBottom: "16px" }}>
              Why Choose Us
            </p>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(36px, 4vw, 48px)", fontWeight: 500, color: "#1E2A44", letterSpacing: "-0.01em", lineHeight: 1.15, marginBottom: "24px" }}>
              Your Trusted DFW<br />Real Estate Partner
            </h2>
            <p className="mb-12 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif", fontSize: "15px", fontWeight: 400, lineHeight: 1.75, color: "#4B5563" }}>
              At Aura Realty, we combine deep local knowledge with a commitment to exceptional service. Whether you're buying your first home or building an investment portfolio, our team delivers personalized guidance every step of the way.
            </p>

            <div className="grid sm:grid-cols-2 gap-8">
              {features.map((f) => (
                <div key={f.title} className="flex gap-4">
                  <div
                    className="flex-shrink-0 w-11 h-11 flex items-center justify-center"
                    style={{ backgroundColor: "rgba(192,122,74,0.10)", borderRadius: 8 }}
                  >
                    <f.icon className="h-5 w-5" style={{ color: "#A8653A" }} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "19px", fontWeight: 600, color: "#1E2A44", marginBottom: "4px" }}>
                      {f.title}
                    </h3>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 400, lineHeight: 1.6, color: "#4B5563" }}>
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
