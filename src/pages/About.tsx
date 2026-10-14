import { useQuery } from "@tanstack/react-query";
import { Phone, Mail, Shield, MapPin, Heart, BookOpen, Trophy } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MailingList from "@/components/MailingList";
import { api, type Agent } from "@/lib/api";

const stats = [
  { value: "15+", label: "Years Experience" },
  { value: "500+", label: "Homes Sold" },
  { value: "$2B+", label: "in Sales" },
  { value: "5-Star", label: "Rated" },
];

const features = [
  {
    icon: MapPin,
    title: "Local Expertise",
    description:
      "Deep roots in the Austin market with neighborhood-level knowledge across Dallas, Fort Worth, and surrounding communities.",
  },
  {
    icon: Heart,
    title: "Personalized Service",
    description:
      "Every client gets a dedicated strategy built around their unique goals, timeline, and budget.",
  },
  {
    icon: BookOpen,
    title: "Market Knowledge",
    description:
      "We track DFW real estate data daily to give you an edge whether you're buying, selling, or investing.",
  },
  {
    icon: Trophy,
    title: "Proven Results",
    description:
      "Hundreds of successful closings and a referral rate that speaks louder than any advertisement.",
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function AgentCard({ agent }: { agent: Agent }) {
  return (
    <Card
      data-testid={`card-agent-${agent.id}`}
      className="border border-border/60 shadow-sm overflow-hidden"
    >
      <CardContent className="p-0 flex flex-col">
        {/* Photo */}
        <div className="flex justify-center pt-8 pb-4">
          {agent.photo_url ? (
            <img
              src={agent.photo_url}
              alt={agent.name}
              data-testid={`img-agent-${agent.id}`}
              className="w-32 h-32 rounded-full object-cover shadow-md ring-4 ring-accent/20"
            />
          ) : (
            <div
              data-testid={`initials-agent-${agent.id}`}
              className="w-32 h-32 rounded-full bg-primary flex items-center justify-center shadow-md ring-4 ring-accent/20"
            >
              <span className="font-serif text-3xl font-bold text-primary-foreground">
                {getInitials(agent.name)}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-6 pb-8 flex flex-col items-center text-center flex-1">
          <h2 className="font-serif text-2xl font-bold text-primary mb-0.5">
            {agent.name}
          </h2>
          {(agent.title || agent.brokerage || agent.brokerage_name) && (
            <p className="font-sans text-sm font-semibold text-accent mb-1">
              {[agent.title, agent.brokerage || agent.brokerage_name].filter(Boolean).join(" · ")}
            </p>
          )}
          {agent.license_number && (
            <p className="font-sans text-xs text-muted-foreground flex items-center gap-1.5 mb-4">
              <Shield className="h-3.5 w-3.5 text-accent" />
              TX License #{agent.license_number}
            </p>
          )}

          {/* Contact */}
          <div className="flex flex-col gap-1.5 text-sm font-sans text-muted-foreground mb-5 w-full items-center">
            {agent.phone && (
              <a
                href={`tel:${agent.phone.replace(/\D/g, "")}`}
                data-testid={`link-phone-${agent.id}`}
                className="flex items-center gap-2 hover:text-accent transition-colors"
              >
                <Phone className="h-3.5 w-3.5 text-accent" />
                {agent.phone}
              </a>
            )}
            {agent.email && (
              <a
                href={`mailto:${agent.email}`}
                data-testid={`link-email-${agent.id}`}
                className="flex items-center gap-2 hover:text-accent transition-colors"
              >
                <Mail className="h-3.5 w-3.5 text-accent" />
                {agent.email}
              </a>
            )}
          </div>

          {/* Bio */}
          {agent.bio && (
            <p className="font-sans text-sm text-foreground/75 leading-relaxed mb-6">
              {agent.bio}
            </p>
          )}

          <Button
            asChild
            variant="publicPrimary"
            className="font-sans font-semibold mt-auto"
            data-testid={`button-schedule-${agent.id}`}
          >
            <a href="/#contact">Schedule a Consultation</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AgentCardSkeleton() {
  return (
    <Card className="border border-border/60 overflow-hidden animate-pulse">
      <CardContent className="p-0 flex flex-col items-center pt-8 pb-8 px-6 gap-3">
        <div className="w-32 h-32 rounded-full bg-muted" />
        <div className="h-6 w-40 bg-muted rounded" />
        <div className="h-4 w-28 bg-muted rounded" />
        <div className="h-3 w-36 bg-muted rounded" />
        <div className="h-3 w-32 bg-muted rounded" />
        <div className="h-16 w-full bg-muted rounded mt-2" />
        <div className="h-9 w-44 bg-muted rounded mt-2" />
      </CardContent>
    </Card>
  );
}

export default function About() {
  const { data: agents, isLoading, isError } = useQuery({
    queryKey: ["/api/agents"],
    queryFn: () => api.agents.list(),
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Meet Our Agents | Aura Realty"
        description="Meet our licensed real estate agents serving the Dallas-Fort Worth metroplex and surrounding areas."
        keywords="Aura Realty agents, DFW realtor, Dallas real estate, Fort Worth homes"
        ogUrl="https://aurarealty.com/about"
      />
      <Navbar />

      {/* ── Hero ── */}
      <section className="bg-primary text-primary-foreground pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <p className="font-sans text-sm font-semibold text-accent uppercase tracking-widest mb-3">
            Our Team
          </p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-5">
            Meet Your DFW Real Estate Team
          </h1>
          <p className="font-sans text-primary-foreground/75 text-lg md:text-xl leading-relaxed">
            Trusted advisors guiding families, investors, and first-time buyers
            through every step of the journey.
          </p>
        </div>
      </section>

      {/* ── Agent Cards ── */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <AgentCardSkeleton />
              <AgentCardSkeleton />
            </div>
          )}

          {isError && (
            <p className="text-center text-muted-foreground font-sans py-12">
              Unable to load agent information. Please try again later.
            </p>
          )}

          {agents && agents.length === 0 && (
            <p className="text-center text-muted-foreground font-sans py-12">
              No agents found.
            </p>
          )}

          {agents && agents.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </div>
      </section>


      {/* ── Why Work With Us ── */}
      <section className="py-20 px-6 bg-muted/40">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="font-sans text-sm font-semibold text-accent uppercase tracking-widest mb-2">
              Our Difference
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary">
              Why Work With Us
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((f) => (
              <Card
                key={f.title}
                data-testid={`card-feature-${f.title.replace(/\s+/g, "-").toLowerCase()}`}
                className="border border-border/60 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="pt-6 pb-6 flex gap-4">
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center">
                    <f.icon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-primary mb-1">
                      {f.title}
                    </h3>
                    <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                      {f.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-primary text-primary-foreground py-20 px-6">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Ready to Find Your Dream Home?
          </h2>
          <p className="font-sans text-primary-foreground/75 mb-8 text-lg">
            Let's start the conversation. Our team is ready to help you buy,
            sell, or invest in DFW real estate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              variant="publicPrimary"
              className="font-sans font-semibold px-8 py-3 text-base"
            >
              <a href="/#properties" data-testid="button-view-properties">
                View Properties
              </a>
            </Button>
            <Button
              asChild
              variant="publicSecondary"
              className="font-sans font-semibold px-8 py-3 text-base"
            >
              <a href="/#contact" data-testid="button-contact-us">
                Contact Us
              </a>
            </Button>
          </div>
        </div>
      </section>

      <MailingList />
      <Footer />
    </div>
  );
}
