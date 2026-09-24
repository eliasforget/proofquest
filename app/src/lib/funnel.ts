import type { SupabaseClient } from "@supabase/supabase-js";

export type FunnelEvent = "login" | "scan" | "quest_start" | "quest_verified" | "proof_share";

// Observational product telemetry only. Never used for authorization or XP.
// The database bounds collection to one milestone per account/event/UTC day.
export async function recordFunnelEvent(client: SupabaseClient, userId: string, event: FunnelEvent) {
  try { await client.from("funnel_events").insert({ user_id: userId, event }); }
  catch { /* Analytics outages must not interrupt the product. */ }
}
