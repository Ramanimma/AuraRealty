import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturedProperties from "@/components/FeaturedProperties";
import AboutSection from "@/components/AboutSection";
import Testimonials from "@/components/Testimonials";
import Neighborhoods from "@/components/Neighborhoods";
import Footer from "@/components/Footer";
import ContactSection from "@/components/ContactSection";
import MailingList from "@/components/MailingList";
import SEOHead from "@/components/SEOHead";

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
      }
    }
  }, [location]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#141C2E" }}>
      <SEOHead
        title="Aura Realty | Homes for Sale in Austin & DFW"
        description="Find homes for sale in Leander, Frisco, Georgetown, Round Rock, Liberty Hill, Hutto and Austin TX. Expert real estate agents serving DFW."
        keywords="homes for sale Austin TX, real estate agent Leander TX, Frisco homes, Georgetown TX real estate, Round Rock homes for sale, Liberty Hill real estate"
        ogUrl="https://aurarealty.com"
        schema={{
          "@context": "https://schema.org",
          "@type": "RealEstateAgent",
          "name": "Aura Realty",
          "url": "https://aurarealty.com",
          "logo": "https://xxiwznuuaouwsugtgsut.supabase.co/storage/v1/object/public/agent-photos/LogoWithTransBackgrnd%20(1).png",
          "telephone": "+17327402800",
          "email": "agent1@aurarealty.com",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Frisco",
            "addressRegion": "TX",
            "addressCountry": "US"
          },
          "areaServed": ["Leander", "Frisco", "Georgetown", "Round Rock", "Liberty Hill", "Hutto", "Austin"],
          "priceRange": "$$",
          "openingHours": "Mo-Su 08:00-20:00"
        }}
      />
      <Navbar />
      <main>
        <HeroSection />
        <FeaturedProperties />
        <AboutSection />
        <Neighborhoods />
        <Testimonials />
        <ContactSection />
        <MailingList />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
