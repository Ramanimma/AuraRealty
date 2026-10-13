import { useRef, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type Holiday } from "@/lib/api";
import { Sparkles, Plus, Pencil, Trash2, Eye, Send, Loader2, Paperclip } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import HolidayPanel from "@/components/admin/HolidayPanel";

function fmtDate(d: string) {
  const [y, m, day] = d.split("-");
  return new Date(Number(y), Number(m) - 1, Number(day)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Holidays() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [panelOpen, setPanelOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Holiday | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [previewTarget, setPreviewTarget] = useState<Holiday | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewCount, setPreviewCount] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [sendTarget, setSendTarget] = useState<Holiday | null>(null);
  const [sendLoading, setSendLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingUpload, setPendingUpload] = useState<Holiday | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: holidays = [], isLoading } = useQuery<Holiday[]>({
    queryKey: ["admin-holidays"],
    queryFn: () => adminApi.holidays.list(),
  });

  const openNew = () => {
    setEditTarget(null);
    setPanelOpen(true);
  };

  const openEdit = (h: Holiday) => {
    setEditTarget(h);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setEditTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.holidays.delete(deleteTarget.id);
      qc.invalidateQueries({ queryKey: ["admin-holidays"] });
      toast({ title: "Holiday deleted" });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const openPreview = async (h: Holiday) => {
    setPreviewTarget(h);
    setPreviewLoading(true);
    try {
      const result = await adminApi.holidays.preview(h.id, h.type);
      setPreviewHtml(result.html);
      setPreviewSubject(result.subject);
      setPreviewCount(result.recipientCount);
    } catch (err: any) {
      toast({ title: "Preview failed", description: err.message, variant: "destructive" });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSend = async () => {
    if (!sendTarget) return;
    setSendLoading(true);
    try {
      const result = await adminApi.holidays.sendGreeting(sendTarget.id);
      qc.invalidateQueries({ queryKey: ["admin-holidays"] });
      toast({
        title: `Sent ${sendTarget.name} greetings`,
        description: `${result.sent} sent, ${result.failed} failed, ${result.skipped} skipped`,
      });
    } catch (err: any) {
      toast({ title: "Send failed", description: err.message, variant: "destructive" });
    } finally {
      setSendLoading(false);
      setSendTarget(null);
    }
  };

  const handleFlyerUpload = async (h: Holiday, file: File) => {
    setUploadingId(h.id);
    setUploadProgress(0);
    try {
      const result = await adminApi.holidays.uploadFlyer(h.id, file, setUploadProgress);
      qc.invalidateQueries({ queryKey: ["admin-holidays"] });
      toast({ title: "Flyer uploaded", description: result.url });
    } catch (err: any) {
      toast({ title: "Flyer upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingId(null);
      setUploadProgress(0);
      setPendingUpload(null);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-accent" />
              Holiday Greetings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage holidays and send greeting emails to clients.
            </p>
          </div>
          <Button
            onClick={openNew}
            data-testid="button-new-holiday"
            className="flex items-center gap-2"
            style={{ background: "#C07A4A", color: "#1E2A44" }}
          >
            <Plus className="h-4 w-4" />
            Add Holiday
          </Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading…
          </div>
        ) : holidays.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <Sparkles className="h-10 w-10 opacity-30" />
            <p className="text-sm font-sans">No holidays added yet. Click + Add Holiday to get started.</p>
            <Button variant="outline" size="sm" onClick={openNew}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Holiday
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto bg-card">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Year</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sent</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Flyer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {holidays.map((h) => (
                  <tr
                    key={h.id}
                    data-testid={`row-holiday-${h.id}`}
                    className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{h.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {h.type === "us" ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 whitespace-nowrap">🇺🇸 US</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 whitespace-nowrap">🌏 Indian</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{fmtDate(h.holiday_date)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{h.year}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          h.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {h.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {h.greeting_email_sent_at ? (
                        <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                          ✓ Sent {fmtDate(h.greeting_email_sent_at.split("T")[0])}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not sent yet</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {h.flyer_url ? (
                          <img
                            src={h.flyer_url}
                            alt={`${h.name} flyer`}
                            className="h-10 w-15 object-cover rounded border border-border"
                            style={{ width: 60, height: 40 }}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">No flyer</span>
                        )}
                        {uploadingId === h.id ? (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {uploadProgress}%
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setPendingUpload(h);
                              fileInputRef.current?.click();
                            }}
                            data-testid={`button-upload-flyer-${h.id}`}
                            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-accent transition-colors"
                            title="Upload flyer"
                          >
                            <Paperclip className="h-3 w-3" />
                            Upload
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openPreview(h)}
                          data-testid={`button-preview-holiday-${h.id}`}
                          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-accent transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          Preview
                        </button>
                        <button
                          onClick={() => setSendTarget(h)}
                          data-testid={`button-send-holiday-${h.id}`}
                          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-accent transition-colors"
                        >
                          <Send className="h-3 w-3" />
                          Send Now
                        </button>
                        <button
                          onClick={() => openEdit(h)}
                          data-testid={`button-edit-holiday-${h.id}`}
                          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-accent transition-colors"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(h)}
                          data-testid={`button-delete-holiday-${h.id}`}
                          className="flex items-center gap-1 text-xs font-medium text-destructive hover:text-destructive/80 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Hidden file input for flyer uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && pendingUpload) handleFlyerUpload(pendingUpload, file);
          e.target.value = "";
        }}
      />

      {/* Slide-in panel */}
      {panelOpen && (
        <HolidayPanel
          existing={editTarget}
          onClose={closePanel}
          onSaved={() => qc.invalidateQueries({ queryKey: ["admin-holidays"] })}
        />
      )}

      {/* Preview dialog */}
      <Dialog open={!!previewTarget} onOpenChange={(o) => { if (!o) { setPreviewTarget(null); setPreviewHtml(""); } }}>
        <DialogContent data-testid="dialog-preview-holiday" className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {previewTarget ? `Preview: ${previewTarget.name}` : "Preview"}
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground mb-2">
            {previewSubject}
            {previewCount > 0 && <span className="ml-3 text-foreground font-medium">({previewCount} recipients)</span>}
          </div>
          <div className="flex-1 overflow-y-auto border rounded-md bg-white">
            {previewLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading preview…
              </div>
            ) : (
              <iframe
                srcDoc={previewHtml}
                className="w-full min-h-[400px] border-0"
                title="Holiday Greeting Preview"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPreviewTarget(null); setPreviewHtml(""); }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send confirmation dialog */}
      <Dialog open={!!sendTarget} onOpenChange={(o) => !o && setSendTarget(null)}>
        <DialogContent data-testid="dialog-send-holiday">
          <DialogHeader>
            <DialogTitle>Send Holiday Greeting</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Send greeting emails for{" "}
            <span className="font-semibold text-foreground">{sendTarget?.name}</span>? This will
            email all eligible clients based on their greeting preference.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendTarget(null)} disabled={sendLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sendLoading}
              style={{ background: "#C07A4A", color: "#1E2A44" }}
            >
              {sendLoading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              {sendLoading ? "Sending…" : "Send Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent data-testid="dialog-delete-holiday">
          <DialogHeader>
            <DialogTitle>Delete Holiday</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete <span className="font-semibold text-foreground">{deleteTarget?.name}</span>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
