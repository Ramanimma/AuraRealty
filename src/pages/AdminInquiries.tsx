import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, type Inquiry } from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { X, Trash2, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTIONS = ["new", "contacted", "in-progress", "closed"];
const TYPE_OPTIONS = ["tour", "valuation", "general", "buying", "selling"];

const STATUS_COLORS: Record<string, string> = {
  new: "bg-red-100 text-red-700",
  contacted: "bg-yellow-100 text-yellow-700",
  "in-progress": "bg-blue-100 text-blue-700",
  closed: "bg-green-100 text-green-700",
};

export default function AdminInquiries() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ["/api/admin/inquiries"],
    queryFn: () => adminApi.inquiries.list(),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Inquiry> }) =>
      adminApi.inquiries.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/inquiries"] });
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.inquiries.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/inquiries"] });
      setDeletingId(null);
      if (selected?.id === deletingId) setSelected(null);
      toast.success("Inquiry deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = inquiries.filter(
    (i) =>
      (!filterStatus || i.status === filterStatus) &&
      (!filterType || i.type === filterType),
  );

  const updateStatus = (inq: Inquiry, status: string) => {
    updateMut.mutate({ id: inq.id, data: { status } });
    if (selected?.id === inq.id) setSelected({ ...inq, status });
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <h1 className="font-serif text-2xl font-bold text-primary">
          Inquiries
        </h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 font-sans">
          <span className="text-xs text-muted-foreground self-center">
            Status:
          </span>
          <Button
            variant={!filterStatus ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setFilterStatus("")}
          >
            All
          </Button>
          {STATUS_OPTIONS.map((s) => (
            <Button
              key={s}
              variant={filterStatus === s ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs capitalize"
              onClick={() => setFilterStatus(s)}
            >
              {s}
            </Button>
          ))}
          <span className="text-xs text-muted-foreground self-center ml-2">
            Type:
          </span>
          <Button
            variant={!filterType ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setFilterType("")}
          >
            All
          </Button>
          {TYPE_OPTIONS.map((t) => (
            <Button
              key={t}
              variant={filterType === t ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs capitalize"
              onClick={() => setFilterType(t)}
            >
              {t}
            </Button>
          ))}
        </div>

        <div className="flex gap-5 items-start">
          {/* Table */}
          <Card
            className={`border border-border/60 flex-1 overflow-hidden ${selected ? "hidden sm:block" : ""}`}
          >
            {isLoading ? (
              <div className="p-10 text-center text-muted-foreground animate-pulse font-sans">
                Loading…
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground font-sans">
                No inquiries found.
              </div>
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
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((inq) => (
                      <TableRow
                        key={inq.id}
                        className={`cursor-pointer hover:bg-muted/30 ${selected?.id === inq.id ? "bg-muted/40" : ""}`}
                        onClick={() => setSelected(inq)}
                        data-testid={`row-inquiry-${inq.id}`}
                      >
                        <TableCell className="font-medium text-sm">
                          {inq.full_name || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {inq.email}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {inq.phone ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm capitalize">
                          {inq.type ?? "—"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium font-sans ${
                              STATUS_COLORS[inq.status ?? "new"] ??
                              "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {inq.status ?? "new"}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {inq.created_at
                            ? new Date(inq.created_at).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingId(inq.id);
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>

          {/* Detail Panel */}
          {selected && (
            <Card className="border border-border/60 w-full sm:w-80 shrink-0">
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <CardTitle className="font-serif text-base text-primary">
                  Detail
                </CardTitle>
                <button
                  onClick={() => setSelected(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4 font-sans text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Name</p>
                  <p className="font-semibold text-primary">
                    {selected.full_name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                  <a
                    href={`mailto:${selected.email}`}
                    className="flex items-center gap-1.5 text-accent hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {selected.email}
                  </a>
                </div>
                {selected.phone && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Phone
                    </p>
                    <a
                      href={`tel:${selected.phone}`}
                      className="flex items-center gap-1.5 text-accent hover:underline"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {selected.phone}
                    </a>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Type</p>
                  <p className="capitalize">{selected.type ?? "—"}</p>
                </div>
                {selected.message && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Message
                    </p>
                    <p className="text-muted-foreground leading-relaxed text-xs">
                      {selected.message}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Update Status
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(selected, s)}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize transition-colors ${
                          selected.status === s
                            ? STATUS_COLORS[s]
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full font-sans"
                  onClick={() => setDeletingId(selected.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete Inquiry
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirm */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm border border-border shadow-xl">
            <CardHeader>
              <CardTitle className="font-serif text-lg text-primary">
                Delete Inquiry?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground font-sans">
                This cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDeletingId(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteMut.mutate(deletingId!)}
                  disabled={deleteMut.isPending}
                >
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
