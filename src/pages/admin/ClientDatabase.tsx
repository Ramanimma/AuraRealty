import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type MasterClient, type LeaseReminder } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import LeaseReviewPanel from "@/components/admin/LeaseReviewPanel";
import ClientEditPanel from "@/components/admin/ClientEditPanel";
import LeaseEditPanel from "@/components/admin/LeaseEditPanel";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle2, AlertCircle, X, Users, FileText, Plus, Pencil, Gift, Eye, Loader2, Trash2 } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (d: string | null) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

function getDaysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function statusBadge(days: number | null) {
  if (days === null) return { label: "No date", cls: "bg-gray-100 text-gray-500" };
  if (days === 0) return { label: "Due Today", cls: "bg-[#C9A84C] text-white" };
  if (days < 0) return { label: "Overdue", cls: "bg-red-100 text-red-700" };
  if (days <= 30) return { label: "≤30 days", cls: "bg-orange-100 text-orange-700" };
  if (days <= 60) return { label: "≤60 days", cls: "bg-yellow-100 text-yellow-700" };
  if (days <= 90) return { label: "≤90 days", cls: "bg-green-100 text-green-700" };
  return { label: "Not yet due", cls: "bg-gray-100 text-gray-400" };
}

function leaseStatusBadge(status: string | null) {
  const value = status || "Active";
  switch (value) {
    case "Active": return { label: "Active", cls: "bg-green-100 text-green-700" };
    case "Expiring": return { label: "Expiring", cls: "bg-yellow-100 text-yellow-700" };
    case "Expired": return { label: "Expired", cls: "bg-red-100 text-red-700" };
    case "Renewed": return { label: "Renewed", cls: "bg-blue-100 text-blue-700" };
    case "Terminated": return { label: "Terminated", cls: "bg-gray-100 text-gray-700" };
    default: return { label: value, cls: "bg-gray-100 text-gray-700" };
  }
}

function urgencyMatch(lease: LeaseReminder, toggle: "notice" | "lease-end", filter: string): boolean {
  if (filter === "all") return true;
  const dateStr = toggle === "notice" ? lease.notice_reminder_date : lease.lease_end_date;
  const days = getDaysUntil(dateStr);
  if (filter === "due_today") return days === 0;
  if (filter === "overdue") return days !== null && days < 0;
  if (filter === "30") return days !== null && days >= 0 && days <= 30;
  if (filter === "60") return days !== null && days > 30 && days <= 60;
  if (filter === "90") return days !== null && days > 60 && days <= 90;
  if (filter === "none") return days !== null && days > 90;
  return true;
}

// ─── FilterChip ───────────────────────────────────────────────────────────────

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium font-sans border transition-colors ${
        active
          ? "bg-accent text-accent-foreground border-accent"
          : "bg-background text-muted-foreground border-border hover:border-accent/50 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClientDatabase() {
  const qc = useQueryClient();

  // Tab state
  const [activeTab, setActiveTab] = useState<"master-clients" | "lease-reminders">("master-clients");

  // Master Clients filter state
  const [mcSearch, setMcSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  // Lease Reminders filter state
  const [lrSearch, setLrSearch] = useState("");
  const [dateToggle, setDateToggle] = useState<"notice" | "lease-end">("notice");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [leaseStatusFilter, setLeaseStatusFilter] = useState("all");

  // Review panel
  const [selectedLease, setSelectedLease] = useState<LeaseReminder | null>(null);

  // Edit panels: undefined = closed, null = new, object = edit existing
  const [clientEditTarget, setClientEditTarget] = useState<MasterClient | null | undefined>(undefined);
  const [bdState, setBdState] = useState<Record<string, "idle" | "sending" | "sent" | "error">>({});

  // Delete confirmation state
  const [clientDeleteTarget, setClientDeleteTarget] = useState<MasterClient | null>(null);
  const [leaseDeleteTarget, setLeaseDeleteTarget] = useState<LeaseReminder | null>(null);
  const [isDeletingClient, setIsDeletingClient] = useState(false);
  const [isDeletingLease, setIsDeletingLease] = useState(false);

  const confirmDeleteClient = async () => {
    if (!clientDeleteTarget) return;
    setIsDeletingClient(true);
    try {
      await adminApi.masterClients.delete(clientDeleteTarget.id);
      qc.invalidateQueries({ queryKey: ["admin-master-clients"] });
      setClientDeleteTarget(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete client");
    } finally {
      setIsDeletingClient(false);
    }
  };

  const confirmDeleteLease = async () => {
    if (!leaseDeleteTarget) return;
    setIsDeletingLease(true);
    try {
      await adminApi.leaseReminders.delete(leaseDeleteTarget.id);
      qc.invalidateQueries({ queryKey: ["admin-lease-reminders"] });
      setLeaseDeleteTarget(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete lease");
    } finally {
      setIsDeletingLease(false);
    }
  };

  const previewBirthday = async (c: MasterClient) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    const res = await fetch(`/api/admin/preview-birthday-email/${c.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const html = await res.text();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const sendBirthday = async (c: MasterClient) => {
    setBdState(s => ({ ...s, [c.id]: "sending" }));
    try {
      await adminApi.masterClients.sendBirthdayEmail(c.id);
      setBdState(s => ({ ...s, [c.id]: "sent" }));
      setTimeout(() => setBdState(s => ({ ...s, [c.id]: "idle" })), 4000);
    } catch (err: any) {
      setBdState(s => ({ ...s, [c.id]: "error" }));
      setTimeout(() => setBdState(s => ({ ...s, [c.id]: "idle" })), 4000);
    }
  };
  const [leaseEditTarget, setLeaseEditTarget] = useState<LeaseReminder | null | undefined>(undefined);
  const [renewalSendingId, setRenewalSendingId] = useState<string | null>(null);
  const [renewalConfirmLease, setRenewalConfirmLease] = useState<LeaseReminder | null>(null);
  const [renewalToast, setRenewalToast] = useState<{ id: string; message: string; error: boolean } | null>(null);
  const [previewMenuOpenId, setPreviewMenuOpenId] = useState<string | null>(null);

  const previewRenewal = async (l: LeaseReminder, role: "tenant" | "owner" | "agent" = "tenant") => {
    setPreviewMenuOpenId(null);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    const res = await fetch(`/api/admin/preview-lease-renewal-email/${l.id}?role=${role}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const html = await res.text();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const confirmSendRenewal = async () => {
    const lease = renewalConfirmLease;
    if (!lease) return;
    setRenewalConfirmLease(null);
    setRenewalSendingId(lease.id);
    try {
      const result = await adminApi.leaseReminders.sendRenewalEmail(lease.id);
      setRenewalToast({ id: lease.id, message: `Sent: ${result.sent} · Failed: ${result.failed}`, error: result.failed > 0 && result.sent === 0 });
      qc.invalidateQueries({ queryKey: ["admin-lease-reminders"] });
    } catch (err: any) {
      setRenewalToast({ id: lease.id, message: err.message || "Failed to send renewal emails", error: true });
    } finally {
      setRenewalSendingId(null);
      setTimeout(() => setRenewalToast((t) => (t?.id === lease.id ? null : t)), 5000);
    }
  };

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importConfirmed, setImportConfirmed] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ masterClientsCount: number; leaseRemindersCount: number } | null>(null);
  const [importError, setImportError] = useState("");

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: masterClients = [], isLoading: mcLoading, error: mcError } = useQuery({
    queryKey: ["admin-master-clients"],
    queryFn: () => adminApi.masterClients.list(),
    retry: false,
  });

  const { data: leaseReminders = [], isLoading: lrLoading, error: lrError } = useQuery({
    queryKey: ["admin-lease-reminders"],
    queryFn: () => adminApi.leaseReminders.list(),
    retry: false,
  });

  // ── Filtered lists ────────────────────────────────────────────────────────────

  const filteredClients = masterClients.filter((c: MasterClient) => {
    const q = mcSearch.toLowerCase();
    const matchSearch = !q || [c.full_name, c.phone_number, c.email_address].some(v => v?.toLowerCase().includes(q));
    const matchRole = roleFilter === "All" || c.client_role?.toLowerCase().includes(roleFilter.toLowerCase());
    return matchSearch && matchRole;
  });

  const filteredLeases = leaseReminders.filter((l: LeaseReminder) => {
    const q = lrSearch.toLowerCase();
    const matchSearch = !q || [l.owner1_name, l.owner2_name, l.tenant1_name, l.tenant2_name, l.property_address]
      .some(v => v?.toLowerCase().includes(q));
    const matchUrgency = urgencyMatch(l, dateToggle, urgencyFilter);
    const matchLeaseStatus = leaseStatusFilter === "all" || (l.lease_status || "Active") === leaseStatusFilter;
    return matchSearch && matchUrgency && matchLeaseStatus;
  });

  // ── Import handler ───────────────────────────────────────────────────────────

  const handleImport = async () => {
    if (!importFile || !importConfirmed) return;
    setImportError("");
    setImportResult(null);
    setIsImporting(true);
    setImportProgress(0);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      const result = await new Promise<{ masterClientsCount: number; leaseRemindersCount: number }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const fd = new FormData();
        fd.append("file", importFile);

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) setImportProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener("load", () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status === 200 && data.success) resolve(data);
            else reject(new Error(data.error || `Server error: ${xhr.status}`));
          } catch {
            reject(new Error("Invalid server response"));
          }
        });
        xhr.addEventListener("error", () => reject(new Error("Network error — check your connection")));
        xhr.addEventListener("timeout", () => reject(new Error("Request timed out — try again")));
        xhr.timeout = 120000;
        xhr.open("POST", "/api/admin/import-client-database");
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.send(fd);
      });

      setImportResult(result);
      setImportFile(null);
      setImportConfirmed(false);
      qc.invalidateQueries({ queryKey: ["admin-master-clients"] });
      qc.invalidateQueries({ queryKey: ["admin-lease-reminders"] });
    } catch (err: any) {
      setImportError(err.message);
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const closeImportModal = () => {
    if (isImporting) return;
    setShowImportModal(false);
    setImportFile(null);
    setImportConfirmed(false);
    setImportError("");
    setImportResult(null);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <AdminLayout>
        {/* Page header */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <h1 className="text-xl font-semibold font-sans">Client Database</h1>
          <Button
            onClick={() => setShowImportModal(true)}
            className="gap-2 text-sm"
            data-testid="button-open-import"
          >
            <Upload className="h-4 w-4" />
            + Import / Update Database
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b mb-6">
          {([
            { key: "master-clients", label: "Master Clients", icon: Users, count: masterClients.length },
            { key: "lease-reminders", label: "Lease Reminders", icon: FileText, count: leaseReminders.length },
          ] as const).map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium font-sans border-b-2 transition-colors ${
                activeTab === key
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-sans ${
                activeTab === key ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Master Clients Tab ─────────────────────────────────────────── */}
        {activeTab === "master-clients" && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <Input
                value={mcSearch}
                onChange={e => setMcSearch(e.target.value)}
                placeholder="Search by name, phone, or email…"
                className="max-w-xs text-sm font-sans"
                data-testid="input-mc-search"
              />
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground font-sans shrink-0">
                  {filteredClients.length} client{filteredClients.length !== 1 ? "s" : ""}
                </p>
                <Button
                  size="sm"
                  className="gap-1.5 text-sm"
                  onClick={() => setClientEditTarget(null)}
                  data-testid="button-add-client"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add New Client
                </Button>
              </div>
            </div>

            {/* Role filter chips */}
            <div className="flex gap-2 flex-wrap">
              {["All", "Owner", "Tenant", "Buyer"].map(r => (
                <FilterChip key={r} label={r} active={roleFilter === r} onClick={() => setRoleFilter(r)} />
              ))}
            </div>

            {/* Table */}
            {mcLoading ? (
              <div className="py-12 text-center text-muted-foreground text-sm font-sans animate-pulse">Loading…</div>
            ) : mcError ? (
              <div className="py-12 text-center text-destructive text-sm font-sans">
                Failed to load: {(mcError as Error).message}
              </div>
            ) : (
              <div className="rounded-lg border bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-sans text-xs uppercase tracking-wide">Role</TableHead>
                      <TableHead className="font-sans text-xs uppercase tracking-wide">Full Name</TableHead>
                      <TableHead className="font-sans text-xs uppercase tracking-wide">Phone</TableHead>
                      <TableHead className="font-sans text-xs uppercase tracking-wide">Email</TableHead>
                      <TableHead className="font-sans text-xs uppercase tracking-wide">Birthdate</TableHead>
                      <TableHead className="font-sans text-xs uppercase tracking-wide">Sender</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center text-muted-foreground text-sm font-sans">
                          {masterClients.length === 0
                            ? "No clients yet — import an Excel file to get started."
                            : "No clients match your search."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredClients.map((c: MasterClient) => (
                        <TableRow key={c.id} data-testid={`row-client-${c.id}`}>
                          <TableCell className="font-sans text-sm">
                            {c.client_role ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                {c.client_role}
                              </span>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="font-sans text-sm font-medium">{c.full_name || "—"}</TableCell>
                          <TableCell className="font-sans text-sm text-muted-foreground">{c.phone_number || "—"}</TableCell>
                          <TableCell className="font-sans text-sm text-muted-foreground">{c.email_address || "—"}</TableCell>
                          <TableCell className="font-sans text-sm text-muted-foreground">{fmt(c.birthdate)}</TableCell>
                          <TableCell>
                            {c.sender_email?.includes("swetha") ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 whitespace-nowrap">Swetha</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 whitespace-nowrap">Rama</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {c.greeting_preference === "indian_and_us" ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 whitespace-nowrap">🌏 Indian &amp; US</span>
                            ) : c.greeting_preference === "none" ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 whitespace-nowrap">🔕 No Greetings</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 whitespace-nowrap">🇺🇸 US Only</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setClientEditTarget(c)}
                                data-testid={`button-edit-client-${c.id}`}
                                className="flex items-center gap-1 text-xs font-medium font-sans text-muted-foreground hover:text-accent transition-colors whitespace-nowrap"
                              >
                                <Pencil className="h-3 w-3" />
                                Edit
                              </button>
                              <button
                                onClick={() => previewBirthday(c)}
                                data-testid={`button-preview-birthday-${c.id}`}
                                title="Preview birthday email"
                                className="flex items-center gap-1 text-xs font-medium font-sans text-muted-foreground hover:text-accent transition-colors whitespace-nowrap"
                              >
                                <Eye className="h-3 w-3" />
                                Preview
                              </button>
                              <button
                                onClick={() => sendBirthday(c)}
                                disabled={bdState[c.id] === "sending" || bdState[c.id] === "sent"}
                                data-testid={`button-birthday-${c.id}`}
                                title="Send birthday email"
                                className={`flex items-center gap-1 text-xs font-medium font-sans transition-colors whitespace-nowrap disabled:opacity-50 ${
                                  bdState[c.id] === "sent"
                                    ? "text-green-600"
                                    : bdState[c.id] === "error"
                                    ? "text-destructive"
                                    : "text-muted-foreground hover:text-accent"
                                }`}
                              >
                                {bdState[c.id] === "sending" ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Gift className="h-3 w-3" />
                                )}
                                {bdState[c.id] === "sent" ? "Sent!" : bdState[c.id] === "error" ? "Failed" : "Birthday"}
                              </button>
                              <button
                                onClick={() => setClientDeleteTarget(c)}
                                data-testid={`button-delete-client-${c.id}`}
                                title="Delete client"
                                className="flex items-center gap-1 text-xs font-medium font-sans text-destructive hover:text-destructive/80 transition-colors whitespace-nowrap"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* ── Lease Reminders Tab ────────────────────────────────────────── */}
        {activeTab === "lease-reminders" && (
          <div className="space-y-4">
            {/* Toolbar row 1 */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <Input
                value={lrSearch}
                onChange={e => setLrSearch(e.target.value)}
                placeholder="Search by address or name…"
                className="max-w-xs text-sm font-sans"
                data-testid="input-lr-search"
              />
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground font-sans shrink-0">
                  {filteredLeases.length} active lease{filteredLeases.length !== 1 ? "s" : ""}
                </p>
                <Button
                  size="sm"
                  className="gap-1.5 text-sm"
                  onClick={() => setLeaseEditTarget(null)}
                  data-testid="button-add-lease"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add New Lease
                </Button>
              </div>
            </div>

            {/* Date toggle + filter dropdowns */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              {/* Toggle */}
              <div className="flex items-center gap-1 border rounded-md p-0.5 bg-muted/40 shrink-0">
                {(["notice", "lease-end"] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => { setDateToggle(v); setUrgencyFilter("all"); }}
                    className={`px-3 py-1 rounded text-xs font-medium font-sans transition-colors ${
                      dateToggle === v ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {v === "notice" ? "Notice Date" : "Lease End Date"}
                  </button>
                ))}
              </div>

              {/* Filter dropdowns */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Urgency filter dropdown */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground whitespace-nowrap">Urgency:</label>
                  <select value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)}
                    className="border border-border rounded px-2 py-1.5 text-sm bg-background">
                    <option value="all">All</option>
                    <option value="due_today">Due Today</option>
                    <option value="overdue">Overdue</option>
                    <option value="30">≤30 days</option>
                    <option value="60">≤60 days</option>
                    <option value="90">≤90 days</option>
                    <option value="none">Not yet due</option>
                  </select>
                </div>

                {/* Lease Status filter dropdown */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground whitespace-nowrap">Lease Status:</label>
                  <select value={leaseStatusFilter} onChange={(e) => setLeaseStatusFilter(e.target.value)}
                    className="border border-border rounded px-2 py-1.5 text-sm bg-background">
                    <option value="all">All</option>
                    <option value="Active">Active</option>
                    <option value="Expiring">Expiring</option>
                    <option value="Expired">Expired</option>
                    <option value="Renewed">Renewed</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            {lrLoading ? (
              <div className="py-12 text-center text-muted-foreground text-sm font-sans animate-pulse">Loading…</div>
            ) : lrError ? (
              <div className="py-12 text-center text-destructive text-sm font-sans">
                Failed to load: {(lrError as Error).message}
              </div>
            ) : (
              <div className="rounded-lg border bg-card overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-sans text-xs uppercase tracking-wide min-w-[160px]">Property Address</TableHead>
                      <TableHead className="font-sans text-xs uppercase tracking-wide">Tenant(s)</TableHead>
                      <TableHead className="font-sans text-xs uppercase tracking-wide">Owner(s)</TableHead>
                      <TableHead className="font-sans text-xs uppercase tracking-wide">Lease Start</TableHead>
                      <TableHead className="font-sans text-xs uppercase tracking-wide">Lease End</TableHead>
                      <TableHead className="font-sans text-xs uppercase tracking-wide">Notice Date</TableHead>
                      <TableHead className="font-sans text-xs uppercase tracking-wide">Urgency</TableHead>
                      <TableHead className="font-sans text-xs uppercase tracking-wide">Lease Status</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeases.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="py-12 text-center text-muted-foreground text-sm font-sans">
                          {leaseReminders.length === 0
                            ? "No lease reminders yet — import an Excel file to get started."
                            : "No leases match your current filters."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLeases.map((l: LeaseReminder) => {
                        const triggerDate = dateToggle === "notice" ? l.notice_reminder_date : l.lease_end_date;
                        const days = getDaysUntil(triggerDate);
                        const { label, cls } = statusBadge(days);
                        const tenantNames = [l.tenant1_name, l.tenant2_name].filter(Boolean).join(", ") || "—";
                        const ownerNames = [l.owner1_name, l.owner2_name].filter(Boolean).join(", ") || "—";
                        return (
                          <TableRow key={l.id} data-testid={`row-lease-${l.id}`}>
                            <TableCell className="font-sans text-sm font-medium">{l.property_address || "—"}</TableCell>
                            <TableCell className="font-sans text-sm text-muted-foreground">{tenantNames}</TableCell>
                            <TableCell className="font-sans text-sm text-muted-foreground">{ownerNames}</TableCell>
                            <TableCell className="font-sans text-sm text-muted-foreground whitespace-nowrap">{fmt(l.lease_start_date)}</TableCell>
                            <TableCell className="font-sans text-sm text-muted-foreground whitespace-nowrap">{fmt(l.lease_end_date)}</TableCell>
                            <TableCell className="font-sans text-sm text-muted-foreground whitespace-nowrap">{fmt(l.notice_reminder_date)}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium font-sans ${cls}`}>
                                {label}
                              </span>
                            </TableCell>
                            <TableCell>
                              {(() => {
                                const { label: lsLabel, cls: lsCls } = leaseStatusBadge(l.lease_status);
                                return (
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium font-sans ${lsCls}`}>
                                    {lsLabel}
                                  </span>
                                );
                              })()}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => setSelectedLease(l)}
                                    data-testid={`button-review-${l.id}`}
                                    className="text-xs font-medium font-sans text-accent hover:underline whitespace-nowrap"
                                  >
                                    Review
                                  </button>
                                  <button
                                    onClick={() => setLeaseEditTarget(l)}
                                    data-testid={`button-edit-lease-${l.id}`}
                                    className="flex items-center gap-1 text-xs font-medium font-sans text-muted-foreground hover:text-accent transition-colors whitespace-nowrap"
                                  >
                                    <Pencil className="h-3 w-3" />
                                    Edit
                                  </button>
                                  <div className="relative">
                                    <button
                                      onClick={() => setPreviewMenuOpenId((cur) => (cur === l.id ? null : l.id))}
                                      data-testid={`button-preview-renewal-${l.id}`}
                                      className="flex items-center gap-1 text-xs font-medium font-sans text-muted-foreground hover:text-accent transition-colors whitespace-nowrap"
                                    >
                                      <Eye className="h-3 w-3" />
                                      Preview
                                    </button>
                                    {previewMenuOpenId === l.id && (
                                      <>
                                        <div
                                          className="fixed inset-0 z-10"
                                          onClick={() => setPreviewMenuOpenId(null)}
                                        />
                                        <div className="absolute left-0 top-full mt-1 z-20 bg-card border rounded-md shadow-lg py-1 min-w-[180px]">
                                          <button
                                            onClick={() => previewRenewal(l, "tenant")}
                                            data-testid={`button-preview-tenant-${l.id}`}
                                            className="w-full text-left px-3 py-1.5 text-xs font-sans text-foreground hover:bg-muted transition-colors whitespace-nowrap"
                                          >
                                            👁 Tenant Version
                                          </button>
                                          <button
                                            onClick={() => previewRenewal(l, "owner")}
                                            data-testid={`button-preview-owner-${l.id}`}
                                            className="w-full text-left px-3 py-1.5 text-xs font-sans text-foreground hover:bg-muted transition-colors whitespace-nowrap"
                                          >
                                            👁 Owner Version
                                          </button>
                                          <button
                                            onClick={() => previewRenewal(l, "agent")}
                                            data-testid={`button-preview-agent-${l.id}`}
                                            className="w-full text-left px-3 py-1.5 text-xs font-sans text-foreground hover:bg-muted transition-colors whitespace-nowrap"
                                          >
                                            👁 Agent Notification
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => setRenewalConfirmLease(l)}
                                    disabled={renewalSendingId === l.id}
                                    data-testid={`button-send-renewal-${l.id}`}
                                    className="flex items-center gap-1 text-xs font-medium font-sans text-muted-foreground hover:text-accent transition-colors whitespace-nowrap disabled:opacity-50"
                                  >
                                    {renewalSendingId === l.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <>📧</>
                                    )}
                                    {renewalSendingId === l.id ? "Sending…" : "Send Renewal Email"}
                                  </button>
                                  <button
                                    onClick={() => setLeaseDeleteTarget(l)}
                                    data-testid={`button-delete-lease-${l.id}`}
                                    title="Delete lease"
                                    className="flex items-center gap-1 text-xs font-medium font-sans text-destructive hover:text-destructive/80 transition-colors whitespace-nowrap"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Delete
                                  </button>
                                  {l.renewal_email_sent_at && (
                                    <span
                                      data-testid={`badge-renewal-sent-${l.id}`}
                                      title={`Renewal email sent ${fmt(l.renewal_email_sent_at.slice(0, 10))}`}
                                      className="flex items-center gap-1 text-xs font-medium font-sans text-green-600 whitespace-nowrap"
                                    >
                                      <CheckCircle2 className="h-3 w-3" />
                                      Sent {fmt(l.renewal_email_sent_at.slice(0, 10))}
                                    </span>
                                  )}
                                </div>
                                {renewalToast && renewalToast.id === l.id && (
                                  <span
                                    className={`text-xs font-sans ${renewalToast.error ? "text-destructive" : "text-green-600"}`}
                                    data-testid={`text-renewal-result-${l.id}`}
                                  >
                                    {renewalToast.message}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </AdminLayout>

      {/* ── Review Panel ───────────────────────────────────────────────── */}
      <LeaseReviewPanel lease={selectedLease} onClose={() => setSelectedLease(null)} />

      {/* ── Client Edit Panel ───────────────────────────────────────────── */}
      {clientEditTarget !== undefined && (
        <ClientEditPanel
          existingClient={clientEditTarget}
          onClose={() => setClientEditTarget(undefined)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["admin-master-clients"] })}
        />
      )}

      {/* ── Lease Edit Panel ────────────────────────────────────────────── */}
      {leaseEditTarget !== undefined && (
        <LeaseEditPanel
          existingLease={leaseEditTarget}
          onClose={() => setLeaseEditTarget(undefined)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["admin-lease-reminders"] });
            qc.invalidateQueries({ queryKey: ["admin-master-clients"] });
          }}
        />
      )}

      {/* ── Send Renewal Confirmation Dialog ───────────────────────────────── */}
      {renewalConfirmLease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-lg w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold font-sans">Send Renewal Email?</h2>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
              This will send renewal emails to the tenant, owner, and agent for{" "}
              <strong className="text-foreground">{renewalConfirmLease.property_address || "this property"}</strong>.
              Proceed?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRenewalConfirmLease(null)}
                data-testid="button-cancel-send-renewal"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={confirmSendRenewal}
                data-testid="button-confirm-send-renewal"
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Client Confirmation Dialog ───────────────────────────── */}
      {clientDeleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-lg w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold font-sans">Delete Client?</h2>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
              Are you sure you want to delete {clientDeleteTarget.full_name || "this client"}? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setClientDeleteTarget(null)}
                disabled={isDeletingClient}
                data-testid="button-cancel-delete-client"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={confirmDeleteClient}
                disabled={isDeletingClient}
                data-testid="button-confirm-delete-client"
              >
                {isDeletingClient ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Lease Confirmation Dialog ────────────────────────────── */}
      {leaseDeleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-lg w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold font-sans">Delete Lease?</h2>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
              Are you sure you want to delete the lease for {leaseDeleteTarget.property_address || "this property"}? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLeaseDeleteTarget(null)}
                disabled={isDeletingLease}
                data-testid="button-cancel-delete-lease"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={confirmDeleteLease}
                disabled={isDeletingLease}
                data-testid="button-confirm-delete-lease"
              >
                {isDeletingLease ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Import Modal ───────────────────────────────────────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-base font-semibold font-sans">Import / Update Client Database</h2>
              <button
                onClick={closeImportModal}
                disabled={isImporting}
                className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-5">
              <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                Upload your Client Database Excel file (must contain{" "}
                <strong className="text-foreground">"Master Clients"</strong> and{" "}
                <strong className="text-foreground">"Lease Reminders"</strong> sheets).
                This will <span className="text-destructive font-medium">replace all existing</span> client database records.
              </p>

              {/* File picker */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide font-sans">
                  Excel File (.xlsx)
                </label>
                <input
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  data-testid="input-import-file"
                  onChange={e => {
                    setImportFile(e.target.files?.[0] ?? null);
                    setImportError("");
                    setImportResult(null);
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border file:border-gray-300 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
                />
                {importFile && (
                  <p className="text-xs text-muted-foreground mt-1.5 font-sans">
                    Selected: <span className="font-medium text-foreground">{importFile.name}</span>{" "}
                    ({(importFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              {/* Confirmation checkbox */}
              <label className="flex items-start gap-3 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={importConfirmed}
                  onChange={e => setImportConfirmed(e.target.checked)}
                  data-testid="checkbox-confirm-replace"
                  className="mt-0.5 rounded border-gray-300 accent-yellow-600"
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors font-sans">
                  I understand this will{" "}
                  <strong className="text-foreground">replace all existing records</strong> in the Master Clients and Lease Reminders tables.
                </span>
              </label>

              {/* Progress bar */}
              {isImporting && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600" />
                    <span className="text-xs text-muted-foreground font-sans">
                      {importProgress < 100 ? `Uploading… ${importProgress}%` : "Processing…"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Success */}
              {importResult && (
                <div className="flex items-start gap-3 rounded-md border border-green-200 bg-green-50 p-4">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800 font-sans">Import successful</p>
                    <p className="text-xs text-green-700 mt-0.5 font-sans">
                      Imported <strong>{importResult.masterClientsCount}</strong> master client{importResult.masterClientsCount !== 1 ? "s" : ""} and{" "}
                      <strong>{importResult.leaseRemindersCount}</strong> lease reminder{importResult.leaseRemindersCount !== 1 ? "s" : ""}.
                    </p>
                  </div>
                </div>
              )}

              {/* Error */}
              {importError && (
                <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800 font-sans">Import failed</p>
                    <p className="text-xs text-red-700 mt-0.5 font-sans">{importError}</p>
                  </div>
                </div>
              )}

              {/* SQL hint */}
              <details className="group">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground font-sans">
                  View required Supabase SQL setup ›
                </summary>
                <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap break-all leading-relaxed font-mono bg-muted/40 rounded p-3">{`CREATE TABLE master_clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_role text, full_name text, phone_number text,
  email_address text, birthdate date,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE lease_reminders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_type text, property_address text,
  owner1_name text, owner1_phone text, owner1_email text,
  owner2_name text, owner2_phone text, owner2_email text,
  tenant1_name text, tenant1_phone text, tenant1_email text,
  tenant2_name text, tenant2_phone text, tenant2_email text,
  lease_start_date date, lease_end_date date,
  notice_reminder_date date, last_reminder_sent_at timestamptz,
  reminder_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE master_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE lease_reminders ENABLE ROW LEVEL SECURITY;`}</pre>
              </details>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t flex items-center justify-end gap-3">
              <Button variant="outline" onClick={closeImportModal} disabled={isImporting} className="font-sans">
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={!importFile || !importConfirmed || isImporting}
                data-testid="button-import-submit"
                className="gap-2 font-sans"
              >
                <Upload className="h-4 w-4" />
                {isImporting
                  ? importProgress < 100 ? `Uploading ${importProgress}%…` : "Processing…"
                  : "Import Now"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
