import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, X, Loader2 } from "lucide-react";
import type { MasterClient } from "@/lib/api";
import { adminApi } from "@/lib/api";

interface Props {
  existingClient?: MasterClient | null;
  onClose: () => void;
  onSaved: () => void;
}

const GOLD = "#C9A84C";

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

export default function ClientEditPanel({ existingClient, onClose, onSaved }: Props) {
  const qc = useQueryClient();
  const isEdit = !!existingClient;

  const [form, setForm] = useState({
    client_role: existingClient?.client_role ?? "",
    full_name: existingClient?.full_name ?? "",
    phone_number: existingClient?.phone_number ?? "",
    email_address: existingClient?.email_address ?? "",
    birthdate: existingClient?.birthdate ?? "",
    sender_email: existingClient?.sender_email ?? "ramanimma@texasrealtyhub.com",
    greeting_preference: existingClient?.greeting_preference ?? "us_only",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = "Full name is required";
    if (!form.email_address.trim()) e.email_address = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_address.trim())) e.email_address = "Invalid email address";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setSaveError("");
    try {
      const payload = {
        client_role: form.client_role || null,
        full_name: form.full_name.trim(),
        phone_number: form.phone_number.trim(),
        email_address: form.email_address.trim(),
        birthdate: form.birthdate || null,
        sender_email: form.sender_email,
        greeting_preference: form.greeting_preference,
      };
      if (isEdit) {
        await adminApi.masterClients.update(existingClient!.id, payload);
      } else {
        await adminApi.masterClients.create(payload);
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

  const inputCls = (field: string) =>
    `w-full border rounded-md px-3 py-2 text-sm bg-background text-foreground font-sans focus:outline-none focus:ring-1 focus:ring-accent ${errors[field] ? "border-destructive" : "border-border"}`;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 hidden md:block" onClick={onClose} />
      <div className="fixed inset-0 z-50 md:inset-y-0 md:right-0 md:left-auto md:w-[450px] bg-card border-l shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <button onClick={onClose} className="md:hidden flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h2 className="font-semibold text-base font-sans flex-1 md:flex-none">
            {isEdit ? "Edit Client" : "Add New Client"}
          </h2>
          <button onClick={onClose} className="hidden md:flex items-center justify-center h-7 w-7 rounded hover:bg-muted transition-colors" aria-label="Close">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <Field label="Client Role / Type">
            <select
              value={form.client_role}
              onChange={e => set("client_role", e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground font-sans focus:outline-none focus:ring-1 focus:ring-accent"
              data-testid="select-client-role"
            >
              <option value="">— Select role —</option>
              <option value="Owner">Owner</option>
              <option value="Tenant">Tenant</option>
              <option value="Buyer">Buyer</option>
            </select>
          </Field>

          <Field label="Full Name" required error={errors.full_name}>
            <input
              type="text"
              value={form.full_name}
              onChange={e => set("full_name", e.target.value)}
              placeholder="John Smith"
              className={inputCls("full_name")}
              data-testid="input-client-name"
            />
          </Field>

          <Field label="Phone Number" error={errors.phone_number}>
            <input
              type="tel"
              value={form.phone_number}
              onChange={e => set("phone_number", e.target.value)}
              placeholder="(512) 555-0100"
              className={inputCls("phone_number")}
              data-testid="input-client-phone"
            />
          </Field>

          <Field label="Email Address" required error={errors.email_address}>
            <input
              type="email"
              value={form.email_address}
              onChange={e => set("email_address", e.target.value)}
              placeholder="john@example.com"
              className={inputCls("email_address")}
              data-testid="input-client-email"
            />
          </Field>

          <Field label="Birthdate">
            <input
              type="date"
              value={form.birthdate}
              onChange={e => set("birthdate", e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground font-sans focus:outline-none focus:ring-1 focus:ring-accent"
              data-testid="input-client-birthdate"
            />
          </Field>

          <Field label="Sender Email">
            <select
              value={form.sender_email}
              onChange={e => set("sender_email", e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground font-sans focus:outline-none focus:ring-1 focus:ring-accent"
              data-testid="select-sender-email"
            >
              <option value="ramanimma@texasrealtyhub.com">Rama Nimma (ramanimma@texasrealtyhub.com)</option>
              <option value="swethanimma@texasrealtyhub.com">Swetha Nimma (swethanimma@texasrealtyhub.com)</option>
            </select>
          </Field>

          <Field label="Greeting Preference">
            <select
              value={form.greeting_preference}
              onChange={e => set("greeting_preference", e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground font-sans focus:outline-none focus:ring-1 focus:ring-accent"
              data-testid="select-greeting-preference"
            >
              <option value="us_only">🇺🇸 US Holidays Only</option>
              <option value="indian_and_us">🌏 Indian &amp; US Holidays</option>
              <option value="none">🔕 No Greetings</option>
            </select>
          </Field>

          {saveError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2 font-sans">{saveError}</p>
          )}
          {success && (
            <p className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2 font-sans">
              {isEdit ? "Client updated successfully!" : "Client added successfully!"}
            </p>
          )}
        </div>

        <div className="px-5 py-4 border-t shrink-0 bg-card flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || success}
            data-testid="button-save-client"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium font-sans transition-opacity disabled:opacity-60"
            style={{ background: GOLD, color: "#1C1C1C" }}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Client"}
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
