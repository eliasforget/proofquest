"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseProfileInput } from "@/lib/profile-input";

export async function updateProfile(value: unknown): Promise<"saved" | "invalid" | "error"> {
  const input = parseProfileInput(value);
  if (!input) return "invalid";
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return "error";
    const { data, error } = await supabase.from("profiles").update(input)
      .eq("user_id", user.id).select("username").maybeSingle();
    if (error || !data) return "error";
    revalidatePath("/settings/profile");
    revalidatePath(`/u/${data.username}`);
    return "saved";
  } catch { return "error"; }
}
