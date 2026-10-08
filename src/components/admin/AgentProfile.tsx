import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Mail } from "lucide-react";
import { toast } from "sonner";

const AgentProfile = () => {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "", phone: "", email: "", license_number: "", iabs_url: "", consumer_notice_url: "",
  });
  const [profileId, setProfileId] = useState<string | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["admin-agent-profile"],
    queryFn: () => adminApi.agentProfile.get(),
  });

  useEffect(() => {
    if (profile) {
      setProfileId(profile.id);
      setForm({
        name: profile.name,
        phone: profile.phone,
        email: profile.email,
        license_number: profile.license_number ?? "",
        iabs_url: profile.iabs_url ?? "",
        consumer_notice_url: profile.consumer_notice_url ?? "",
      });
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      if (profileId) {
        await adminApi.agentProfile.update(profileId, form);
      } else {
        await adminApi.agentProfile.create(form);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-agent-profile"] });
      qc.invalidateQueries({ queryKey: ["agent-profile"] });
      toast.success("Profile saved");
    },
    onError: () => toast.error("Failed to save profile"),
  });

  const field = (label: string, key: keyof typeof form, type = "text") => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <Input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

  const [loginEmail, setLoginEmail] = useState("");
  const [emailUpdating, setEmailUpdating] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setLoginEmail(user.email);
    });
  }, []);

  const handleEmailUpdate = async () => {
    if (!loginEmail.trim()) return;
    setEmailUpdating(true);
    const { error } = await supabase.auth.updateUser(
      { email: loginEmail },
      { emailRedirectTo: window.location.origin + "/admin" }
    );
    setEmailUpdating(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Confirmation sent to your new email. Check both inboxes.");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Agent Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field("Full Name", "name")}
            {field("Phone", "phone", "tel")}
            {field("Email", "email", "email")}
            {field("License Number", "license_number")}
            {field("IABS Document URL", "iabs_url", "url")}
            {field("Consumer Notice URL", "consumer_notice_url", "url")}
          </div>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            <Save className="h-4 w-4 mr-1" /> {save.isPending ? "Saving…" : "Save Profile"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-base">Update Login Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Change the email you use to sign in to this admin portal.
          </p>
          <div className="flex gap-2 max-w-md">
            <Input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="new@example.com"
            />
            <Button onClick={handleEmailUpdate} disabled={emailUpdating} variant="outline">
              <Mail className="h-4 w-4 mr-1" /> {emailUpdating ? "Sending…" : "Update"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentProfile;
