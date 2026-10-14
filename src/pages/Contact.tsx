import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import ContactSection from "@/components/ContactSection";
import PublicPageHeader from "@/components/PublicPageHeader";

const Contact = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Contact | Aura Realty"
        description="Schedule a tour or get in touch with Rama and Agent 2, your Greater Austin real estate team."
        ogUrl="https://aurarealty.com/contact"
      />
      <Navbar />
      <PublicPageHeader eyebrow="Aura Realty" title="Contact Us" subtitle="Get in touch with Rama and Agent 2, your Greater Austin real estate team." />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Contact;
