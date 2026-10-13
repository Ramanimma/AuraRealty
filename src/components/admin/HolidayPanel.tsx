import { useRef, useState } from "react";
import { ArrowLeft, X, Loader2, Paperclip } from "lucide-react";
import { adminApi, type Holiday } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Props {
  existing?: Holiday | null;
  onClose: () => void;
  onSaved: () => void;
}

const GOLD = "#C07A4A";

function Field({ label, required, error, children }: {
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

export default function HolidayPanel({ existing, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const isEdit = !!existing;

  const [form, setFormState] = useState({
    name: existing?.name ?? "",
    type: existing?.type ?? "us",
    holiday_date: existing?.holiday_date ?? "",
    year: existing?.year ? String(existing.year) : String(new Date().getFullYear()),
    is_active: existing?.is_active ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const set = (field: string, value: string | boolean) => {
    setFormState((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Holiday name is required";
    if (!form.holiday_date) e.holiday_date = "Date is required";
    if (!form.year || isNaN(Number(form.year))) e.year = "Valid year is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setSaveError("");
    try {
      const payload: Partial<Holiday> = {
        name: form.name.trim(),
        type: form.type,
        holiday_date: form.holiday_date,
        year: Number(form.year),
        is_active: form.is_active,
      };
      if (isEdit) {
        await adminApi.holidays.update(existing!.id, payload);
      } else {
        await adminApi.holidays.create(payload);
      }
      setSuccess(true);
      onSaved();
      setTimeout(onClose, 1200);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

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
            {isEdit ? "Edit Holiday" : "Add Holiday"}
          </h2>
          <button
            onClick={onClose}
            className="hidden md:flex items-center justify-center h-7 w-7 rounded hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <Field label="Holiday Name" required error={errors.name}>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputCls(!!errors.name)}
              data-testid="input-holiday-name"
              placeholder="e.g. New Year"
            />
          </Field>

          <Field label="Type" required>
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className={selectCls}
              data-testid="select-holiday-type"
            >
              <option value="us">🇺🇸 US Holiday</option>
              <option value="indian">🌏 Indian Holiday</option>
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" required error={errors.holiday_date}>
              <input
                type="date"
                value={form.holiday_date}
                onChange={(e) => set("holiday_date", e.target.value)}
                className={inputCls(!!errors.holiday_date)}
                data-testid="input-holiday-date"
              />
            </Field>
            <Field label="Year" required error={errors.year}>
              <input
                type="number"
                value={form.year}
                onChange={(e) => set("year", e.target.value)}
                className={inputCls(!!errors.year)}
                data-testid="input-holiday-year"
              />
            </Field>
          </div>

          <Field label="Active">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => set("is_active", true)}
                className={`text-xs px-3 py-1.5 rounded-md font-medium font-sans border transition-colors ${
                  form.is_active
                    ? "border-accent text-accent bg-accent/10"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
                data-testid="toggle-holiday-active-yes"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => set("is_active", false)}
                className={`text-xs px-3 py-1.5 rounded-md font-medium font-sans border transition-colors ${
                  !form.is_active
                    ? "border-destructive text-destructive bg-destructive/10"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
                data-testid="toggle-holiday-active-no"
              >
                No
              </button>
            </div>
          </Field>

          {isEdit && (
            <Field label="Holiday Flyer">
              <div className="flex items-center gap-3">
                {existing?.flyer_url ? (
                  <img
                    src={existing.flyer_url}
                    alt={`${existing.name} flyer`}
                    className="object-cover rounded border border-border"
                    style={{ width: 120, height: 80 }}
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">No flyer uploaded</span>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !existing) return;
                    setUploading(true);
                    setUploadProgress(0);
                    try {
                      await adminApi.holidays.uploadFlyer(existing.id, file, setUploadProgress);
                      onSaved();
                      toast({ title: "Flyer uploaded" });
                    } catch (err: any) {
                      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
                    } finally {
                      setUploading(false);
                      setUploadProgress(0);
                      e.target.value = "";
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium font-sans border border-border hover:bg-muted transition-colors disabled:opacity-50"
                  data-testid="button-upload-flyer-panel"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {uploadProgress}%
                    </>
                  ) : (
                    <>
                      <Paperclip className="h-3 w-3" />
                      {existing?.flyer_url ? "Replace Flyer" : "Upload Flyer"}
                    </>
                  )}
                </button>
              </div>
            </Field>
          )}

          {saveError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2 font-sans">{saveError}</p>
          )}
          {success && (
            <p className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2 font-sans">
              {isEdit ? "Holiday updated!" : "Holiday added!"}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t shrink-0 bg-card flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || success}
            data-testid="button-save-holiday"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium font-sans transition-opacity disabled:opacity-60"
            style={{ background: GOLD, color: "#1E2A44" }}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Holiday"}
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
