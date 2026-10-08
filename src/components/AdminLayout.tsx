import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminSidebar from "./AdminSidebar";
import { Menu } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: Props) {
  const { user, isAdmin, loading, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/admin");
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <p className="text-muted-foreground animate-pulse font-sans">Loading…</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin");
  };

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        signOut={handleSignOut}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 h-14 px-4 bg-primary text-primary-foreground shrink-0 border-b border-primary-foreground/10">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            className="p-1"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-serif font-bold text-lg">Admin Panel</span>
        </div>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
