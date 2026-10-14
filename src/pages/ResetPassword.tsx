import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, KeyRound } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from the email link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess("Password updated successfully! Redirecting…");
      setTimeout(() => navigate("/admin"), 2000);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F8FA] px-4">
        <header className="public-page-header">
          <h1 className="public-page-title">Reset Password</h1>
          <div className="mx-auto my-3 h-px w-10 bg-[#C07A4A]" />
          <p className="public-page-subtitle">Aura Realty</p>
        </header>
        <Card className="w-full max-w-md border-[#E9EDF3] shadow-xl">
          <CardContent className="pt-6 text-center text-[#4B5563]">
            <p>Validating your reset link…</p>
            <p className="text-sm mt-2">If this page doesn't update, the link may have expired. <a href="/admin" className="text-primary underline">Return to login</a></p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F8FA] px-4">
      <header className="public-page-header">
        <h1 className="public-page-title">Reset Password</h1>
        <div className="mx-auto my-3 h-px w-10 bg-[#C07A4A]" />
        <p className="public-page-subtitle">Enter your new password below</p>
      </header>
      <Card className="w-full max-w-md border-[#E9EDF3] shadow-xl">
        <CardHeader className="text-center space-y-2">
          <a href="/" className="font-serif text-2xl font-bold text-primary">Aura Realty</a>
          <CardTitle className="font-serif text-xl">Reset Password</CardTitle>
          <CardDescription className="text-[#4B5563]">Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="public-tool-inputs space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-[#F87171]/10 p-3 text-sm text-[#C0392B]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">{success}</div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">New Password</label>
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Confirm Password</label>
              <Input type="password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            <Button type="submit" variant="publicPrimary" className="w-full" disabled={loading}>
              <KeyRound className="h-4 w-4 mr-2" />
              {loading ? "Updating…" : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
