import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  Users,
  UserCheck,
  Map,
  Star,
  MessageCircle,
  Film,
  Database,
  Mail,
  CalendarDays,
  Sparkles,
  LogOut,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/listings", icon: Building2, label: "Listings" },
  { to: "/admin/inquiries", icon: MessageSquare, label: "Inquiries" },
  { to: "/admin/contacts", icon: Users, label: "Contacts" },
  { to: "/admin/agents", icon: UserCheck, label: "Agents" },
  { to: "/admin/neighborhoods", icon: Map, label: "Neighborhoods" },
  { to: "/admin/reviews", icon: Star, label: "Reviews" },
  { to: "/admin/chat", icon: MessageCircle, label: "Chat" },
  { to: "/admin/hero-videos", icon: Film, label: "Hero Videos" },
  { to: "/admin/client-database", icon: Database, label: "Client Database" },
  { to: "/admin/distribution-emails", icon: Mail, label: "Distribution Emails" },
  { to: "/admin/appointments", icon: CalendarDays, label: "Appointments" },
  { to: "/admin/holidays", icon: Sparkles, label: "Holiday Greetings" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  user: User | null;
  signOut: () => void;
}

export default function AdminSidebar({ open, onClose, user, signOut }: Props) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-primary text-primary-foreground flex flex-col transition-transform duration-300 ${
        open ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-primary-foreground/10 shrink-0">
        <a
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <img
            src="https://xxiwznuuaouwsugtgsut.supabase.co/storage/v1/object/public/agent-photos/LogoWithTransBackgrnd%20(1).png"
            alt="Texas Realty Hub"
            className="h-8 w-8 object-contain"
          />
          <span className="font-serif text-lg font-bold text-primary-foreground leading-tight">
            Texas Realty Hub
          </span>
        </a>
        <button
          onClick={onClose}
          className="lg:hidden p-1 text-primary-foreground/60 hover:text-primary-foreground"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Admin badge */}
      <div className="px-5 py-2.5 border-b border-primary-foreground/10">
        <span className="text-xs font-semibold text-accent uppercase tracking-widest">
          Admin Panel
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-primary-foreground/10 p-4 space-y-2 shrink-0">
        {user?.email && (
          <p className="text-xs text-primary-foreground/40 truncate px-1">{user.email}</p>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          data-testid="button-admin-signout"
          className="w-full justify-start text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
