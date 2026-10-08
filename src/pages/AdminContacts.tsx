import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, type Contact, type Agent } from "@/lib/api";
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

const CONTACT_TYPES = ["buyer", "seller", "investor", "renter", "general"];
const CONTACT_STATUSES = ["active", "inactive", "closed"];
const EMPTY: Partial<Contact> = {
  name: "", email: "", phone: "", contact_type: "buyer", status: "active",
  source: "", budget_min: undefined, budget_max: undefined,
  min_beds: undefined, min_baths: undefined, preferred_cities: [], notes: "",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
  closed: "bg-blue-100 text-blue-700",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground font-sans">{label}</label>
      {children}
    </div>
  );
}

export default function AdminContacts() {
  const qc = useQueryClient();
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [form, setForm] = useState<Partial<Contact>>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["/api/admin/contacts"],
    queryFn: () => adminApi.contacts.list(),
  });

  const { data: agents = [] } = useQuery({
    queryKey: ["/api/admin/agents"],
    queryFn: () => adminApi.agents.list(),
  });

  const set = (k: keyof Contact, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const upsert = useMutation({
    mutationFn: async (data: Partial<Contact>) => {
      if (data.id) {
        const { id, created_at, ...rest } = data as Contact;
        await adminApi.contacts.update(id, rest);
      } else {
        await adminApi.contacts.create(data);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/contacts"] });
      setShowForm(false);
      toast.success(form.id ? "Contact updated" : "Contact created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.contacts.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/contacts"] });
      setDeletingId(null);
      toast.success("Contact deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openAdd = () => { setForm(EMPTY); setShowForm(true); };
  const openEdit = (c: Contact) => { setForm({ ...c }); setShowForm(true); };

  const filtered = contacts.filter(
    (c) =>
      (!filterType || c.contact_type === filterType) &&
      (!filterStatus || c.status === filterStatus)
  );

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl font-bold text-primary">Contacts</h1>
          <Button
            onClick={openAdd}
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-sans"
            data-testid="button-add-contact"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add Contact
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 font-sans">
          <span className="text-xs text-muted-foreground self-center">Type:</span>
          <Button variant={!filterType ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setFilterType("")}>All</Button>
          {CONTACT_TYPES.map((t) => (
            <Button key={t} variant={filterType === t ? "default" : "outline"} size="sm" className="h-7 text-xs capitalize" onClick={() => setFilterType(t)}>{t}</Button>
          ))}
          <span className="text-xs text-muted-foreground self-center ml-2">Status:</span>
          <Button variant={!filterStatus ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setFilterStatus("")}>All</Button>
          {CONTACT_STATUSES.map((s) => (
            <Button key={s} variant={filterStatus === s ? "default" : "outline"} size="sm" className="h-7 text-xs capitalize" onClick={() => setFilterStatus(s)}>{s}</Button>
          ))}
        </div>

        <Card className="border border-border/60 overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center text-muted-foreground animate-pulse font-sans">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground font-sans">No contacts found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id} data-testid={`row-contact-${c.id}`}>
                      <TableCell className="font-medium text-sm">{c.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.email}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.phone ?? "—"}</TableCell>
                      <TableCell className="text-sm capitalize">{c.contact_type ?? "—"}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium font-sans ${STATUS_COLORS[c.status ?? "active"] ?? "bg-gray-100 text-gray-700"}`}>
                          {c.status ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground capitalize">{c.source ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {c.budget_min || c.budget_max
                          ? `$${(c.budget_min ?? 0).toLocaleString()} – $${(c.budget_max ?? 0).toLocaleString()}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(c)} data-testid={`button-edit-contact-${c.id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeletingId(c.id)} className="text-destructive hover:text-destructive">
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
          <div className="w-full max-w-2xl h-full bg-background overflow-y-auto shadow-2xl flex flex-col">
            <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-serif text-lg font-bold text-primary">{form.id ? "Edit Contact" : "Add Contact"}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 font-sans flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Name *"><Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} /></Field>
                <Field label="Email *"><Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} /></Field>
                <Field label="Phone"><Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
                <Field label="Source"><Input value={form.source ?? ""} onChange={(e) => set("source", e.target.value)} placeholder="Referral, Website, etc." /></Field>
                <Field label="Contact Type">
                  <select className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background" value={form.contact_type ?? "buyer"} onChange={(e) => set("contact_type", e.target.value)}>
                    {CONTACT_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <select className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background" value={form.status ?? "active"} onChange={(e) => set("status", e.target.value)}>
                    {CONTACT_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Assigned Agent">
                  <select className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background" value={form.assigned_agent_id ?? ""} onChange={(e) => set("assigned_agent_id", e.target.value || null)}>
                    <option value="">— None —</option>
                    {(agents as Agent[]).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Field label="Budget Min ($)"><Input type="number" value={form.budget_min ?? ""} onChange={(e) => set("budget_min", e.target.value ? Number(e.target.value) : null)} /></Field>
                <Field label="Budget Max ($)"><Input type="number" value={form.budget_max ?? ""} onChange={(e) => set("budget_max", e.target.value ? Number(e.target.value) : null)} /></Field>
                <Field label="Min Beds"><Input type="number" value={form.min_beds ?? ""} onChange={(e) => set("min_beds", e.target.value ? Number(e.target.value) : null)} /></Field>
                <Field label="Min Baths"><Input type="number" value={form.min_baths ?? ""} onChange={(e) => set("min_baths", e.target.value ? Number(e.target.value) : null)} /></Field>
              </div>
              <Field label="Preferred Cities (comma-separated)">
                <Input
                  value={(form.preferred_cities ?? []).join(", ")}
                  onChange={(e) => set("preferred_cities", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                  placeholder="Austin, Round Rock, Cedar Park"
                />
              </Field>
              <Field label="Notes"><Textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={3} /></Field>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => upsert.mutate(form)} disabled={upsert.isPending}>
                  {upsert.isPending ? "Saving…" : form.id ? "Save Changes" : "Create Contact"}
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
            <CardHeader><CardTitle className="font-serif text-lg text-primary">Delete Contact?</CardTitle></CardHeader>
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
