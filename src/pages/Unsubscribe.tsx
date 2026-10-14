import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import PublicPageHeader from "@/components/PublicPageHeader";

type Status = "loading" | "success" | "error" | "missing";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>(token ? "loading" : "missing");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`/api/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (res.ok) {
          setStatus("success");
        } else {
          const body = await res.json().catch(() => ({}));
          setErrorMsg(body.error || "Something went wrong.");
          setStatus("error");
        }
      })
      .catch(() => {
        setErrorMsg("Network error — please try again.");
        setStatus("error");
      });
  }, [token]);

  return (
    <div
      style={{ minHeight: "100vh", backgroundColor: "#F7F8FA" }}
      className="flex min-h-[100dvh] flex-col items-center justify-center px-6"
    >
      <PublicPageHeader className="w-full" title="Email Preferences" subtitle="Aura Realty" />
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-border p-10 text-center">
        <img
          src="https://xxiwznuuaouwsugtgsut.supabase.co/storage/v1/object/public/agent-photos/LogoWithTransBackgrnd%20(1).png"
          alt="Aura Realty"
          className="h-12 mx-auto mb-8 object-contain"
        />

        {status === "loading" && (
          <>
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground text-sm font-sans">Processing your request…</p>
          </>
        )}

        {status === "success" && (
          <>
            <h1 className="text-xl font-semibold font-serif text-foreground mb-3">
              You've been unsubscribed
            </h1>
            <p className="text-muted-foreground text-sm font-sans mb-6">
              You will no longer receive marketing emails from Aura Realty.
              If this was a mistake, please contact us directly.
            </p>
            <p className="text-xs text-muted-foreground font-sans">
              Phone:{" "}
              <a href="tel:5129001897" className="text-accent hover:underline">
                512-900-1897
              </a>
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-xl font-semibold font-serif text-foreground mb-3">
              Something went wrong
            </h1>
            <p className="text-muted-foreground text-sm font-sans mb-4">{errorMsg}</p>
            <Link to="/" className="text-sm text-accent hover:underline font-sans">
              Return to Aura Realty
            </Link>
          </>
        )}

        {status === "missing" && (
          <>
            <h1 className="text-xl font-semibold font-serif text-foreground mb-3">
              Invalid link
            </h1>
            <p className="text-muted-foreground text-sm font-sans mb-4">
              This unsubscribe link is missing a token. Please use the link
              from your email.
            </p>
            <Link to="/" className="text-sm text-accent hover:underline font-sans">
              Return to Aura Realty
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
