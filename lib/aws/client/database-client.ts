import "server-only";

import { query } from "@/lib/aws/database";
import { TableQuery, type TableName } from "./table-query";

export interface DatabaseClientOptions {
  readonly userId?: string | null;
  readonly getUserId?: () => Promise<string | null>;
}

export class DatabaseClient {
  readonly options: DatabaseClientOptions;

  constructor(options: DatabaseClientOptions = {}) {
    this.options = Object.freeze({ ...options });
  }

  from(table: TableName | string) {
    return new TableQuery(table, this.options);
  }

  async rpc(name: "find_renter_matches", args: Record<string, unknown>): Promise<{ data: Record<string, unknown>[]; error: { message: string } | null }>;
  async rpc(name: string, args?: Record<string, unknown>): Promise<{ data: number | null; error: { message: string } | null }>;
  async rpc(name: string, args: Record<string, unknown> = {}): Promise<{ data: number | null | Record<string, unknown>[]; error: { message: string } | null }> {
    try {
      const userId = async () => this.options.userId ?? (this.options.getUserId ? await this.options.getUserId() : null);
      let result: { rows: Array<{ result: number | null }> };
      switch (name) {
        case "perform_cost_deduction":
          result = await query<{ result: number }>(
            "select public.perform_cost_deduction($1::uuid, $2::text, $3::integer, $4::text) as result",
            [args.p_user_id, args.p_action_key, args.p_cost, args.p_ref_id ?? null],
          );
          break;
        case "admin_adjust_credits":
          result = await query<{ result: number }>(
            "select public.admin_adjust_credits($1::uuid, $2::integer, $3::text) as result",
            [args.p_user_id, args.p_amount, args.p_description],
          );
          break;
        case "consume_credits": {
          const actor = await userId();
          if (!actor) throw new Error("Authentication required");
          result = await query<{ result: number }>(
            "select public.consume_credits_for_user($1::uuid, $2::integer, $3::text, $4::text, $5::public.transaction_type) as result",
            [actor, args.p_amount, args.p_description, args.p_reference_id ?? null, args.p_type ?? "usage"],
          );
          break;
        }
        case "refill_credits": {
          const actor = await userId();
          if (!actor) throw new Error("Authentication required");
          result = await query<{ result: number }>(
            "select public.refill_credits_for_user($1::uuid, $2::integer, $3::text) as result",
            [actor, args.p_amount, args.p_description],
          );
          break;
        }
        case "find_renter_matches":
          const matches = await query<Record<string, unknown>>(
            "select * from public.find_renter_matches($1::varchar, $2::varchar, $3::varchar, $4::varchar)",
            [args.p_phone ?? null, args.p_email ?? null, args.p_facebook ?? null, args.p_name ?? null],
          );
          return { data: matches.rows, error: null };
        default:
          throw new Error(`Unsupported database function: ${name}`);
      }
      return { data: result.rows[0]?.result ?? null, error: null };
    } catch (error) {
      return { data: null, error: { message: error instanceof Error ? error.message : "Database function failed" } };
    }
  }
}

export function createDatabaseClient(options: DatabaseClientOptions = {}) {
  return new DatabaseClient(options);
}
