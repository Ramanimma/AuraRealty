import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ChatBot from "./components/ChatBot";
import Index from "./pages/Index";
import PropertyDetails from "./pages/PropertyDetails";
import HomeValuation from "./pages/HomeValuation";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ResetPassword from "./pages/ResetPassword";
import MortgageCalculator from "./pages/MortgageCalculator";
import SellersNetsheet from "./pages/SellersNetsheet";
import TitleCalculator from "./pages/TitleCalculator";
import About from "./pages/About";
import Properties from "./pages/Properties";
import NeighborhoodDetail from "./pages/NeighborhoodDetail";
import Contact from "./pages/Contact";
import AdminListings from "./pages/AdminListings";
import AdminInquiries from "./pages/AdminInquiries";
import AdminContacts from "./pages/AdminContacts";
import AdminAgents from "./pages/AdminAgents";
import AdminNeighborhoods from "./pages/AdminNeighborhoods";
import AdminReviews from "./pages/AdminReviews";
import AdminChat from "./pages/AdminChat";
import AdminHeroVideos from "./pages/AdminHeroVideos";
import ClientDatabase from "./pages/admin/ClientDatabase";
import DistributionEmails from "./pages/admin/DistributionEmails";
import Appointments from "./pages/admin/Appointments";
import Holidays from "./pages/admin/Holidays";
import Unsubscribe from "./pages/Unsubscribe";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <ChatBot />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/property/:id" element={<PropertyDetails />} />
          <Route path="/home-valuation" element={<HomeValuation />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/listings" element={<AdminListings />} />
          <Route path="/admin/inquiries" element={<AdminInquiries />} />
          <Route path="/admin/contacts" element={<AdminContacts />} />
          <Route path="/admin/agents" element={<AdminAgents />} />
          <Route path="/admin/neighborhoods" element={<AdminNeighborhoods />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin/chat" element={<AdminChat />} />
          <Route path="/admin/hero-videos" element={<AdminHeroVideos />} />
          <Route path="/admin/client-database" element={<ClientDatabase />} />
          <Route path="/admin/distribution-emails" element={<DistributionEmails />} />
          <Route path="/admin/appointments" element={<Appointments />} />
          <Route path="/admin/holidays" element={<Holidays />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/mortgage-calculator" element={<MortgageCalculator />} />
          <Route path="/sellers-netsheet" element={<SellersNetsheet />} />
          <Route path="/title-calculator" element={<TitleCalculator />} />
          <Route path="/about" element={<About />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/neighborhoods/:slug" element={<NeighborhoodDetail />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
