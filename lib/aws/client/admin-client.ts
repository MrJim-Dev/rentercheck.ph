import "server-only";

import { query } from "@/lib/aws/database";

export function createAdminClient() {
  return Object.freeze({
    auth: {
      admin: {
        async getUserById(id: string) {
          try {
            const result = await query("select id, email, phone, email_confirmed_at, phone_confirmed_at, last_sign_in_at, user_metadata, app_metadata, created_at, updated_at, deleted_at from auth.users where id = $1::uuid", [id]);
            const row = result.rows[0] as Record<string, unknown> | undefined;
            if (!row) return { data: { user: null }, error: { message: "User not found" } };
            return { data: { user: row }, error: null };
          } catch (error) {
            return { data: { user: null }, error: { message: error instanceof Error ? error.message : "Auth lookup failed" } };
          }
        },
      },
    },
  });
}
