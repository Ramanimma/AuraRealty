import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import ContactSection from "@/components/ContactSection";

const Contact = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Contact | Texas Realty Hub"
        description="Schedule a tour or get in touch with Rama and Swetha Nimma, your Greater Austin real estate team."
        ogUrl="https://texasrealtyhub.com/contact"
      />
      <Navbar />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Contact;
