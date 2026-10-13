import { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { ArrowLeft, X, Loader2 } from "lucide-react";
import { adminApi, api, type Appointment, type Listing, type MasterClient } from "@/lib/api";

interface Props {
  existing?: Appointment | null;
  onClose: () => void;
  onSaved: () => void;
}

const GOLD = "#C07A4A";

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide font-sans block mb-1">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive mt-1 font-sans">{error}</p>}
    </div>
  );
}

const inputCls = (hasError = false) =>
  `w-full border rounded-md px-3 py-2 text-sm bg-background text-foreground font-sans focus:outline-none focus:ring-1 focus:ring-accent ${
    hasError ? "border-destructive" : "border-border"
  }`;

const selectCls =
  "w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground font-sans focus:outline-none focus:ring-1 focus:ring-accent";

type PropertyMode = "listing" | "manual";
type ClientMode = "existing" | "new";

export default function AppointmentPanel({ existing, onClose, onSaved }: Props) {
  const qc = useQueryClient();
  const isEdit = !!existing;

  const [propertyMode, setPropertyMode] = useState<PropertyMode>(
    existing?.listing_id ? "listing" : "manual"
  );
  const [clientMode, setClientMode] = useState<ClientMode>(
    existing?.master_client_id ? "existing" : "new"
  );

  const [form, setFormState] = useState({
    appointment_date: existing?.appointment_date ?? "",
    appointment_time: existing?.appointment_time ?? "",
    property_address: existing?.property_address ?? "",
    listing_id: existing?.listing_id ?? "",
    client_name: existing?.client_name ?? "",
    client_phone: existing?.client_phone ?? "",
    client_email: existing?.client_email ?? "",
    master_client_id: existing?.master_client_id ?? "",
    agent: existing?.agent ?? "Agent 1",
    appointment_type: existing?.appointment_type ?? "Showing",
    status: existing?.status ?? "Scheduled",
    notes: existing?.notes ?? "",
    follow_up_date: existing?.follow_up_date ?? "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState(false);

  const [listingSearch, setListingSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");

  const { data: listings = [] } = useQuery<Listing[]>({
    queryKey: ["listings-public"],
    queryFn: () => api.listings.list(),
  });

  const { data: masterClients = [] } = useQuery<MasterClient[]>({
    queryKey: ["admin-master-clients"],
    queryFn: () => adminApi.masterClients.list(),
  });

  const set = (field: string, value: string) => {
    setFormState((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const filteredListings = listings.filter(
    (l) =>
      !listingSearch ||
      l.address?.toLowerCase().includes(listingSearch.toLowerCase()) ||
      l.title?.toLowerCase().includes(listingSearch.toLowerCase())
  );

  const filteredClients = masterClients.filter(
    (c) =>
      !clientSearch ||
      c.full_name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.email_address?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const handleListingSelect = (listing: Listing) => {
    set("listing_id", listing.id);
    set("property_address", listing.address || listing.title);
    setListingSearch("");
  };

  const handleClientSelect = (client: MasterClient) => {
    set("master_client_id", client.id);
    set("client_name", client.full_name ?? "");
    set("client_phone", client.phone_number ?? "");
    set("client_email", client.email_address ?? "");
    setClientSearch("");
  };

  // Reset dependent fields when mode switches
  useEffect(() => {
    if (propertyMode === "manual") {
      setFormState((f) => ({ ...f, listing_id: "" }));
    } else {
      setFormState((f) => ({ ...f, property_address: "", listing_id: "" }));
    }
  }, [propertyMode]);

  useEffect(() => {
    if (clientMode === "new") {
      setFormState((f) => ({ ...f, master_client_id: "", client_name: "", client_phone: "", client_email: "" }));
    }
  }, [clientMode]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.appointment_date) e.appointment_date = "Date is required";
    if (!form.appointment_time) e.appointment_time = "Time is required";
    if (!form.property_address.trim()) e.property_address = "Property address is required";
    if (!form.client_name.trim()) e.client_name = "Client name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setSaveError("");
    try {
      const payload: Partial<Appointment> = {
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        property_address: form.property_address.trim(),
        listing_id: form.listing_id || null,
        client_name: form.client_name.trim(),
        client_phone: form.client_phone.trim() || null,
        client_email: form.client_email.trim() || null,
        master_client_id: form.master_client_id || null,
        agent: form.agent,
        appointment_type: form.appointment_type,
        status: form.status,
        notes: form.notes.trim() || null,
        follow_up_date: form.follow_up_date || null,
      };

      if (isEdit) {
        await adminApi.appointments.update(existing!.id, payload);
      } else {
        await adminApi.appointments.create(payload);
      }
      qc.invalidateQueries({ queryKey: ["admin-appointments"] });
      setSuccess(true);
      onSaved();
      setTimeout(onClose, 1200);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const selectedListing = listings.find((l) => l.id === form.listing_id);
  const selectedClient = masterClients.find((c) => c.id === form.master_client_id);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 hidden md:block" onClick={onClose} />
      <div className="fixed inset-0 z-50 md:inset-y-0 md:right-0 md:left-auto md:w-[480px] bg-card border-l shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <button
            onClick={onClose}
            className="md:hidden flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h2 className="font-semibold text-base font-sans flex-1 md:flex-none">
            {isEdit ? "Edit Appointment" : "New Appointment"}
          </h2>
          <button
            onClick={onClose}
            className="hidden md:flex items-center justify-center h-7 w-7 rounded hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" required error={errors.appointment_date}>
              <input
                type="date"
                value={form.appointment_date}
                onChange={(e) => set("appointment_date", e.target.value)}
                className={inputCls(!!errors.appointment_date)}
                data-testid="input-appt-date"
              />
            </Field>
            <Field label="Time" required error={errors.appointment_time}>
              <input
                type="time"
                value={form.appointment_time}
                onChange={(e) => set("appointment_time", e.target.value)}
                className={inputCls(!!errors.appointment_time)}
                data-testid="input-appt-time"
              />
            </Field>
          </div>

          {/* Property */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide font-sans block mb-1">
              Property<span className="text-destructive ml-0.5">*</span>
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setPropertyMode("listing")}
                data-testid="toggle-property-listing"
                className={`text-xs px-3 py-1.5 rounded-md font-medium font-sans border transition-colors ${
                  propertyMode === "listing"
                    ? "border-accent text-accent bg-accent/10"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Select from listings
              </button>
              <button
                type="button"
                onClick={() => setPropertyMode("manual")}
                data-testid="toggle-property-manual"
                className={`text-xs px-3 py-1.5 rounded-md font-medium font-sans border transition-colors ${
                  propertyMode === "manual"
                    ? "border-accent text-accent bg-accent/10"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Manual entry
              </button>
            </div>
            {propertyMode === "listing" ? (
              <div className="space-y-1">
                {selectedListing ? (
                  <div className="flex items-center justify-between gap-2 border border-border rounded-md px-3 py-2 text-sm bg-muted/30">
                    <span className="font-sans text-foreground truncate">{selectedListing.address || selectedListing.title}</span>
                    <button
                      type="button"
                      onClick={() => { set("listing_id", ""); set("property_address", ""); }}
                      className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Search listings…"
                      value={listingSearch}
                      onChange={(e) => setListingSearch(e.target.value)}
                      className={inputCls(!!errors.property_address)}
                      data-testid="input-listing-search"
                    />
                    {listingSearch && (
                      <div className="border border-border rounded-md max-h-44 overflow-y-auto bg-card shadow-sm">
                        {filteredListings.length === 0 ? (
                          <p className="px-3 py-2 text-sm text-muted-foreground font-sans">No listings found</p>
                        ) : (
                          filteredListings.slice(0, 8).map((l) => (
                            <button
                              key={l.id}
                              type="button"
                              onClick={() => handleListingSelect(l)}
                              data-testid={`option-listing-${l.id}`}
                              className="w-full text-left px-3 py-2 text-sm font-sans hover:bg-muted transition-colors border-b border-border last:border-0"
                            >
                              <span className="font-medium">{l.address || l.title}</span>
                              {l.city && <span className="text-muted-foreground ml-1">— {l.city}</span>}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
                {errors.property_address && (
                  <p className="text-xs text-destructive mt-1 font-sans">{errors.property_address}</p>
                )}
              </div>
            ) : (
              <Field label="" error={errors.property_address}>
                <input
                  type="text"
                  placeholder="123 Main St, Austin, TX 78701"
                  value={form.property_address}
                  onChange={(e) => set("property_address", e.target.value)}
                  className={inputCls(!!errors.property_address)}
                  data-testid="input-property-address"
                />
              </Field>
            )}
          </div>

          {/* Client */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide font-sans block mb-1">
              Client<span className="text-destructive ml-0.5">*</span>
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setClientMode("existing")}
                data-testid="toggle-client-existing"
                className={`text-xs px-3 py-1.5 rounded-md font-medium font-sans border transition-colors ${
                  clientMode === "existing"
                    ? "border-accent text-accent bg-accent/10"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Select existing client
              </button>
              <button
                type="button"
                onClick={() => setClientMode("new")}
                data-testid="toggle-client-new"
                className={`text-xs px-3 py-1.5 rounded-md font-medium font-sans border transition-colors ${
                  clientMode === "new"
                    ? "border-accent text-accent bg-accent/10"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                New client
              </button>
            </div>

            {clientMode === "existing" ? (
              <div className="space-y-1">
                {selectedClient ? (
                  <div className="flex items-center justify-between gap-2 border border-border rounded-md px-3 py-2 text-sm bg-muted/30">
                    <span className="font-sans text-foreground">{selectedClient.full_name}</span>
                    <button
                      type="button"
                      onClick={() => { set("master_client_id", ""); set("client_name", ""); set("client_phone", ""); set("client_email", ""); }}
                      className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Search clients…"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className={inputCls(!!errors.client_name)}
                      data-testid="input-client-search"
                    />
                    {clientSearch && (
                      <div className="border border-border rounded-md max-h-44 overflow-y-auto bg-card shadow-sm">
                        {filteredClients.length === 0 ? (
                          <p className="px-3 py-2 text-sm text-muted-foreground font-sans">No clients found</p>
                        ) : (
                          filteredClients.slice(0, 8).map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleClientSelect(c)}
                              data-testid={`option-client-${c.id}`}
                              className="w-full text-left px-3 py-2 text-sm font-sans hover:bg-muted transition-colors border-b border-border last:border-0"
                            >
                              <span className="font-medium">{c.full_name}</span>
                              {c.email_address && (
                                <span className="text-muted-foreground ml-1">— {c.email_address}</span>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
                {errors.client_name && (
                  <p className="text-xs text-destructive mt-1 font-sans">{errors.client_name}</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <Field label="Client Name" required error={errors.client_name}>
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    value={form.client_name}
                    onChange={(e) => set("client_name", e.target.value)}
                    className={inputCls(!!errors.client_name)}
                    data-testid="input-client-name"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    type="tel"
                    placeholder="(512) 555-0100"
                    value={form.client_phone}
                    onChange={(e) => set("client_phone", e.target.value)}
                    className={inputCls()}
                    data-testid="input-client-phone"
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    placeholder="jane@example.com"
                    value={form.client_email}
                    onChange={(e) => set("client_email", e.target.value)}
                    className={inputCls()}
                    data-testid="input-client-email"
                  />
                </Field>
              </div>
            )}
          </div>

          {/* Agent & Type */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Agent">
              <select
                value={form.agent}
                onChange={(e) => set("agent", e.target.value)}
                className={selectCls}
                data-testid="select-agent"
              >
                <option value="Agent 1">Agent 1</option>
                <option value="Agent 2">Agent 2</option>
              </select>
            </Field>
            <Field label="Type">
              <select
                value={form.appointment_type}
                onChange={(e) => set("appointment_type", e.target.value)}
                className={selectCls}
                data-testid="select-appointment-type"
              >
                <option value="Showing">Showing</option>
                <option value="Consultation">Consultation</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Open House">Open House</option>
              </select>
            </Field>
          </div>

          {/* Status */}
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className={selectCls}
              data-testid="select-status"
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="No-show">No-show</option>
            </select>
          </Field>

          {/* Notes */}
          <Field label="Notes">
            <textarea
              rows={3}
              placeholder="Any additional details…"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className={`${inputCls()} resize-none`}
              data-testid="textarea-notes"
            />
          </Field>

          {/* Follow-up date — shown when status is Completed */}
          {form.status === "Completed" && (
            <Field label="Follow-up Date">
              <input
                type="date"
                value={form.follow_up_date}
                onChange={(e) => set("follow_up_date", e.target.value)}
                className={inputCls()}
                data-testid="input-follow-up-date"
              />
            </Field>
          )}

          {saveError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2 font-sans">
              {saveError}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2 font-sans">
              {isEdit ? "Appointment updated!" : "Appointment created!"}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t shrink-0 bg-card flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || success}
            data-testid="button-save-appointment"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium font-sans transition-opacity disabled:opacity-60"
            style={{ background: GOLD, color: "#1E2A44" }}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Appointment"}
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
