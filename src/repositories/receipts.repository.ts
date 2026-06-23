import { getSupabaseClient } from "@/lib/supabase/client";

const BUCKET = "receipts";

/**
 * Upload a receipt image for a group and return its storage path.
 * Path layout "<groupId>/<uuid>.<ext>" lets RLS gate access by group membership.
 */
export async function uploadReceipt(
  groupId: string,
  file: File,
): Promise<string> {
  const supabase = getSupabaseClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${groupId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

/** A short-lived signed URL to view a receipt (private bucket). */
export async function getReceiptUrl(path: string): Promise<string> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
