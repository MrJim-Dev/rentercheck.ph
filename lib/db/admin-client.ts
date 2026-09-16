import { createMrJimCompatClient } from "@/lib/db/compat-client"
import type { SupabaseClient } from "@supabase/supabase-js"

/** Controller-shaped access over the AWS/RDS boundary. */
export async function createAdminClient(): Promise<SupabaseClient> {
    return createMrJimCompatClient()
}
