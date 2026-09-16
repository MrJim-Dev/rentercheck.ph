import { createMrJimCompatClient } from "@/lib/db/compat-client"
import type { SupabaseClient } from "@supabase/supabase-js"

/** The reviewed RDS/MrJim Auth compatibility client for server actions. */
export async function createClient(): Promise<SupabaseClient> {
    return createMrJimCompatClient()
}
