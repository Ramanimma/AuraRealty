import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import ContactSection from "@/components/ContactSection";
import { Mail, MapPin, Phone } from "lucide-react";

const Contact = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Contact | Aura Realty"
        description="Schedule a tour or get in touch with Rama and Agent 2, your Greater Austin real estate team."
        ogUrl="https://aurarealty.com/contact"
      />
      <Navbar />
      <header className="public-page-header">
        <p className="public-page-eyebrow">Aura Realty</p>
        <h1 className="public-page-title">Contact Us</h1>
        <div className="mx-auto my-3 h-px w-10 bg-[#C07A4A]" />
        <p className="public-page-subtitle">Get in touch with Rama and Agent 2, your Greater Austin real estate team.</p>
      </header>
      <ContactSection />
      <div className="mx-auto my-12 grid w-[calc(100%-3rem)] max-w-4xl grid-cols-1 gap-4 rounded-xl border border-[#E9EDF3] bg-[#F7F8FA] p-6 sm:grid-cols-3">
        <div className="flex items-center gap-3 text-sm text-[#1E2A44]">
          <Phone className="h-4 w-4 shrink-0 text-[#A8653A]" /><span>(512) 900-1897</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-[#1E2A44]">
          <Mail className="h-4 w-4 shrink-0 text-[#A8653A]" /><span>agent1@aurarealty.com</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-[#1E2A44]">
          <MapPin className="h-4 w-4 shrink-0 text-[#A8653A]" /><span>Austin, Texas</span>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
