import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import AdminSidebar from "@/components/AdminSidebar";
import { Database, Upload, CheckCircle2, AlertCircle } from "lucide-react";

export default function ImportClientDatabase() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<{ masterClientsCount: number; leaseRemindersCount: number } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/admin"); return; }
      setUser(session.user);
    });
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  const handleImport = async () => {
    if (!selectedFile || !confirmed) return;
    setError("");
    setResult(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      const url = await new Promise<{ masterClientsCount: number; leaseRemindersCount: number }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const fd = new FormData();
        fd.append("file", selectedFile);

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        });

        xhr.addEventListener("load", () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status === 200 && data.success) resolve(data);
            else reject(new Error(data.error || `Server error: ${xhr.status}`));
          } catch {
            reject(new Error("Invalid server response"));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Network error — check your connection and try again")));
        xhr.addEventListener("timeout", () => reject(new Error("Request timed out — try again")));

        xhr.timeout = 120000;
        xhr.open("POST", "/api/admin/import-client-database");
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.send(fd);
      });

      setResult(url);
      setSelectedFile(null);
      setConfirmed(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} signOut={signOut} />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        {/* Top bar */}
        <header className="flex items-center gap-4 h-16 px-6 border-b bg-background shrink-0">
          <button
            className="lg:hidden p-2 rounded-md hover:bg-muted"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            data-testid="button-open-sidebar"
          >
            <Database className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-accent" />
            <h1 className="text-lg font-semibold">Import Client Database</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-xl">
            {/* Info card */}
            <div className="bg-card border rounded-lg p-6 mb-6">
              <h2 className="text-base font-semibold mb-2">Upload Client Database Excel File</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Upload your Client Database Excel file (must contain <strong>"Master Clients"</strong> and{" "}
                <strong>"Lease Reminders"</strong> sheets). This will <span className="text-destructive font-medium">replace all existing</span>{" "}
                client database records with the new file.
              </p>
            </div>

            {/* Upload form */}
            <div className="bg-card border rounded-lg p-6 space-y-5">
              {/* File picker */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Excel File (.xlsx)
                </label>
                <input
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  data-testid="input-import-file"
                  onChange={(e) => {
                    setSelectedFile(e.target.files?.[0] ?? null);
                    setError("");
                    setResult(null);
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border file:border-gray-300 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
                />
                {selectedFile && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Selected: <span className="font-medium text-foreground">{selectedFile.name}</span>{" "}
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              {/* Confirmation checkbox */}
              <label className="flex items-start gap-3 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  data-testid="checkbox-confirm-replace"
                  className="mt-0.5 rounded border-gray-300 accent-yellow-600"
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  I understand this will <strong className="text-foreground">replace all existing records</strong> in the Master Clients and Lease Reminders tables.
                </span>
              </label>

              {/* Progress bar */}
              {isUploading && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600" />
                    <span className="text-xs text-muted-foreground">
                      {uploadProgress < 100 ? `Uploading… ${uploadProgress}%` : "Processing…"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Success message */}
              {result && (
                <div className="flex items-start gap-3 rounded-md border border-green-200 bg-green-50 p-4">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Import successful</p>
                    <p className="text-xs text-green-700 mt-0.5">
                      Imported <strong>{result.masterClientsCount}</strong> master client{result.masterClientsCount !== 1 ? "s" : ""} and{" "}
                      <strong>{result.leaseRemindersCount}</strong> lease reminder{result.leaseRemindersCount !== 1 ? "s" : ""}.
                    </p>
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Import failed</p>
                    <p className="text-xs text-red-700 mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button
                onClick={handleImport}
                disabled={!selectedFile || !confirmed || isUploading}
                data-testid="button-import-submit"
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-accent text-accent-foreground rounded-md hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                <Upload className="h-4 w-4" />
                {isUploading
                  ? uploadProgress < 100
                    ? `Uploading ${uploadProgress}%…`
                    : "Processing…"
                  : "Import Now"}
              </button>
            </div>

            {/* SQL hint */}
            <div className="mt-6 p-4 rounded-lg border border-dashed bg-muted/30">
              <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                <span className="font-semibold text-foreground">Supabase tables required</span> — run this SQL in your Supabase dashboard if not yet created:
              </p>
              <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap break-all leading-relaxed font-mono">{`CREATE TABLE master_clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_role text, full_name text, phone_number text,
  email_address text, birthdate date,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE lease_reminders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_type text, property_address text,
  owner1_name text, owner1_phone text, owner1_email text,
  owner2_name text, owner2_phone text, owner2_email text,
  tenant1_name text, tenant1_phone text, tenant1_email text,
  tenant2_name text, tenant2_phone text, tenant2_email text,
  lease_start_date date, lease_end_date date,
  notice_reminder_date date, last_reminder_sent_at timestamptz,
  reminder_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE master_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE lease_reminders ENABLE ROW LEVEL SECURITY;`}</pre>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
