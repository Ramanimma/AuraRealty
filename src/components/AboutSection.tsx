import { MapPin, Users, TrendingUp, Award } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const GOLD = "#C07A4A";

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
      className="py-32"
      ref={sectionRef}
      style={{ backgroundColor: "#1E2A44", opacity: 0 }}
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
                style={{ borderRadius: 8, display: "block" }}
                loading="lazy"
              />
              <div style={{ position: "absolute", inset: 0, background: "rgba(30,42,68,0.15)" }} />
            </div>
          </div>

          {/* Content */}
          <div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 400, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, marginBottom: "16px" }}>
              Why Choose Us
            </p>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(36px, 4vw, 48px)", fontWeight: 300, color: "#fff", letterSpacing: "-0.01em", lineHeight: 1.15, marginBottom: "24px" }}>
              Your Trusted DFW<br />Real Estate Partner
            </h2>
            <p className="mb-12 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif", fontSize: "15px", fontWeight: 300, lineHeight: 1.75, color: "rgba(255,255,255,0.75)" }}>
              At Aura Realty, we combine deep local knowledge with a commitment to exceptional service. Whether you're buying your first home or building an investment portfolio, our team delivers personalized guidance every step of the way.
            </p>

            <div className="grid sm:grid-cols-2 gap-8">
              {features.map((f) => (
                <div key={f.title} className="flex gap-4">
                  <div
                    className="flex-shrink-0 w-11 h-11 flex items-center justify-center"
                    style={{ backgroundColor: "rgba(192,122,74,0.10)", borderRadius: 8 }}
                  >
                    <f.icon className="h-5 w-5" style={{ color: GOLD }} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "18px", fontWeight: 500, color: "#fff", marginBottom: "4px" }}>
                      {f.title}
                    </h3>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 300, lineHeight: 1.6, color: "rgba(255,255,255,0.75)" }}>
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
