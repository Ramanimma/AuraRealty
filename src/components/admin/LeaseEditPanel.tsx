import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, X, Loader2 } from "lucide-react";
import type { LeaseReminder } from "@/lib/api";
import { adminApi } from "@/lib/api";

interface Props {
  existingLease?: LeaseReminder | null;
  onClose: () => void;
  onSaved: () => void;
}

const GOLD = "#C07A4A";

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide font-sans block mb-1">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive mt-1 font-sans">{error}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-accent uppercase tracking-widest font-sans pt-2">{children}</p>
  );
}

function PersonBlock({
  prefix,
  label,
  values,
  onChange,
}: {
  prefix: string;
  label: string;
  values: { name: string; phone: string; email: string };
  onChange: (field: string, value: string) => void;
}) {
  const inp = (field: string, placeholder: string, type = "text") => (
    <input
      type={type}
      value={(values as any)[field]}
      onChange={e => onChange(`${prefix}_${field}`, e.target.value)}
      placeholder={placeholder}
      className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground font-sans focus:outline-none focus:ring-1 focus:ring-accent"
      data-testid={`input-${prefix}-${field}`}
    />
  );
  return (
    <div className="border rounded-md p-3 bg-muted/20 space-y-2">
      <p className="text-xs font-medium text-foreground font-sans">{label}</p>
      {inp("name", "Full name")}
      {inp("phone", "Phone number", "tel")}
      {inp("email", "Email address", "email")}
    </div>
  );
}

export default function LeaseEditPanel({ existingLease, onClose, onSaved }: Props) {
  const qc = useQueryClient();
  const isEdit = !!existingLease;
  const e = existingLease;

  const [form, setForm] = useState({
    property_address: e?.property_address ?? "",
    client_type: e?.client_type ?? "",
    lease_status: e?.lease_status ?? "Active",
    owner1_name: e?.owner1_name ?? "",
    owner1_phone: e?.owner1_phone ?? "",
    owner1_email: e?.owner1_email ?? "",
    owner2_name: e?.owner2_name ?? "",
    owner2_phone: e?.owner2_phone ?? "",
    owner2_email: e?.owner2_email ?? "",
    tenant1_name: e?.tenant1_name ?? "",
    tenant1_phone: e?.tenant1_phone ?? "",
    tenant1_email: e?.tenant1_email ?? "",
    tenant2_name: e?.tenant2_name ?? "",
    tenant2_phone: e?.tenant2_phone ?? "",
    tenant2_email: e?.tenant2_email ?? "",
    lease_start_date: e?.lease_start_date ?? "",
    lease_end_date: e?.lease_end_date ?? "",
    notice_reminder_date: e?.notice_reminder_date ?? "",
  });

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const personValues = (prefix: string) => ({
    name: (form as any)[`${prefix}_name`] ?? "",
    phone: (form as any)[`${prefix}_phone`] ?? "",
    email: (form as any)[`${prefix}_email`] ?? "",
  });

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const payload = {
        property_address: form.property_address || null,
        client_type: form.client_type || null,
        lease_status: form.lease_status || "Active",
        owner1_name: form.owner1_name || null,
        owner1_phone: form.owner1_phone || null,
        owner1_email: form.owner1_email || null,
        owner2_name: form.owner2_name || null,
        owner2_phone: form.owner2_phone || null,
        owner2_email: form.owner2_email || null,
        tenant1_name: form.tenant1_name || null,
        tenant1_phone: form.tenant1_phone || null,
        tenant1_email: form.tenant1_email || null,
        tenant2_name: form.tenant2_name || null,
        tenant2_phone: form.tenant2_phone || null,
        tenant2_email: form.tenant2_email || null,
        lease_start_date: form.lease_start_date || null,
        lease_end_date: form.lease_end_date || null,
        notice_reminder_date: form.notice_reminder_date || null,
      };
      if (isEdit) {
        await adminApi.leaseReminders.update(existingLease!.id, payload);
      } else {
        await adminApi.leaseReminders.create(payload);
      }
      qc.invalidateQueries({ queryKey: ["admin-master-clients"] });
      qc.invalidateQueries({ queryKey: ["admin-lease-reminders"] });
      setSuccess(true);
      onSaved();
      setTimeout(onClose, 1200);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const dateInput = (field: string, testId: string) => (
    <input
      type="date"
      value={(form as any)[field]}
      onChange={ev => set(field, ev.target.value)}
      className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground font-sans focus:outline-none focus:ring-1 focus:ring-accent"
      data-testid={testId}
    />
  );

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 hidden md:block" onClick={onClose} />
      <div className="fixed inset-0 z-50 md:inset-y-0 md:right-0 md:left-auto md:w-[450px] bg-card border-l shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <button onClick={onClose} className="md:hidden flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h2 className="font-semibold text-base font-sans flex-1 md:flex-none">
            {isEdit ? "Edit Lease" : "Add New Lease"}
          </h2>
          <button onClick={onClose} className="hidden md:flex items-center justify-center h-7 w-7 rounded hover:bg-muted transition-colors" aria-label="Close">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <SectionTitle>Property</SectionTitle>

          <Field label="Property Address">
            <input
              type="text"
              value={form.property_address}
              onChange={ev => set("property_address", ev.target.value)}
              placeholder="123 Main St, Austin TX 78701"
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground font-sans focus:outline-none focus:ring-1 focus:ring-accent"
              data-testid="input-lease-address"
            />
          </Field>

          <Field label="Client Type">
            <select
              value={form.client_type}
              onChange={ev => set("client_type", ev.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground font-sans focus:outline-none focus:ring-1 focus:ring-accent"
              data-testid="select-lease-client-type"
            >
              <option value="">— Select type —</option>
              <option value="Owner">Owner</option>
              <option value="Tenant">Tenant</option>
              <option value="Both">Both</option>
            </select>
          </Field>

          <Field label="Lease Status">
            <select
              value={form.lease_status}
              onChange={ev => set("lease_status", ev.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground font-sans focus:outline-none focus:ring-1 focus:ring-accent"
              data-testid="select-lease-status"
            >
              <option value="Active">Active</option>
              <option value="Expiring">Expiring</option>
              <option value="Expired">Expired</option>
              <option value="Renewed">Renewed</option>
              <option value="Terminated">Terminated</option>
            </select>
          </Field>

          <SectionTitle>Owners</SectionTitle>

          <PersonBlock
            prefix="owner1"
            label="Owner 1"
            values={personValues("owner1")}
            onChange={set}
          />
          <PersonBlock
            prefix="owner2"
            label="Owner 2 (optional)"
            values={personValues("owner2")}
            onChange={set}
          />

          <SectionTitle>Tenants</SectionTitle>

          <PersonBlock
            prefix="tenant1"
            label="Tenant 1"
            values={personValues("tenant1")}
            onChange={set}
          />
          <PersonBlock
            prefix="tenant2"
            label="Tenant 2 (optional)"
            values={personValues("tenant2")}
            onChange={set}
          />

          <SectionTitle>Lease Dates</SectionTitle>

          <Field label="Lease Start Date">{dateInput("lease_start_date", "input-lease-start")}</Field>
          <Field label="Lease End Date">{dateInput("lease_end_date", "input-lease-end")}</Field>
          <Field label="Notice Reminder Date">{dateInput("notice_reminder_date", "input-lease-notice")}</Field>

          {saveError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2 font-sans">{saveError}</p>
          )}
          {success && (
            <p className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2 font-sans">
              {isEdit ? "Lease updated successfully!" : "Lease added successfully!"}
            </p>
          )}
        </div>

        <div className="px-5 py-4 border-t shrink-0 bg-card flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || success}
            data-testid="button-save-lease"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium font-sans transition-opacity disabled:opacity-60"
            style={{ background: GOLD, color: "#1E2A44" }}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Save Lease"}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 rounded-md text-sm font-medium font-sans border border-border hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
