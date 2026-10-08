import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogIn, AlertCircle, UserPlus } from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/admin-exists")
      .then((r) => r.json())
      .then(({ exists }) => setAdminExists(!!exists))
      .catch(() => setAdminExists(null));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Invalid credentials. Please try again.");
      setLoading(false);
      return;
    }

    // Try to claim admin if no admin exists yet
    const { data: claimed } = await supabase.rpc("claim_admin");
    if (claimed) {
      // Refresh admin check
      setAdminExists(true);
    }

    // Check admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Authentication failed.");
      setLoading(false);
      return;
    }

    const { data: hasAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!hasAdmin) {
      await supabase.auth.signOut();
      setError("Access denied. Admin privileges required.");
      setLoading(false);
      return;
    }

    navigate("/admin/dashboard");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + "/admin" },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess("Check your email for a confirmation link, then return here to sign in.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary px-4">
      <Card className="w-full max-w-md border-border shadow-xl">
        <CardHeader className="text-center space-y-2">
          <a href="/" className="font-serif text-2xl font-bold text-primary">
            Aura Realty
          </a>
          <CardTitle className="font-serif text-xl">Admin Portal</CardTitle>
          <CardDescription>
            {isSignup ? "Create your admin account" : "Sign in to manage your site"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">
                {success}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Password</label>
                {!isSignup && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-primary underline"
                    onClick={async () => {
                      if (!email) {
                        setError("Enter your email first, then click Forgot Password.");
                        return;
                      }
                      setError("");
                      setLoading(true);
                      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: `${window.location.origin}/reset-password`,
                      });
                      setLoading(false);
                      if (resetError) {
                        setError(resetError.message);
                      } else {
                        setSuccess("Password reset link sent! Check your email.");
                      }
                    }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading}
            >
              {isSignup ? (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {loading ? "Creating account…" : "Create Account"}
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  {loading ? "Signing in…" : "Sign In"}
                </>
              )}
            </Button>
          </form>

          {/* Only show signup toggle if no admin exists yet */}
          {adminExists === false && (
            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-primary underline"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError("");
                  setSuccess("");
                }}
              >
                {isSignup ? "Already have an account? Sign in" : "First time? Create admin account"}
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
