import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, type Neighborhood } from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const EMPTY: Partial<Neighborhood> = {
  name: "", slug: "", city: "", state: "TX", description: "",
  lifestyle: "", avg_price: undefined, highlights: [], image_url: "",
  display_order: 0, is_active: true,
};

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground font-sans">{label}</label>
      {children}
    </div>
  );
}

export default function AdminNeighborhoods() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Partial<Neighborhood>>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newHighlight, setNewHighlight] = useState("");

  const { data: neighborhoods = [], isLoading } = useQuery({
    queryKey: ["/api/admin/neighborhoods"],
    queryFn: () => adminApi.neighborhoods.list(),
  });

  const set = (k: keyof Neighborhood, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const upsert = useMutation({
    mutationFn: async (data: Partial<Neighborhood>) => {
      if (data.id) {
        const { id, created_at, ...rest } = data as Neighborhood;
        await adminApi.neighborhoods.update(id, rest);
      } else {
        await adminApi.neighborhoods.create(data);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/neighborhoods"] });
      setShowForm(false);
      toast.success(form.id ? "Neighborhood updated" : "Neighborhood created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.neighborhoods.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/neighborhoods"] });
      setDeletingId(null);
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openAdd = () => { setForm(EMPTY); setShowForm(true); };
  const openEdit = (n: Neighborhood) => { setForm({ ...n }); setShowForm(true); };

  const addHighlight = () => {
    const val = newHighlight.trim();
    if (!val) return;
    set("highlights", [...(form.highlights ?? []), val]);
    setNewHighlight("");
  };

  const removeHighlight = (i: number) => {
    set("highlights", (form.highlights ?? []).filter((_, idx) => idx !== i));
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl font-bold text-primary">Neighborhoods</h1>
          <Button
            onClick={openAdd}
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-sans"
            data-testid="button-add-neighborhood"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add Neighborhood
          </Button>
        </div>

        <Card className="border border-border/60 overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center text-muted-foreground animate-pulse font-sans">Loading…</div>
          ) : neighborhoods.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground font-sans">No neighborhoods yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Avg Price</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {neighborhoods.map((n) => (
                    <TableRow key={n.id} data-testid={`row-neighborhood-${n.id}`}>
                      <TableCell className="font-medium text-sm">{n.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{n.city ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {n.avg_price || "—"}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium font-sans ${n.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                          {n.is_active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{n.display_order ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(n)} data-testid={`button-edit-neighborhood-${n.id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeletingId(n.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-end">
          <div className="w-full max-w-xl h-full bg-background overflow-y-auto shadow-2xl flex flex-col">
            <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-serif text-lg font-bold text-primary">
                {form.id ? "Edit Neighborhood" : "Add Neighborhood"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 font-sans flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Name *">
                  <Input
                    value={form.name ?? ""}
                    onChange={(e) => {
                      set("name", e.target.value);
                      if (!form.id) set("slug", toSlug(e.target.value));
                    }}
                  />
                </Field>
                <Field label="Slug">
                  <Input value={form.slug ?? ""} onChange={(e) => set("slug", e.target.value)} placeholder="auto-generated" />
                </Field>
                <Field label="City">
                  <Input value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} />
                </Field>
                <Field label="State">
                  <Input value={form.state ?? "TX"} onChange={(e) => set("state", e.target.value)} />
                </Field>
                <Field label="Avg Price ($)">
                  <Input
                    type="number"
                    value={form.avg_price ?? ""}
                    onChange={(e) => set("avg_price", e.target.value ? Number(e.target.value) : null)}
                  />
                </Field>
                <Field label="Display Order">
                  <Input
                    type="number"
                    value={form.display_order ?? 0}
                    onChange={(e) => set("display_order", Number(e.target.value))}
                  />
                </Field>
                <Field label="Image URL">
                  <Input value={form.image_url ?? ""} onChange={(e) => set("image_url", e.target.value)} placeholder="https://..." />
                </Field>
              </div>

              <Field label="Description">
                <Textarea value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} rows={3} />
              </Field>
              <Field label="Lifestyle">
                <Textarea value={form.lifestyle ?? ""} onChange={(e) => set("lifestyle", e.target.value)} rows={2} placeholder="Describe the lifestyle…" />
              </Field>

              {/* Highlights */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Highlights</label>
                <div className="space-y-1.5 mb-2">
                  {(form.highlights ?? []).map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 bg-muted px-3 py-1.5 rounded text-foreground">{h}</span>
                      <button onClick={() => removeHighlight(i)} className="text-destructive hover:text-destructive/80">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newHighlight}
                    onChange={(e) => setNewHighlight(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addHighlight()}
                    placeholder="Add a highlight…"
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={addHighlight}>Add</Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active !== false}
                    onChange={(e) => set("is_active", e.target.checked)}
                    className="rounded"
                  />
                  Active
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => upsert.mutate(form)}
                  disabled={upsert.isPending}
                >
                  {upsert.isPending ? "Saving…" : form.id ? "Save Changes" : "Create"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm border border-border shadow-xl">
            <CardHeader><CardTitle className="font-serif text-lg text-primary">Delete Neighborhood?</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground font-sans">This cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
                <Button variant="destructive" onClick={() => deleteMut.mutate(deletingId!)} disabled={deleteMut.isPending}>
                  {deleteMut.isPending ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
