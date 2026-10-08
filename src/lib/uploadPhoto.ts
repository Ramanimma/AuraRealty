import { supabase } from "@/integrations/supabase/client";

export async function uploadAgentPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File size must be under 5 MB.");
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const fileName = `agent-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("agent-photos")
    .upload(fileName, file, { upsert: false, contentType: file.type });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage
    .from("agent-photos")
    .getPublicUrl(fileName);

  return data.publicUrl;
}
