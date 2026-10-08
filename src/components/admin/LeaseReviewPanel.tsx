import { ArrowLeft, X } from "lucide-react";
import type { LeaseReminder } from "@/lib/api";

interface Props {
  lease: LeaseReminder | null;
  onClose: () => void;
}

const fmt = (d: string | null) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide font-sans">{label}</span>
      <span className="text-sm text-foreground font-sans">{value || "—"}</span>
    </div>
  );
}

export default function LeaseReviewPanel({ lease, onClose }: Props) {
  if (!lease) return null;

  const tenants = [
    lease.tenant1_name && { name: lease.tenant1_name, phone: lease.tenant1_phone, email: lease.tenant1_email },
    lease.tenant2_name && { name: lease.tenant2_name, phone: lease.tenant2_phone, email: lease.tenant2_email },
  ].filter(Boolean) as { name: string; phone: string | null; email: string | null }[];

  const owners = [
    lease.owner1_name && { name: lease.owner1_name, phone: lease.owner1_phone, email: lease.owner1_email },
    lease.owner2_name && { name: lease.owner2_name, phone: lease.owner2_phone, email: lease.owner2_email },
  ].filter(Boolean) as { name: string; phone: string | null; email: string | null }[];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 md:block hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-0 z-50 md:inset-y-0 md:right-0 md:left-auto md:w-[450px] bg-card border-l shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          {/* Mobile: back arrow; Desktop: X */}
          <button
            onClick={onClose}
            className="md:hidden flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h2 className="font-semibold text-base font-sans truncate flex-1 md:flex-none">
            {lease.property_address || "Lease Review"}
          </h2>
          <button
            onClick={onClose}
            className="hidden md:flex items-center justify-center h-7 w-7 rounded hover:bg-muted transition-colors"
            aria-label="Close panel"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Property */}
          <div>
            <p className="text-xs font-semibold text-accent uppercase tracking-widest font-sans mb-2">Property</p>
            <Row label="Address" value={lease.property_address} />
            {lease.client_type && <div className="mt-2"><Row label="Client Type" value={lease.client_type} /></div>}
          </div>

          {/* Owners */}
          {owners.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-accent uppercase tracking-widest font-sans mb-2">Owner{owners.length > 1 ? "s" : ""}</p>
              <div className="space-y-4">
                {owners.map((o, i) => (
                  <div key={i} className="space-y-2 border rounded-md p-3 bg-muted/30">
                    <Row label={`Owner ${i + 1}`} value={o.name} />
                    <Row label="Phone" value={o.phone} />
                    <Row label="Email" value={o.email} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tenants */}
          {tenants.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-accent uppercase tracking-widest font-sans mb-2">Tenant{tenants.length > 1 ? "s" : ""}</p>
              <div className="space-y-4">
                {tenants.map((t, i) => (
                  <div key={i} className="space-y-2 border rounded-md p-3 bg-muted/30">
                    <Row label={`Tenant ${i + 1}`} value={t.name} />
                    <Row label="Phone" value={t.phone} />
                    <Row label="Email" value={t.email} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dates */}
          <div>
            <p className="text-xs font-semibold text-accent uppercase tracking-widest font-sans mb-2">Lease Dates</p>
            <div className="space-y-2">
              <Row label="Lease Start" value={fmt(lease.lease_start_date)} />
              <Row label="Lease End" value={fmt(lease.lease_end_date)} />
              <Row label="Notice Reminder Date" value={fmt(lease.notice_reminder_date)} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
