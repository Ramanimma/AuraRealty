import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, type Agent } from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, X, Shield, Phone, Mail, UserCheck, Upload, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadAgentPhoto } from "@/lib/uploadPhoto";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground font-sans">{label}</label>
      {children}
    </div>
  );
}

export default function AdminAgents() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Agent | null>(null);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadError, setUploadError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadState("uploading");
    setUploadError("");
    try {
      const url = await uploadAgentPhoto(file);
      set("photo_url", url);
      setUploadState("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setUploadError(msg);
      setUploadState("error");
    }
    // Reset file input so the same file can be re-selected if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["/api/admin/agents"],
    queryFn: () => adminApi.agents.list(),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Agent> }) =>
      adminApi.agents.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/agents"] });
      setEditing(null);
      toast.success("Agent updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = (agent: Agent) => {
    updateMut.mutate({ id: agent.id, data: { is_active: !agent.is_active } });
  };

  const set = (k: keyof Agent, v: any) =>
    setEditing((prev) => prev ? { ...prev, [k]: v } : prev);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <h1 className="font-serif text-2xl font-bold text-primary">Agents</h1>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse border border-border/60">
                <CardContent className="pt-6 pb-5 flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-muted" />
                  <div className="h-5 w-32 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground font-sans">No agents found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {agents.map((agent) => (
              <Card
                key={agent.id}
                data-testid={`card-agent-${agent.id}`}
                className={`border shadow-sm ${agent.is_active === false ? "opacity-60" : "border-border/60"}`}
              >
                <CardContent className="pt-6 pb-5 flex flex-col items-center text-center">
                  {agent.photo_url ? (
                    <img
                      src={agent.photo_url}
                      alt={agent.name}
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-accent/20 mb-3"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center ring-4 ring-accent/20 mb-3">
                      <span className="font-serif text-2xl font-bold text-primary-foreground">
                        {getInitials(agent.name)}
                      </span>
                    </div>
                  )}

                  <h3 className="font-serif text-lg font-bold text-primary">{agent.name}</h3>
                  {agent.title && (
                    <p className="text-xs font-semibold text-accent font-sans mt-0.5">{agent.title}</p>
                  )}
                  {(agent.brokerage || agent.brokerage_name) && (
                    <p className="text-xs text-muted-foreground font-sans">{agent.brokerage || agent.brokerage_name}</p>
                  )}

                  <div className="mt-3 space-y-1 text-xs text-muted-foreground font-sans w-full">
                    {agent.license_number && (
                      <p className="flex items-center justify-center gap-1">
                        <Shield className="h-3 w-3 text-accent" />TX #{agent.license_number}
                      </p>
                    )}
                    {agent.phone && (
                      <p className="flex items-center justify-center gap-1">
                        <Phone className="h-3 w-3 text-accent" />{agent.phone}
                      </p>
                    )}
                    {agent.email && (
                      <p className="flex items-center justify-center gap-1 truncate">
                        <Mail className="h-3 w-3 text-accent shrink-0" />{agent.email}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 font-sans text-xs"
                      onClick={() => setEditing({ ...agent })}
                      data-testid={`button-edit-agent-${agent.id}`}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      variant={agent.is_active ? "outline" : "default"}
                      size="sm"
                      className="flex-1 font-sans text-xs"
                      onClick={() => toggleActive(agent)}
                      data-testid={`button-toggle-agent-${agent.id}`}
                    >
                      <UserCheck className="h-3.5 w-3.5 mr-1" />
                      {agent.is_active === false ? "Activate" : "Deactivate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Form Overlay */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-end">
          <div className="w-full max-w-xl h-full bg-background overflow-y-auto shadow-2xl flex flex-col">
            <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-serif text-lg font-bold text-primary">Edit Agent</h2>
              <button onClick={() => { setEditing(null); setUploadState("idle"); setUploadError(""); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 font-sans flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Name *">
                  <Input value={editing.name} onChange={(e) => set("name", e.target.value)} />
                </Field>
                <Field label="Title">
                  <Input value={editing.title ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="Designated Broker" />
                </Field>
                <Field label="Brokerage">
                  <Input value={editing.brokerage ?? ""} onChange={(e) => set("brokerage", e.target.value)} />
                </Field>
                <Field label="License Number">
                  <Input value={editing.license_number ?? ""} onChange={(e) => set("license_number", e.target.value)} />
                </Field>
                <Field label="Phone">
                  <Input value={editing.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
                </Field>
                <Field label="Email">
                  <Input type="email" value={editing.email ?? ""} onChange={(e) => set("email", e.target.value)} />
                </Field>
                <Field label="Photo URL">
                  <Input
                    value={editing.photo_url ?? ""}
                    onChange={(e) => { set("photo_url", e.target.value); setUploadState("idle"); }}
                    placeholder="https://..."
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    data-testid="input-agent-photo-file"
                    onChange={handlePhotoUpload}
                  />
                  <div className="flex items-center gap-2 mt-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2.5 gap-1.5"
                      disabled={uploadState === "uploading"}
                      data-testid="button-upload-agent-photo"
                      onClick={() => { setUploadState("idle"); setUploadError(""); fileInputRef.current?.click(); }}
                    >
                      {uploadState === "uploading" ? (
                        <><Loader2 className="h-3 w-3 animate-spin" />Uploading…</>
                      ) : (
                        <><Upload className="h-3 w-3" />📷 Upload Photo</>
                      )}
                    </Button>
                    {uploadState === "success" && (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle className="h-3 w-3" />Photo uploaded
                      </span>
                    )}
                    {uploadState === "error" && (
                      <span className="text-xs text-destructive">{uploadError}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Or paste a Cloudinary/image URL above</p>
                </Field>
                <Field label="Display Order">
                  <Input
                    type="number"
                    value={editing.display_order ?? ""}
                    onChange={(e) => set("display_order", e.target.value ? Number(e.target.value) : null)}
                  />
                </Field>
              </div>
              <Field label="Bio">
                <Textarea value={editing.bio ?? ""} onChange={(e) => set("bio", e.target.value)} rows={4} placeholder="Agent biography…" />
              </Field>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.is_active !== false}
                    onChange={(e) => set("is_active", e.target.checked)}
                    className="rounded"
                  />
                  Active
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => { setEditing(null); setUploadState("idle"); setUploadError(""); }}>Cancel</Button>
                <Button
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => updateMut.mutate({ id: editing.id, data: editing })}
                  disabled={updateMut.isPending}
                >
                  {updateMut.isPending ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
