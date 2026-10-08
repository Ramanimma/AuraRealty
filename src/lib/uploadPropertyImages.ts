import { supabase } from "@/integrations/supabase/client";

export async function uploadPropertyImages(
  files: FileList,
  listingId: string
): Promise<string[]> {
  const urls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.startsWith("image/")) continue;
    if (file.size > 5 * 1024 * 1024) continue;

    const ext = file.name.split(".").pop() ?? "jpg";
    const fileName = `listing-${listingId}-${Date.now()}-${i}.${ext}`;

    const { error } = await supabase.storage
      .from("property-images")
      .upload(fileName, file, { upsert: true, contentType: file.type });

    if (!error) {
      const { data } = supabase.storage
        .from("property-images")
        .getPublicUrl(fileName);
      urls.push(data.publicUrl);
    }
  }

  return urls;
}
