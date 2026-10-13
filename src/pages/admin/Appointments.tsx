import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type Appointment } from "@/lib/api";
import { CalendarDays, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import AppointmentPanel from "@/components/admin/AppointmentPanel";

type Filter = "today" | "upcoming" | "past" | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "all", label: "All" },
];

const EMPTY_STATES: Record<Filter, string> = {
  today: "No appointments today",
  upcoming: "No upcoming appointments in the next 7 days",
  past: "No past appointments",
  all: "No appointments yet",
};

function statusBadge(status: string) {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-800";
    case "Cancelled":
      return "bg-gray-100 text-gray-600";
    case "No-show":
      return "bg-red-100 text-red-700";
    default:
      return "bg-blue-100 text-blue-800";
  }
}

function fmtDate(d: string) {
  const [y, m, day] = d.split("-");
  return new Date(Number(y), Number(m) - 1, Number(day)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtTime(t: string) {
  const [h, min] = t.split(":");
  const hour = Number(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${min} ${ampm}`;
}

export default function Appointments() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [filter, setFilter] = useState<Filter>("today");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Appointment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["admin-appointments", filter],
    queryFn: () => adminApi.appointments.list(filter),
  });

  const openNew = () => {
    setEditTarget(null);
    setPanelOpen(true);
  };

  const openEdit = (a: Appointment) => {
    setEditTarget(a);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setEditTarget(null);
  };

  const handleDeleted = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.appointments.delete(deleteTarget.id);
      qc.invalidateQueries({ queryKey: ["admin-appointments"] });
      toast({ title: "Appointment deleted" });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-accent" />
              Appointments
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track property showings and client appointments.
            </p>
          </div>
          <Button
            onClick={openNew}
            data-testid="button-new-appointment"
            className="flex items-center gap-2"
            style={{ background: "#C07A4A", color: "#1E2A44" }}
          >
            <Plus className="h-4 w-4" />
            New Appointment
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-muted/40 rounded-lg p-1 w-fit">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              data-testid={`tab-filter-${key}`}
              className={`px-4 py-1.5 rounded-md text-sm font-medium font-sans transition-colors ${
                filter === key
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading…
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <CalendarDays className="h-10 w-10 opacity-30" />
            <p className="text-sm font-sans">{EMPTY_STATES[filter]}</p>
            <Button variant="outline" size="sm" onClick={openNew}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Appointment
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto bg-card">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    Date &amp; Time
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Property
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Client
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    Agent
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr
                    key={a.id}
                    data-testid={`row-appointment-${a.id}`}
                    className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-foreground">{fmtDate(a.appointment_date)}</div>
                      <div className="text-xs text-muted-foreground">{fmtTime(a.appointment_time)}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <span className="text-foreground line-clamp-2">{a.property_address}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{a.client_name}</div>
                      {a.client_phone && (
                        <div className="text-xs text-muted-foreground">{a.client_phone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-foreground">{a.agent}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-foreground">{a.appointment_type}</td>
                    <td className="px-4 py-3">
                      <span
                        data-testid={`badge-status-${a.id}`}
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(a.status)}`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEdit(a)}
                          data-testid={`button-edit-appointment-${a.id}`}
                          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-accent transition-colors"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(a)}
                          data-testid={`button-delete-appointment-${a.id}`}
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

      {/* Slide-in panel */}
      {panelOpen && (
        <AppointmentPanel
          existing={editTarget}
          onClose={closePanel}
          onSaved={() => qc.invalidateQueries({ queryKey: ["admin-appointments"] })}
        />
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent data-testid="dialog-delete-appointment">
          <DialogHeader>
            <DialogTitle>Delete Appointment</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete the appointment for{" "}
            <span className="font-semibold text-foreground">{deleteTarget?.client_name}</span> on{" "}
            {deleteTarget && fmtDate(deleteTarget.appointment_date)}? This cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              data-testid="button-cancel-delete-appointment"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleted}
              disabled={deleting}
              data-testid="button-confirm-delete-appointment"
            >
              {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
