/* eslint-disable @typescript-eslint/no-explicit-any -- this preserves the MrJim AWS-shaped action API while the implementation uses parameterized pg queries. */
import "server-only";

import { query } from "@/lib/aws/database";
import type { DatabaseClientOptions } from "./database-client";

export type TableName =
  | "admin_pending_amendments" | "admin_pending_reports" | "admin_stats" | "admin_users"
  | "credit_action_costs" | "credit_transactions" | "credit_wallets" | "dispute_evidence"
  | "incident_disputes" | "incident_reports" | "my_reports" | "public_incident_summaries"
  | "public_renter_profiles" | "report_admin_actions" | "report_amendments" | "report_edits"
  | "report_evidence" | "report_group_members" | "report_groups" | "report_identifiers"
  | "report_info_requests" | "renter_identifiers" | "renters" | "search_access_logs" | "users"
  | "disputes";

type Row = Record<string, any>;
type QueryData = any;
type QueryResult = { data: QueryData | null; count: number | null; error: { message: string } | null };
type Operation = "select" | "insert" | "update" | "delete" | "upsert";
type Terminal = "list" | "single" | "maybeSingle";
type RelationSpec = { alias: string; table: string; columns: string };
type FilterSpec = { kind: string; column?: string; value?: unknown; operator?: string; expression?: string };

const allowedTables = new Set<string>([
  "admin_pending_amendments", "admin_pending_reports", "admin_stats", "admin_users",
  "credit_action_costs", "credit_transactions", "credit_wallets", "dispute_evidence",
  "incident_disputes", "incident_reports", "my_reports", "public_incident_summaries",
  "public_renter_profiles", "report_admin_actions", "report_amendments", "report_edits",
  "report_evidence", "report_group_members", "report_groups", "report_identifiers",
  "report_info_requests", "renter_identifiers", "renters", "search_access_logs", "users", "disputes",
]);

const tableAliases: Record<string, string> = { disputes: "incident_disputes" };
const knownRelations = new Set(["renters", "renter_identifiers", "incident_reports", "users", "dispute_evidence", "admin_users"]);

function identifier(value: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/u.test(value)) throw new TypeError(`Invalid database identifier: ${value}`);
  return `"${value}"`;
}

function tableIdentifier(table: string): string {
  if (!allowedTables.has(table)) throw new TypeError(`Database table is not allowed: ${table}`);
  const actual = tableAliases[table] ?? table;
  return `"public"."${actual}"`;
}

function splitTopLevel(input: string): string[] {
  const output: string[] = [];
  let start = 0;
  let depth = 0;
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char === "(") depth += 1;
    else if (char === ")") depth -= 1;
    else if (char === "," && depth === 0) {
      output.push(input.slice(start, i).trim());
      start = i + 1;
    }
  }
  const tail = input.slice(start).trim();
  if (tail) output.push(tail);
  return output;
}

function parseSelection(selection: string): { columns: string[]; relations: RelationSpec[] } {
  const columns: string[] = [];
  const relations: RelationSpec[] = [];
  for (const item of splitTopLevel(selection.replace(/\s+/gu, " ").trim())) {
    if (!item || item === "*") continue;
    const relation = item.match(/^(?:(?<alias>[A-Za-z_][A-Za-z0-9_]*)\s*:\s*)?(?<table>[A-Za-z_][A-Za-z0-9_]*)(?:![A-Za-z_][A-Za-z0-9_]*)?\s*\((?<columns>[\s\S]*)\)$/u);
    if (relation?.groups?.table && relation.groups.columns !== undefined) {
      if (!knownRelations.has(relation.groups.table)) throw new TypeError(`Unsupported relation: ${relation.groups.table}`);
      relations.push({ alias: relation.groups.alias ?? relation.groups.table, table: relation.groups.table, columns: relation.groups.columns });
      continue;
    }
    const alias = item.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([A-Za-z_][A-Za-z0-9_]*)$/u);
    columns.push(identifier(alias?.[1] ?? item));
  }
  return { columns, relations };
}

function rowsInput(value: unknown): Row[] {
  const rows = Array.isArray(value) ? value : [value];
  if (rows.length === 0 || rows.some((row) => row === null || typeof row !== "object" || Array.isArray(row))) {
    throw new TypeError("Database mutation values are malformed");
  }
  return rows as Row[];
}

function errorResult(error: unknown): QueryResult {
  return { data: null, count: null, error: { message: error instanceof Error ? error.message : "Database query failed" } };
}

export class TableQuery implements PromiseLike<QueryResult> {
  private operation: Operation = "select";
  private selection = "*";
  private relations: RelationSpec[] = [];
  private head = false;
  private exactCount = false;
  private filters: FilterSpec[] = [];
  private orders: { column: string; ascending: boolean; nullsFirst?: boolean }[] = [];
  private values: Row[] = [];
  private terminal: Terminal = "list";
  private maximum?: number;
  private offset?: number;
  private conflictColumns: string[] = [];
  private ignoreDuplicates = false;
  private executed?: Promise<QueryResult>;
  readonly table: TableName | string;
  readonly options: DatabaseClientOptions;

  constructor(table: TableName | string, options: DatabaseClientOptions) {
    if (!allowedTables.has(table)) throw new TypeError(`Database table is not allowed: ${table}`);
    this.table = table;
    this.options = options;
  }

  private mutable() { if (this.executed) throw new Error("Database query has already executed"); }

  select(selection: string, options: { count?: "exact"; head?: boolean } = {}) {
    this.mutable();
    this.selection = selection.trim() || "*";
    const parsed = parseSelection(this.selection);
    this.relations = parsed.relations;
    this.exactCount = options.count === "exact";
    this.head = options.head === true;
    return this;
  }
  insert(values: unknown) { this.mutable(); this.operation = "insert"; this.values = rowsInput(values); return this; }
  update(values: unknown) { this.mutable(); this.operation = "update"; this.values = rowsInput(values); if (this.values.length !== 1) throw new TypeError("Database update values are malformed"); return this; }
  delete() { this.mutable(); this.operation = "delete"; return this; }
  upsert(values: unknown, options: { onConflict?: string; ignoreDuplicates?: boolean } = {}) {
    this.mutable(); this.operation = "upsert"; this.values = rowsInput(values);
    this.conflictColumns = (options.onConflict ? splitTopLevel(options.onConflict) : ["id"]).map((x) => identifier(x).slice(1, -1));
    this.ignoreDuplicates = options.ignoreDuplicates === true;
    return this;
  }
  eq(column: string, value: unknown) { return this.add({ kind: "comparison", column, operator: "=", value }); }
  neq(column: string, value: unknown) { return this.add({ kind: "comparison", column, operator: "<>", value }); }
  is(column: string, value: null | boolean) { return this.add({ kind: "is", column, value }); }
  not(column: string, operator: string, value: unknown) { return this.add({ kind: "not", column, operator, value }); }
  in(column: string, values: readonly unknown[]) { return this.add({ kind: "in", column, value: values }); }
  or(expression: string) { return this.add({ kind: "or", expression }); }
  and(expression: string) { return this.add({ kind: "and", expression }); }
  ilike(column: string, value: string) { return this.add({ kind: "comparison", column, operator: "ilike", value }); }
  like(column: string, value: string) { return this.add({ kind: "comparison", column, operator: "like", value }); }
  gte(column: string, value: unknown) { return this.add({ kind: "comparison", column, operator: ">=", value }); }
  lte(column: string, value: unknown) { return this.add({ kind: "comparison", column, operator: "<=", value }); }
  gt(column: string, value: unknown) { return this.add({ kind: "comparison", column, operator: ">", value }); }
  lt(column: string, value: unknown) { return this.add({ kind: "comparison", column, operator: "<", value }); }
  match(values: Record<string, unknown>) { for (const [column, value] of Object.entries(values)) this.eq(column, value); return this; }
  filter(column: string, operator: string, value: unknown) { return this.add({ kind: "comparison", column, operator, value }); }
  textSearch(column: string, value: string, options: { type?: "websearch" | "plain"; config?: string } = {}) { return this.add({ kind: "textSearch", column, value, operator: options.type ?? "websearch", expression: options.config ?? "english" }); }
  contains(column: string, value: unknown) { return this.add({ kind: "contains", column, value }); }
  order(column: string, options: { ascending?: boolean; nullsFirst?: boolean } = {}) { this.mutable(); this.orders.push({ column, ascending: options.ascending !== false, nullsFirst: options.nullsFirst }); return this; }
  limit(value: number) { this.mutable(); if (!Number.isSafeInteger(value) || value < 0) throw new TypeError("Database limit is malformed"); this.maximum = value; return this; }
  range(from: number, to: number) { this.mutable(); if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || from < 0 || to < from) throw new TypeError("Database range is malformed"); this.offset = from; this.maximum = to - from + 1; return this; }
  single() { this.terminal = "single"; return this.execute(); }
  maybeSingle() { this.terminal = "maybeSingle"; return this.execute(); }

  private add(filter: FilterSpec) { this.mutable(); if (filter.column) identifier(filter.column); this.filters.push(filter); return this; }

  private buildWhere(values: unknown[]): string {
    const parameter = (value: unknown) => { values.push(value); return `$${values.length}`; };
    const parseCondition = (condition: string): string => {
      const match = condition.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)\.(eq|neq|ilike|like|gte|lte|gt|lt|is|not\.is)\.(.*)$/isu);
      if (!match) throw new TypeError(`Unsupported OR condition: ${condition}`);
      const column = `"${match[1]}"`;
      const operator = match[2].toLowerCase();
      const value = match[3] ?? "";
      if (operator === "is") return value === "null" ? `${column} IS NULL` : `${column} IS ${value === "true" ? "TRUE" : "FALSE"}`;
      if (operator === "not.is") return value === "null" ? `${column} IS NOT NULL` : `${column} IS NOT ${value === "true" ? "TRUE" : "FALSE"}`;
      const sqlOperator = ({ eq: "=", neq: "<>", ilike: "ILIKE", like: "LIKE", gte: ">=", lte: "<=", gt: ">", lt: "<" } as Record<string, string>)[operator];
      const decoded = value.replaceAll("%25", "%");
      return `${column} ${sqlOperator} ${parameter(decoded)}`;
    };
    const clauses = this.filters.map((filter) => {
      const column = filter.column ? identifier(filter.column) : "";
      switch (filter.kind) {
        case "comparison": return `${column} ${String(filter.operator).toUpperCase()} ${parameter(filter.value)}`;
        case "is": return filter.value === null ? `${column} IS NULL` : `${column} IS ${filter.value ? "TRUE" : "FALSE"}`;
        case "not":
          if (filter.operator === "is" && filter.value === null) return `${column} IS NOT NULL`;
          throw new TypeError("Unsupported NOT filter");
        case "in": {
          const items = Array.isArray(filter.value) ? filter.value : [];
          return items.length ? `${column} IN (${items.map(parameter).join(", ")})` : "FALSE";
        }
        case "or": return `(${String(filter.expression).split(",").map(parseCondition).join(" OR ")})`;
        case "and": return `(${String(filter.expression).split(",").map(parseCondition).join(" AND ")})`;
        case "contains": return `${column} @> ${parameter(filter.value)}::jsonb`;
        case "textSearch": {
          const config = String(filter.expression).replace(/[^a-z_]/giu, "") || "english";
          const fn = filter.operator === "plain" ? "plainto_tsquery" : "websearch_to_tsquery";
          return `${column} @@ ${fn}(${parameter(config)}, ${parameter(filter.value)})`;
        }
        default: throw new TypeError("Unsupported database filter");
      }
    });
    return clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
  }

  private selectedColumns(): string {
    const parsed = parseSelection(this.selection);
    if (parsed.columns.length === 0) return "*";
    return parsed.columns.join(", ");
  }

  private mutationColumns(rows: Row[]): string[] {
    const columns = Object.keys(rows[0] ?? {});
    if (!columns.length || rows.some((row) => Object.keys(row).length !== columns.length || columns.some((column) => !Object.hasOwn(row, column)))) throw new TypeError("Database mutation rows must share columns");
    columns.forEach(identifier);
    return columns;
  }

  private buildQuery(): { text: string; values: unknown[]; countText?: string; countValues?: unknown[]; returnsRows: boolean } {
    const values: unknown[] = [];
    const where = this.buildWhere(values);
    const orders = this.orders.length ? ` ORDER BY ${this.orders.map((item) => `${identifier(item.column)} ${item.ascending ? "ASC" : "DESC"}${item.nullsFirst === undefined ? "" : item.nullsFirst ? " NULLS FIRST" : " NULLS LAST"}`).join(", ")}` : "";
    const suffix = `${orders}${this.maximum === undefined ? "" : ` LIMIT ${this.maximum}`}${this.offset === undefined ? "" : ` OFFSET ${this.offset}`}`;
    const table = tableIdentifier(this.table);
    if (this.operation === "select") {
      const countValues: unknown[] = [];
      const countText = this.exactCount ? `SELECT count(*)::bigint AS count FROM ${table}${this.buildWhere(countValues)}` : undefined;
      return { text: `SELECT ${this.head ? this.selectedColumns() : this.selectedColumns()} FROM ${table}${where}${suffix}`, values, countText, countValues, returnsRows: !this.head };
    }
    const columns = this.mutationColumns(this.values);
    const returning = this.selection === "*" ? "" : ` RETURNING ${this.selectedColumns()}`;
    if (this.operation === "delete") return { text: `DELETE FROM ${table}${where}${returning}`, values, returnsRows: this.selection !== "*" };
    if (this.operation === "update") {
      const row = this.values[0] as Row;
      const set = columns.map((column) => `${identifier(column)} = ${values.push(row[column]) && `$${values.length}`}`).join(", ");
      return { text: `UPDATE ${table} SET ${set}${where}${returning}`, values, returnsRows: this.selection !== "*" };
    }
    const tuples = this.values.map((row) => `(${columns.map((column) => { values.push(row[column]); return `$${values.length}`; }).join(", ")})`).join(", ");
    let conflict = "";
    if (this.operation === "upsert") {
      if (!this.conflictColumns.length) throw new TypeError("Database upsert conflict columns are required");
      const updates = columns.filter((column) => !this.conflictColumns.includes(column));
      conflict = ` ON CONFLICT (${this.conflictColumns.map(identifier).join(", ")}) DO ${this.ignoreDuplicates || !updates.length ? "NOTHING" : `UPDATE SET ${updates.map((column) => `${identifier(column)} = EXCLUDED.${identifier(column)}`).join(", ")}`}`;
    }
    return { text: `INSERT INTO ${table} (${columns.map(identifier).join(", ")}) VALUES ${tuples}${conflict}${returning}`, values, returnsRows: this.selection !== "*" };
  }

  private async hydrate(rows: Row[]): Promise<Row[]> {
    if (!rows.length || !this.relations.length) return rows;
    for (const relation of this.relations) {
      const relationColumns = parseSelection(relation.columns).columns.join(", ").replaceAll('"', "") || "*";
      const ids = rows.map((row) => row.id).filter((id) => typeof id === "string");
      if (relation.table === "renters" && this.table === "incident_reports") {
        const relationRows = ids.length ? (await query(`SELECT ${relationColumns} FROM public.renters WHERE id = ANY($1::uuid[])`, [rows.map((row) => row.renter_id).filter(Boolean)])).rows : [];
        const byId = new Map(relationRows.map((row: Row) => [row.id, row]));
        rows.forEach((row) => { row[relation.alias] = row.renter_id ? byId.get(row.renter_id) ?? null : null; });
      } else if (relation.table === "incident_reports" && this.table === "incident_disputes") {
        const relationRows = (await query(`SELECT ${relationColumns} FROM public.incident_reports WHERE id = ANY($1::uuid[])`, [rows.map((row) => row.report_id).filter(Boolean)])).rows;
        const byId = new Map(relationRows.map((row: Row) => [row.id, row]));
        rows.forEach((row) => { row[relation.alias] = byId.get(row.report_id) ?? null; });
      } else if (relation.table === "users" && this.table === "incident_disputes") {
        const relationRows = (await query(`SELECT ${relationColumns} FROM public.users WHERE id = ANY($1::uuid[])`, [rows.map((row) => row.disputer_id).filter(Boolean)])).rows;
        const byId = new Map(relationRows.map((row: Row) => [row.id, row]));
        rows.forEach((row) => { row[relation.alias] = byId.get(row.disputer_id) ?? null; });
      } else if (relation.table === "dispute_evidence" && this.table === "incident_disputes") {
        const relationRows = (await query(`SELECT ${relationColumns} FROM public.dispute_evidence WHERE dispute_id = ANY($1::uuid[])`, [ids])).rows;
        const byId = new Map<string, Row[]>();
        relationRows.forEach((row: Row) => { const list = byId.get(row.dispute_id) ?? []; list.push(row); byId.set(row.dispute_id, list); });
        rows.forEach((row) => { row[relation.alias] = byId.get(row.id) ?? []; });
      } else if (relation.table === "renter_identifiers" && this.table === "renters") {
        const relationRows = (await query(`SELECT ${relationColumns}, renter_id FROM public.renter_identifiers WHERE renter_id = ANY($1::uuid[])`, [ids])).rows;
        const byId = new Map<string, Row[]>();
        relationRows.forEach((row: Row) => { const list = byId.get(row.renter_id) ?? []; delete row.renter_id; list.push(row); byId.set(row.renter_id, list); });
        rows.forEach((row) => { row[relation.alias] = byId.get(row.id) ?? []; });
      } else if (relation.table === "admin_users" && this.table === "report_edits") {
        const relationRows = (await query(`SELECT ${relationColumns} FROM public.admin_users WHERE id = ANY($1::uuid[])`, [rows.map((row) => row.edited_by).filter(Boolean)])).rows;
        const byId = new Map(relationRows.map((row: Row) => [row.id, row]));
        rows.forEach((row) => { row[relation.alias] = byId.get(row.edited_by) ?? null; });
      } else {
        rows.forEach((row) => { row[relation.alias] = Array.isArray(row[relation.alias]) ? row[relation.alias] : null; });
      }
    }
    return rows;
  }

  private async run() {
    try {
      const built = this.buildQuery();
      let count: number | null = null;
      if (built.countText) count = Number((await query<{ count: string }>(built.countText, built.countValues ?? [])).rows[0]?.count ?? 0);
      if (this.head && this.exactCount) return { data: null, count, error: null };
      const result = await query<Row>(built.text, built.values);
      let rows = built.returnsRows ? result.rows : [];
      rows = await this.hydrate(rows);
      if (this.operation !== "select" && this.selection === "*") return { data: null, count, error: null };
      if (this.terminal === "single") {
        if (rows.length !== 1) return { data: null, count, error: { message: `Expected exactly one row, got ${rows.length}` } };
        return { data: rows[0] as QueryData, count, error: null };
      }
      if (this.terminal === "maybeSingle") {
        if (rows.length > 1) return { data: null, count, error: { message: `Expected zero or one row, got ${rows.length}` } };
        return { data: (rows[0] ?? null) as QueryData | null, count, error: null };
      }
      return { data: rows as QueryData, count, error: null };
    } catch (error) {
      return errorResult(error);
    }
  }

  execute() { this.executed ??= this.run(); return this.executed; }
  then<TResult1 = QueryResult, TResult2 = never>(onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null) {
    return this.execute().then(onfulfilled, onrejected);
  }
}
