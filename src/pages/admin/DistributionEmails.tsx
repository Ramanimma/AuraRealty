import { useState, useRef, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { adminApi, type EmailCampaign, type EmailCampaignRecipient, type EmailCampaignSearchResult, type MasterClient } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Eye, Send, Mail, Search, Paperclip, Image as ImageIcon } from "lucide-react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Rich Text Editor ──────────────────────────────────────────────────────────

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

function RichTextEditor({
  value,
  onChange,
  allowImageUpload = false,
  onQuillReady,
}: {
  value: string;
  onChange: (v: string) => void;
  allowImageUpload?: boolean;
  onQuillReady?: (quill: Quill | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      const quill = new Quill(editorRef.current, {
        theme: "snow",
        modules: QUILL_MODULES,
      });
      quill.root.innerHTML = value;
      onQuillReady?.(quill);
      quill.on("text-change", () => {
        onChangeRef.current(quill.root.innerHTML);
      });
      quillRef.current = quill;
    }
    return () => {
      onQuillReady?.(null);
      quillRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const quill = quillRef.current;
    if (quill && value !== quill.root.innerHTML) {
      quill.root.innerHTML = value;
    }
  }, [value]);

  const handleImageSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !allowImageUpload) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/upload-campaign-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token || ""}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Image upload failed");

      const quill = quillRef.current;
      if (quill && data.url) {
        const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
        quill.clipboard.dangerouslyPasteHTML(
          range.index,
          `<img src="${data.url}" style="width:552px;max-width:100%;height:auto;display:block;margin:16px 0;border:0;">`,
          "user",
        );
        quill.setSelection(range.index + 1, 0, "silent");
      }
    } catch (err: any) {
      window.alert(err.message || "Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div
      ref={containerRef}
      data-testid="rich-text-editor"
      className="[&_.ql-container]:min-h-[300px] [&_.ql-editor]:min-h-[300px] [&_.ql-container]:rounded-b-md [&_.ql-toolbar]:rounded-t-md [&_.ql-toolbar]:bg-muted/50"
    >
      <style>{`
        .ql-editor {
          font-family: Arial, sans-serif !important;
          font-size: 15px !important;
          color: #374151 !important;
          line-height: 1.7 !important;
        }
      `}</style>
      {allowImageUpload && (
        <div className="flex items-center gap-1 rounded-t-md border border-b-0 bg-muted/50 px-2 py-1">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelected}
          />
          <button
            type="button"
            aria-label="Upload campaign image"
            disabled={uploadingImage}
            onClick={() => imageInputRef.current?.click()}
            className="rounded p-1.5 text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-50"
          >
            {uploadingImage ? (
              <span className="text-xs">Uploading…</span>
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      )}
      <div ref={editorRef} />
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CAMPAIGN_TYPES = [
  { value: "general_update", label: "General Update" },
  { value: "monthly_market_update", label: "Monthly Market Update" },
];

const RECIPIENT_FILTERS = [
  { value: "all", label: "All Clients" },
  { value: "owner", label: "Owners Only" },
  { value: "tenant", label: "Tenants Only" },
  { value: "buyer", label: "Buyers Only" },
  { value: "custom", label: "Custom Selection" },
];

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DistributionEmails() {
  const { toast } = useToast();

  const [campaignType, setCampaignType] = useState("general_update");
  const [campaignTitle, setCampaignTitle] = useState("");
  const [roughNotes, setRoughNotes] = useState("");
  const [marketNotes, setMarketNotes] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const quillRef = useRef<Quill | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [recipientFilter, setRecipientFilter] = useState("all");
  const [customIds, setCustomIds] = useState<string[]>([]);
  const [clientSearch, setClientSearch] = useState("");

  const [generating, setGenerating] = useState(false);
  const [generatingNewsletter, setGeneratingNewsletter] = useState(false);
  const [aiNotConfigured, setAiNotConfigured] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingCampaign, setSendingCampaign] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTestEmailDialog, setShowTestEmailDialog] = useState(false);
  const [showAutomationConfirm, setShowAutomationConfirm] = useState(false);
  const [triggeringAutomation, setTriggeringAutomation] = useState(false);
  const [testRecipientEmail, setTestRecipientEmail] = useState("ramanimma@texasrealtyhub.com");
  const [campaignResult, setCampaignResult] = useState<{
    sentCount: number;
    failedCount: number;
    skippedCount: number;
  } | null>(null);

  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [recipientSearch, setRecipientSearch] = useState("");

  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [historySearchResults, setHistorySearchResults] = useState<EmailCampaignSearchResult[] | null>(null);
  const [historySearchLoading, setHistorySearchLoading] = useState(false);

  const todayIso = new Date().toISOString().slice(0, 10);
  const [birthdayDaysAhead, setBirthdayDaysAhead] = useState(30);
  const [rangeResults, setRangeResults] = useState<MasterClient[] | null>(null);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [todaySelected, setTodaySelected] = useState<Record<string, boolean>>({});
  const [rangeSelected, setRangeSelected] = useState<Record<string, boolean>>({});
  const [sendingBirthdayId, setSendingBirthdayId] = useState<string | null>(null);
  const [sendingAllToday, setSendingAllToday] = useState(false);
  const [sendingAllRange, setSendingAllRange] = useState(false);
  const [birthdaySendResult, setBirthdaySendResult] = useState<{
    scope: "today" | "range";
    sentCount: number;
    failedCount: number;
  } | null>(null);

  // Auto-fill or clear campaign title based on campaign type
  useEffect(() => {
    if (campaignType === "monthly_market_update" && !campaignTitle.trim()) {
      const date = new Date();
      const title = `Austin Market Report — ${date.toLocaleString("en-US", { month: "long" })} ${date.getFullYear()}`;
      setCampaignTitle(title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignType]);

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/admin/master-clients"],
    queryFn: () => adminApi.masterClients.list(),
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ["/api/admin/email-campaigns"],
    queryFn: () => adminApi.emailCampaigns.list(),
  });

  const sortedCampaigns = [...campaigns].sort(
    (a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
  );

  const { data: campaignRecipients = [], isLoading: recipientsLoading } = useQuery({
    queryKey: ["/api/admin/email-campaigns", selectedCampaign?.id, "recipients"],
    queryFn: () => adminApi.emailCampaigns.recipients(selectedCampaign!.id),
    enabled: !!selectedCampaign,
  });

  const filteredRecipients = campaignRecipients.filter((r) => {
    if (!recipientSearch.trim()) return true;
    const q = recipientSearch.trim().toLowerCase();
    return (
      r.client_name.toLowerCase().includes(q) ||
      (r.client_email ?? "").toLowerCase().includes(q)
    );
  });

  const filteredClients = (() => {
    if (recipientFilter === "all") return clients;
    if (recipientFilter === "custom") return clients.filter((c) => customIds.includes(c.id));
    return clients.filter((c) => c.client_role?.toLowerCase() === recipientFilter);
  })();
  const recipientCount = filteredClients.length;

  const {
    data: todaysBirthdays = [],
    isLoading: todaysBirthdaysLoading,
    refetch: refetchTodaysBirthdays,
  } = useQuery({
    queryKey: ["/api/admin/birthday-clients", "today"],
    queryFn: () => adminApi.masterClients.birthdayClients(),
  });

  const effectiveFilter =
    recipientFilter === "custom" ? JSON.stringify(customIds) : recipientFilter;

  const getToken = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || "";
  };

  const triggerAutomationTest = async () => {
    setShowAutomationConfirm(false);
    setTriggeringAutomation(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/trigger-automation-test", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      toast({ title: "Automation triggered successfully", description: data.message });
    } catch (err: any) {
      toast({ title: "Automation failed", description: err.message, variant: "destructive" });
    } finally {
      setTriggeringAutomation(false);
    }
  };

  useEffect(() => {
    if (todaysBirthdays.length > 0) {
      setTodaySelected((prev) => {
        const next = { ...prev };
        for (const c of todaysBirthdays) {
          if (!(c.id in next)) next[c.id] = true;
        }
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todaysBirthdays]);

  useEffect(() => {
    const q = historySearchQuery.trim();
    if (!q) {
      setHistorySearchResults(null);
      return;
    }
    const timeout = setTimeout(async () => {
      setHistorySearchLoading(true);
      try {
        const results = await adminApi.emailCampaigns.search(q);
        setHistorySearchResults(results);
      } catch (err: any) {
        toast({ title: "Search failed", description: err.message, variant: "destructive" });
        setHistorySearchResults([]);
      } finally {
        setHistorySearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [historySearchQuery]);

  const senderBadgeLabel = (senderEmail: string | null | undefined) =>
    senderEmail?.includes("swetha") ? "Swetha" : "Rama";

  const statusBadge = (status: EmailCampaignSearchResult["status"], errorDetail?: string | null) => {
    if (status === "sent") return <span className="text-green-600">✅ Sent</span>;
    if (status === "failed")
      return (
        <div>
          <span className="text-red-600">❌ Failed</span>
          {errorDetail && <p className="text-xs text-muted-foreground mt-0.5">{errorDetail}</p>}
        </div>
      );
    return <span className="text-muted-foreground">⊘ Skipped</span>;
  };

  const formatLocalMmDd = (d: Date): string => {
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${mm}-${dd}`;
  };

  const searchBirthdayRange = async () => {
    setRangeLoading(true);
    setBirthdaySendResult(null);
    try {
      const days = Math.min(365, Math.max(1, birthdayDaysAhead || 1));
      const from = new Date();
      const to = new Date();
      to.setDate(to.getDate() + days);
      const fromMmDd = formatLocalMmDd(from);
      const toMmDd = formatLocalMmDd(to);
      const results = await adminApi.masterClients.birthdayClients({ from: fromMmDd, to: toMmDd });
      setRangeResults(results);
      setRangeSelected(Object.fromEntries(results.map((c) => [c.id, true])));
    } catch (err: any) {
      toast({ title: "Search failed", description: err.message, variant: "destructive" });
    } finally {
      setRangeLoading(false);
    }
  };

  const previewBirthdayEmail = async (clientId: string) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/preview-birthday-email/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const html = await res.text();
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err: any) {
      toast({ title: "Preview failed", description: err.message, variant: "destructive" });
    }
  };

  const sendSingleBirthdayEmail = async (clientId: string) => {
    setSendingBirthdayId(clientId);
    try {
      await adminApi.masterClients.sendBirthdayEmail(clientId);
      toast({ title: "Birthday email sent!" });
    } catch (err: any) {
      toast({ title: "Send failed", description: err.message, variant: "destructive" });
    } finally {
      setSendingBirthdayId(null);
    }
  };

  const sendAllBirthdays = async (scope: "today" | "range") => {
    const list = scope === "today" ? todaysBirthdays : rangeResults ?? [];
    const selected = scope === "today" ? todaySelected : rangeSelected;
    const targets = list.filter((c) => selected[c.id]);
    if (targets.length === 0) {
      toast({ title: "No recipients selected", variant: "destructive" });
      return;
    }

    const setSending = scope === "today" ? setSendingAllToday : setSendingAllRange;
    setSending(true);
    setBirthdaySendResult(null);
    let sentCount = 0;
    let failedCount = 0;

    for (const client of targets) {
      try {
        await adminApi.masterClients.sendBirthdayEmail(client.id);
        sentCount++;
      } catch {
        failedCount++;
      }
    }

    setSending(false);
    setBirthdaySendResult({ scope, sentCount, failedCount });
    toast({
      title: "Birthday emails sent",
      description: `Sent: ${sentCount} · Failed: ${failedCount}`,
    });
  };

  const generateDraft = async () => {
    if (!roughNotes.trim()) {
      toast({ title: "Add some rough notes first", variant: "destructive" });
      return;
    }
    setGenerating(true);
    setAiNotConfigured(false);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/generate-market-update-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ roughNotes }),
      });
      const data = await res.json();
      if (data.error === "AI_NOT_CONFIGURED") {
        setAiNotConfigured(true);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setContentHtml(data.draftHtml);
      toast({ title: "Draft generated!", description: "Review and edit before sending." });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateNewsletter = async () => {
    if (!selectedPdf && !marketNotes.trim()) {
      toast({
        title: "Add market notes or upload a PDF first",
        variant: "destructive",
      });
      return;
    }
    setGeneratingNewsletter(true);
    try {
      const formData = new FormData();
      if (selectedPdf) formData.append("pdf", selectedPdf);
      formData.append("userNotes", marketNotes);
      const token = await getToken();
      const res = await fetch("/api/admin/generate-newsletter-from-pdf", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.newsletterHtml) {
        setContentHtml(data.newsletterHtml);
        // Also set directly on Quill instance to preserve all HTML
        if (quillRef.current) {
          quillRef.current.root.innerHTML = data.newsletterHtml;
        }
        toast({ title: "Newsletter generated! Review and send when ready." });
      } else {
        toast({
          title: data.error || "Generation failed",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Failed to generate newsletter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingNewsletter(false);
    }
  };

  const previewEmail = async () => {
    if (!contentHtml.trim()) {
      toast({ title: "Nothing to preview yet", variant: "destructive" });
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/preview-campaign-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contentHtml }),
      });
      const html = await res.text();
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err: any) {
      toast({ title: "Preview failed", description: err.message, variant: "destructive" });
    }
  };

  const openTestEmailDialog = () => {
    if (!contentHtml.trim()) {
      toast({ title: "Nothing to send yet", variant: "destructive" });
      return;
    }
    setShowTestEmailDialog(true);
  };

  const sendTestEmail = async () => {
    if (!EMAIL_REGEX.test(testRecipientEmail.trim())) {
      toast({ title: "Enter a valid email address", variant: "destructive" });
      return;
    }
    setSendingTest(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/send-test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          contentHtml,
          subjectLine: campaignTitle || "Test Email — Texas Realty Hub",
          testRecipientEmail: testRecipientEmail.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      toast({ title: "Test email sent!", description: `Check ${testRecipientEmail.trim()}` });
      setShowTestEmailDialog(false);
    } catch (err: any) {
      toast({ title: "Send failed", description: err.message, variant: "destructive" });
    } finally {
      setSendingTest(false);
    }
  };

  const sendCampaign = async () => {
    setSendingCampaign(true);
    setShowConfirm(false);
    try {
      const token = await getToken();
      const typeLabel =
        CAMPAIGN_TYPES.find((t) => t.value === campaignType)?.label || campaignType;
      const res = await fetch("/api/admin/send-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          campaignType,
          campaignTitle: campaignTitle || typeLabel,
          recipientFilter: effectiveFilter,
          contentHtml,
          subjectLine: campaignTitle || typeLabel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Campaign send failed");
      setCampaignResult({
        sentCount: data.sentCount,
        failedCount: data.failedCount,
        skippedCount: data.skippedCount,
      });
      toast({
        title: "Campaign sent!",
        description: `Sent: ${data.sentCount} · Failed: ${data.failedCount} · Skipped: ${data.skippedCount}`,
      });
    } catch (err: any) {
      toast({ title: "Campaign failed", description: err.message, variant: "destructive" });
    } finally {
      setSendingCampaign(false);
    }
  };

  const searchedClients = clients.filter(
    (c) =>
      c.full_name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.email_address?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Distribution Emails</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Draft, preview, and send campaigns to your client list.
          </p>
        </div>

        <Tabs defaultValue="campaigns">
          <div className="flex items-center justify-between gap-2">
            <TabsList>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="birthday-wishes">Birthday Wishes</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <Button
              variant="outline"
              size="sm"
              data-testid="button-trigger-automation-test"
              disabled={triggeringAutomation}
              onClick={() => setShowAutomationConfirm(true)}
              className="text-xs text-muted-foreground border-dashed"
            >
              {triggeringAutomation ? "Running…" : "🔧 Test Automation"}
            </Button>
          </div>

          {/* ── Campaigns Tab ─────────────────────────────────────────── */}
          <TabsContent value="campaigns" className="space-y-5 pt-4">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Campaign Type</label>
                <Select value={campaignType} onValueChange={setCampaignType}>
                  <SelectTrigger data-testid="select-campaign-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Campaign Title</label>
                <Input
                  data-testid="input-campaign-title"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  placeholder="e.g. June 2026 Market Update"
                />
              </div>
            </div>

            {campaignType === "monthly_market_update" ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Market Report PDF or Notes</label>
                  <div className="relative">
                    <textarea
                      data-testid="textarea-market-notes"
                      value={marketNotes}
                      onChange={(e) => setMarketNotes(e.target.value)}
                      placeholder="Upload the Austin Market Report PDF below, or type your market notes here..."
                      rows={5}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 pb-10 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y font-sans"
                    />
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        setSelectedPdf(e.target.files?.[0] || null);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      aria-label="Attach market report PDF"
                      onClick={() => pdfInputRef.current?.click()}
                      className="absolute bottom-2 left-2 rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                  </div>
                  {selectedPdf && (
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-input bg-muted/50 px-2.5 py-1 text-sm">
                      <span>📎</span>
                      <span className="max-w-[280px] truncate font-medium">{selectedPdf.name}</span>
                      <button
                        type="button"
                        aria-label="Remove selected PDF"
                        onClick={() => setSelectedPdf(null)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                <Button
                  disabled={(!selectedPdf && !marketNotes.trim()) || generatingNewsletter}
                  onClick={handleGenerateNewsletter}
                  variant="outline"
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {generatingNewsletter ? "Generating newsletter..." : "✨ Generate Newsletter with AI"}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Rough Notes</label>
                  <textarea
                    data-testid="textarea-rough-notes"
                    value={roughNotes}
                    onChange={(e) => setRoughNotes(e.target.value)}
                    placeholder="Enter rough notes, stats, or key points — e.g. median home price up 4%, inventory tight in East Austin, good time for sellers..."
                    rows={5}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y font-sans"
                  />
                </div>

                <Button
                  data-testid="button-generate-draft"
                  onClick={generateDraft}
                  disabled={generating}
                  variant="outline"
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4 text-accent" />
                  {generating ? "Generating…" : "✨ Generate Draft with AI"}
                </Button>

                {aiNotConfigured && (
                  <p
                    data-testid="notice-ai-not-configured"
                    className="text-sm text-muted-foreground bg-muted/50 border border-border rounded-md px-3 py-2"
                  >
                    AI Draft Generation is not configured yet. Please add an Anthropic API key to enable this feature. You can still type or paste content directly into the editor below.
                  </p>
                )}
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email Content</label>
              <RichTextEditor
                value={contentHtml}
                onChange={setContentHtml}
                onQuillReady={(quill) => {
                  quillRef.current = quill;
                }}
                allowImageUpload={campaignType === "general_update"}
              />
              <p className="text-xs text-muted-foreground">
                The branded Texas Realty Hub shell (logo, footer, unsubscribe link) will be added automatically at send time.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                data-testid="button-preview-email"
                variant="outline"
                onClick={previewEmail}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
              <Button
                data-testid="button-send-test-email"
                variant="outline"
                onClick={openTestEmailDialog}
                disabled={sendingTest}
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                {sendingTest ? "Sending…" : "Send Test Email"}
              </Button>
            </div>

            <Dialog open={showTestEmailDialog} onOpenChange={setShowTestEmailDialog}>
              <DialogContent data-testid="dialog-send-test-email">
                <DialogHeader>
                  <DialogTitle>Send Test Email</DialogTitle>
                </DialogHeader>
                <div className="space-y-1.5">
                  <Label htmlFor="test-recipient-email">Send test to:</Label>
                  <Input
                    id="test-recipient-email"
                    data-testid="input-test-recipient-email"
                    type="email"
                    value={testRecipientEmail}
                    onChange={(e) => setTestRecipientEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <DialogFooter>
                  <Button
                    data-testid="button-cancel-test-email"
                    variant="outline"
                    onClick={() => setShowTestEmailDialog(false)}
                    disabled={sendingTest}
                  >
                    Cancel
                  </Button>
                  <Button
                    data-testid="button-confirm-test-email"
                    onClick={sendTestEmail}
                    disabled={sendingTest || !EMAIL_REGEX.test(testRecipientEmail.trim())}
                  >
                    {sendingTest ? "Sending…" : "Send"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* ── Recipient Selector ───────────────────────────────── */}
            <div className="border-t border-border pt-5 space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Recipients</label>
                <Select
                  value={recipientFilter}
                  onValueChange={(v) => {
                    setRecipientFilter(v);
                    setCustomIds([]);
                    setClientSearch("");
                  }}
                >
                  <SelectTrigger data-testid="select-recipient-filter" className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECIPIENT_FILTERS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{recipientCount}</span>{" "}
                  recipient{recipientCount !== 1 ? "s" : ""} will receive this campaign
                </p>
              </div>

              {recipientFilter === "custom" && (
                <div className="rounded-md border border-border p-3 bg-muted/30 space-y-2">
                  <Input
                    data-testid="input-client-search"
                    placeholder="Search by name or email…"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <div className="max-h-52 overflow-y-auto space-y-0.5">
                    {searchedClients.map((c) => (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={customIds.includes(c.id)}
                          onChange={(e) => {
                            if (e.target.checked) setCustomIds((prev) => [...prev, c.id]);
                            else setCustomIds((prev) => prev.filter((id) => id !== c.id));
                          }}
                          className="accent-accent"
                          data-testid={`checkbox-client-${c.id}`}
                        />
                        <span className="flex-1 truncate font-medium">{c.full_name || "—"}</span>
                        <span className="text-muted-foreground text-xs truncate max-w-40">
                          {c.email_address || "no email"}
                        </span>
                      </label>
                    ))}
                    {searchedClients.length === 0 && (
                      <p className="text-xs text-muted-foreground px-2 py-2">No clients found</p>
                    )}
                  </div>
                </div>
              )}

              {campaignResult && (
                <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                  ✅ Campaign sent — Sent:{" "}
                  <strong>{campaignResult.sentCount}</strong> · Failed:{" "}
                  <strong>{campaignResult.failedCount}</strong> · Skipped:{" "}
                  <strong>{campaignResult.skippedCount}</strong>
                </div>
              )}

              {!showConfirm ? (
                <Button
                  data-testid="button-send-campaign"
                  onClick={() => setShowConfirm(true)}
                  disabled={sendingCampaign || recipientCount === 0 || !contentHtml.trim()}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  📤 Send Campaign
                </Button>
              ) : (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                  <p className="text-sm font-medium text-foreground">
                    This will send to{" "}
                    <strong>{recipientCount}</strong>{" "}
                    recipient{recipientCount !== 1 ? "s" : ""}. Are you sure?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      data-testid="button-confirm-send"
                      onClick={sendCampaign}
                      disabled={sendingCampaign}
                      size="sm"
                    >
                      {sendingCampaign ? "Sending…" : "Yes, Send Now"}
                    </Button>
                    <Button
                      data-testid="button-cancel-send"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Birthday Wishes Tab ──────────────────────────────────────── */}
          <TabsContent value="birthday-wishes" className="space-y-8 pt-4">
            {/* ── Upcoming Birthdays Search ─────────────────────────────── */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Search by Date Range</h3>
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Show upcoming birthdays in the next:
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      data-testid="input-birthday-days-ahead"
                      min={1}
                      max={365}
                      step={1}
                      value={birthdayDaysAhead}
                      onChange={(e) => setBirthdayDaysAhead(parseInt(e.target.value, 10) || 0)}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                </div>
                <Button
                  data-testid="button-search-birthdays"
                  onClick={searchBirthdayRange}
                  disabled={rangeLoading}
                >
                  {rangeLoading ? "Searching…" : "Search"}
                </Button>
                {rangeResults !== null && (
                  <span className="text-sm text-muted-foreground" data-testid="text-range-result-count">
                    {rangeResults.length} birthday{rangeResults.length !== 1 ? "s" : ""} found
                  </span>
                )}
              </div>
            </div>

            {birthdaySendResult && (
              <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                ✅ Birthday emails sent — Sent: <strong>{birthdaySendResult.sentCount}</strong> · Failed:{" "}
                <strong>{birthdaySendResult.failedCount}</strong>
              </div>
            )}

            {/* ── Today's Birthdays ─────────────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-foreground">🎂 Today's Birthdays</h3>
                {todaysBirthdays.length > 0 && (
                  <Button
                    data-testid="button-send-all-today"
                    onClick={() => sendAllBirthdays("today")}
                    disabled={sendingAllToday}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {sendingAllToday ? "Sending…" : "🎂 Send All Today's Birthdays"}
                  </Button>
                )}
              </div>

              {todaysBirthdaysLoading ? (
                <div className="text-center py-10 text-muted-foreground">Loading…</div>
              ) : todaysBirthdays.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground border border-border rounded-lg">
                  No birthdays today 🎉
                </div>
              ) : (
                <div className="border border-border rounded-lg divide-y divide-border">
                  {todaysBirthdays.map((c) => (
                    <div
                      key={c.id}
                      data-testid={`row-birthday-today-${c.id}`}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <input
                        type="checkbox"
                        checked={!!todaySelected[c.id]}
                        onChange={(e) =>
                          setTodaySelected((prev) => ({ ...prev, [c.id]: e.target.checked }))
                        }
                        className="accent-accent"
                        data-testid={`checkbox-birthday-today-${c.id}`}
                      />
                      <span className="flex-1 min-w-0 truncate font-medium text-sm">
                        {c.full_name || "—"}
                      </span>
                      <span className="text-muted-foreground text-xs truncate max-w-48 hidden sm:inline">
                        {c.email_address || "no email"}
                      </span>
                      <Badge variant="secondary">{senderBadgeLabel(c.sender_email)}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`button-preview-birthday-today-${c.id}`}
                        onClick={() => previewBirthdayEmail(c.id)}
                      >
                        👁 Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`button-send-birthday-today-${c.id}`}
                        onClick={() => sendSingleBirthdayEmail(c.id)}
                        disabled={sendingBirthdayId === c.id}
                      >
                        {sendingBirthdayId === c.id ? "Sending…" : "📤 Send"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Range Results ─────────────────────────────────────────── */}
            {rangeResults !== null && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-foreground">Upcoming Birthdays</h3>
                  {rangeResults.length > 0 && (
                    <Button
                      data-testid="button-send-all-range"
                      onClick={() => sendAllBirthdays("range")}
                      disabled={sendingAllRange}
                      className="gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {sendingAllRange ? "Sending…" : "Send All Selected"}
                    </Button>
                  )}
                </div>

                {rangeResults.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground border border-border rounded-lg">
                    No birthdays found in this range.
                  </div>
                ) : (
                  <div className="border border-border rounded-lg divide-y divide-border">
                    {rangeResults.map((c) => (
                      <div
                        key={c.id}
                        data-testid={`row-birthday-range-${c.id}`}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <input
                          type="checkbox"
                          checked={!!rangeSelected[c.id]}
                          onChange={(e) =>
                            setRangeSelected((prev) => ({ ...prev, [c.id]: e.target.checked }))
                          }
                          className="accent-accent"
                          data-testid={`checkbox-birthday-range-${c.id}`}
                        />
                        <span className="flex-1 min-w-0 truncate font-medium text-sm">
                          {c.full_name || "—"}
                        </span>
                        <span className="text-muted-foreground text-xs truncate max-w-48 hidden sm:inline">
                          {c.email_address || "no email"}
                        </span>
                        <Badge variant="secondary">{senderBadgeLabel(c.sender_email)}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-preview-birthday-range-${c.id}`}
                          onClick={() => previewBirthdayEmail(c.id)}
                        >
                          👁 Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`button-send-birthday-range-${c.id}`}
                          onClick={() => sendSingleBirthdayEmail(c.id)}
                          disabled={sendingBirthdayId === c.id}
                        >
                          {sendingBirthdayId === c.id ? "Sending…" : "📤 Send"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ── History Tab ───────────────────────────────────────────── */}
          <TabsContent value="history" className="pt-6 space-y-6">
            {/* Client search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-testid="input-history-client-search"
                placeholder="Search by client name, email, or phone..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Search results */}
            {historySearchQuery.trim() ? (
              historySearchLoading ? (
                <div className="text-center py-20 text-muted-foreground">Searching…</div>
              ) : historySearchResults && historySearchResults.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  No emails found for '{historySearchQuery.trim()}'
                </div>
              ) : historySearchResults && historySearchResults.length > 0 ? (
                <div className="space-y-8">
                  <h2 className="text-lg font-semibold text-foreground">Client Communication History</h2>
                  {(() => {
                    const grouped = historySearchResults.reduce(
                      (acc, r) => {
                        const key = r.client_id || r.client_email || r.client_name;
                        if (!acc[key]) {
                          acc[key] = {
                            clientName: r.client_name,
                            clientEmail: r.client_email,
                            emails: [],
                          };
                        }
                        acc[key].emails.push(r);
                        return acc;
                      },
                      {} as Record<
                        string,
                        { clientName: string; clientEmail: string | null; emails: EmailCampaignSearchResult[] }
                      >
                    );
                    return Object.entries(grouped).map(([key, group]) => (
                      <div key={key} className="space-y-3">
                        <div className="border-b border-border pb-2">
                          <h3 className="font-semibold text-foreground">{group.clientName}</h3>
                          <p className="text-sm text-muted-foreground">{group.clientEmail || "—"}</p>
                        </div>
                        <div className="space-y-2">
                          {group.emails.map((email) => (
                            <div
                              key={email.id}
                              data-testid={`row-client-email-${email.id}`}
                              className="flex items-center justify-between gap-2 rounded-md border border-border p-3 text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">{email.campaign_title}</span>
                              </div>
                              <div className="flex items-center gap-4 text-muted-foreground flex-shrink-0">
                                <span>{new Date(email.sent_at).toLocaleString()}</span>
                                <span>{senderBadgeLabel(email.sender_used)}</span>
                                <span>{statusBadge(email.status, email.error_detail)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              ) : null
            ) : (
              <>
                {campaignsLoading ? (
                  <div className="text-center py-20 text-muted-foreground">Loading campaign history…</div>
                ) : sortedCampaigns.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground">
                    <Mail className="h-10 w-10 mx-auto mb-3 opacity-25" />
                    <p className="font-medium text-foreground">No campaigns sent yet.</p>
                    <p className="text-sm mt-1">Create your first campaign in the Compose tab.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedCampaigns.map((campaign) => {
                      const typeLabel =
                        CAMPAIGN_TYPES.find((t) => t.value === campaign.campaign_type)?.label ||
                        campaign.campaign_type;
                      return (
                        <div
                          key={campaign.id}
                          data-testid={`card-campaign-${campaign.id}`}
                          className="rounded-lg border border-border p-4 space-y-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3
                                  className="font-semibold text-foreground"
                                  data-testid={`text-campaign-title-${campaign.id}`}
                                >
                                  {campaign.campaign_title}
                                </h3>
                                <Badge variant="secondary" data-testid={`badge-campaign-type-${campaign.id}`}>
                                  {typeLabel}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {new Date(campaign.sent_at).toLocaleString()}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid={`button-view-details-${campaign.id}`}
                              onClick={() => {
                                setSelectedCampaign(campaign);
                                setRecipientSearch("");
                              }}
                            >
                              View Details
                            </Button>
                          </div>

                          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                            <span className="text-muted-foreground">
                              Recipients:{" "}
                              <span className="font-medium text-foreground">{campaign.total_recipients}</span>
                            </span>
                            <span className="text-green-600 font-medium">
                              ✓ {campaign.sent_count} Sent
                            </span>
                            {campaign.failed_count > 0 && (
                              <span className="text-red-600 font-medium">✗ {campaign.failed_count} Failed</span>
                            )}
                            {campaign.skipped_count > 0 && (
                              <span className="text-muted-foreground font-medium">
                                ⊘ {campaign.skipped_count} Skipped
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            <Dialog
              open={!!selectedCampaign}
              onOpenChange={(open) => {
                if (!open) setSelectedCampaign(null);
              }}
            >
              <DialogContent
                data-testid="dialog-campaign-details"
                className="max-w-3xl max-h-[85vh] overflow-y-auto"
              >
                <DialogHeader>
                  <DialogTitle>{selectedCampaign?.campaign_title}</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                  <Input
                    data-testid="input-recipient-search"
                    placeholder="Search by client name or email…"
                    value={recipientSearch}
                    onChange={(e) => setRecipientSearch(e.target.value)}
                  />

                  {recipientsLoading ? (
                    <div className="text-center py-10 text-muted-foreground">Loading recipients…</div>
                  ) : filteredRecipients.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">No matching recipients found.</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Sender</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Sent At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRecipients.map((r) => (
                          <TableRow key={r.id} data-testid={`row-recipient-${r.id}`}>
                            <TableCell className="font-medium">{r.client_name}</TableCell>
                            <TableCell>{r.client_email || "—"}</TableCell>
                            <TableCell>{r.sender_used || "—"}</TableCell>
                            <TableCell>
                              {r.status === "sent" && (
                                <span className="text-green-600">✅ Sent</span>
                              )}
                              {r.status === "failed" && (
                                <div>
                                  <span className="text-red-600">❌ Failed</span>
                                  {r.error_detail && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{r.error_detail}</p>
                                  )}
                                </div>
                              )}
                              {r.status === "skipped" && (
                                <span className="text-muted-foreground">⊘ Skipped</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {r.sent_at ? new Date(r.sent_at).toLocaleString() : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Test Automation Confirmation Dialog ──────────────────────── */}
      <Dialog open={showAutomationConfirm} onOpenChange={setShowAutomationConfirm}>
        <DialogContent data-testid="dialog-automation-confirm">
          <DialogHeader>
            <DialogTitle>Trigger Automation Test</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will trigger the automation job manually — sending birthday and lease renewal
            emails for today's matches. Proceed?
          </p>
          <DialogFooter>
            <Button
              data-testid="button-cancel-automation-confirm"
              variant="outline"
              onClick={() => setShowAutomationConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              data-testid="button-confirm-automation-trigger"
              onClick={triggerAutomationTest}
            >
              Yes, Run Automation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
