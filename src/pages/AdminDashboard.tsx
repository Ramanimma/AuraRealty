import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { adminApi } from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  TrendingUp,
  MessageSquare,
  Zap,
  Users,
  MessageCircle,
  Plus,
} from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  new: "bg-red-100 text-red-700",
  contacted: "bg-yellow-100 text-yellow-700",
  "in-progress": "bg-blue-100 text-blue-700",
  closed: "bg-green-100 text-green-700",
};

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/admin/dashboard-stats"],
    queryFn: () => adminApi.dashboardStats(),
  });

  const statCards = stats
    ? [
        { label: "Total Listings", value: stats.totalListings, icon: Building2, color: "text-blue-600" },
        { label: "Active Listings", value: stats.activeListings, icon: TrendingUp, color: "text-green-600" },
        { label: "Total Inquiries", value: stats.totalInquiries, icon: MessageSquare, color: "text-orange-500" },
        { label: "New This Week", value: stats.newInquiries, icon: Zap, color: "text-red-500" },
        { label: "Total Contacts", value: stats.totalContacts, icon: Users, color: "text-purple-600" },
        { label: "Chat Sessions", value: stats.chatSessions, icon: MessageCircle, color: "text-teal-600" },
      ]
    : [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-primary">Dashboard</h1>
            <p className="text-sm text-muted-foreground font-sans mt-0.5">
              Overview of your site activity
            </p>
          </div>
          <Button
            asChild
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-sans"
            data-testid="button-add-listing"
          >
            <Link to="/admin/listings">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Listing
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse border border-border/60">
                  <CardContent className="pt-5 pb-4">
                    <div className="h-8 w-14 bg-muted rounded mb-2" />
                    <div className="h-3 w-24 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))
            : statCards.map((s) => (
                <Card
                  key={s.label}
                  data-testid={`stat-${s.label.replace(/\s+/g, "-").toLowerCase()}`}
                  className="border border-border/60"
                >
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-serif text-3xl font-bold text-primary">{s.value}</p>
                        <p className="text-xs text-muted-foreground font-sans mt-0.5">{s.label}</p>
                      </div>
                      <s.icon className={`h-5 w-5 mt-1 ${s.color}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* Recent Inquiries */}
        <Card className="border border-border/60">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="font-serif text-base text-primary">Recent Inquiries</CardTitle>
            <Button variant="outline" size="sm" asChild className="font-sans text-xs">
              <Link to="/admin/inquiries">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {!stats?.recentInquiries?.length ? (
              <p className="text-center text-muted-foreground text-sm py-8 font-sans">
                No inquiries yet
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-sans">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      {["Name", "Email", "Type", "Status", "Date"].map((h) => (
                        <th key={h} className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentInquiries.map((inq, i) => (
                      <tr key={inq.id ?? i} className="border-b border-border/30 hover:bg-muted/20">
                        <td className="px-4 py-2.5 font-medium">{inq.name ?? "—"}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{inq.email ?? "—"}</td>
                        <td className="px-4 py-2.5 capitalize">{inq.type ?? "—"}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              STATUS_BADGE[inq.status ?? "new"] ?? "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {inq.status ?? "new"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {inq.created_at ? new Date(inq.created_at).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Chat Sessions */}
        <Card className="border border-border/60">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="font-serif text-base text-primary">Recent Chat Sessions</CardTitle>
            <Button variant="outline" size="sm" asChild className="font-sans text-xs">
              <Link to="/admin/chat">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {!stats?.recentChatSessions?.length ? (
              <p className="text-center text-muted-foreground text-sm py-8 font-sans">
                No chat sessions yet
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-sans">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      {["Visitor", "Page", "Started", "Converted"].map((h) => (
                        <th key={h} className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentChatSessions.map((s, i) => (
                      <tr key={s.id ?? i} className="border-b border-border/30 hover:bg-muted/20">
                        <td className="px-4 py-2.5 font-medium">{s.visitor_name ?? "Anonymous"}</td>
                        <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[180px]">
                          {s.page_url ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {s.started_at ? new Date(s.started_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              s.is_converted
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {s.is_converted ? "Yes" : "No"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="font-sans">
            <Link to="/admin/listings">
              <Building2 className="h-4 w-4 mr-2" />
              Manage Listings
            </Link>
          </Button>
          <Button asChild variant="outline" className="font-sans">
            <Link to="/admin/inquiries">
              <MessageSquare className="h-4 w-4 mr-2" />
              View Inquiries
            </Link>
          </Button>
          <Button asChild variant="outline" className="font-sans">
            <Link to="/admin/contacts">
              <Users className="h-4 w-4 mr-2" />
              View Contacts
            </Link>
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
