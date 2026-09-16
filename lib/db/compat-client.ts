import type { SupabaseClient } from "@supabase/supabase-js"
import { getCurrentIdentity } from "@/lib/auth/server"
import { toClientAuthUser } from "@/lib/auth/mrjim-auth"
import { withRequestContext, type DatabaseRequestContext } from "@/lib/db/pool"

type Row = Record<string, unknown>
type QueryResponse<T = unknown> = {
    data: T | null
    error: { message: string } | null
    count?: number | null
}

type SelectOptions = {
    count?: "exact" | "planned" | "estimated"
    head?: boolean
}

type OrderOptions = {
    ascending?: boolean
    nullsFirst?: boolean
}

type SelectNode =
    | { kind: "column"; name: string }
    | { kind: "relation"; alias: string; table: string; columns: SelectNode[]; many: boolean; localKey: string; foreignKey: string }

type Filter = {
    column: string
    operator: string
    value: unknown
}

type QueryOperation = "select" | "insert" | "update" | "delete"

const IDENTIFIER = /^[a-z_][a-z0-9_]*$/u

// This is an intentionally closed table boundary. The migrated application
// may only address the tables and views that were copied into the RenterCheck
// database; it cannot turn the compatibility client into arbitrary SQL.
const TABLE_ALIASES: Record<string, string> = {
    disputes: "incident_disputes",
}

const ALLOWED_TABLES = new Set([
    "admin_pending_amendments",
    "admin_pending_reports",
    "admin_stats",
    "admin_users",
    "credit_action_costs",
    "credit_transactions",
    "credit_wallets",
    "dispute_evidence",
    "incident_disputes",
    "incident_reports",
    "my_reports",
    "public_incident_summaries",
    "public_renter_profiles",
    "report_admin_actions",
    "report_amendments",
    "report_edits",
    "report_evidence",
    "report_group_members",
    "report_groups",
    "report_identifiers",
    "report_info_requests",
    "renter_identifiers",
    "renters",
    "search_access_logs",
    "users",
])

const RPC_ARGUMENTS: Record<string, string[]> = {
    admin_adjust_credits: ["p_user_id", "p_amount", "p_description"],
    consume_credits: ["p_amount", "p_description", "p_reference_id", "p_type"],
    find_renter_matches: ["p_phone", "p_email", "p_facebook", "p_name"],
    generate_renter_fingerprint: ["p_name", "p_identifiers"],
    get_admin_role: ["user_id"],
    is_admin: ["user_id"],
    perform_cost_deduction: ["p_user_id", "p_action_key", "p_cost", "p_ref_id"],
    refill_credits: ["p_amount", "p_description"],
}

const RELATIONS: Record<string, Record<string, Omit<Extract<SelectNode, { kind: "relation" }>, "kind" | "alias" | "columns">>> = {
    incident_disputes: {
        report: { table: "incident_reports", many: false, localKey: "report_id", foreignKey: "id" },
        disputer: { table: "users", many: false, localKey: "disputer_id", foreignKey: "id" },
        evidence: { table: "dispute_evidence", many: true, localKey: "id", foreignKey: "dispute_id" },
    },
    incident_reports: {
        renter: { table: "renters", many: false, localKey: "renter_id", foreignKey: "id" },
    },
    report_edits: {
        edited_by_email: { table: "admin_users", many: false, localKey: "edited_by", foreignKey: "id" },
    },
}

function tableName(input: string): string {
    const requested = input.trim()
    if (!IDENTIFIER.test(requested)) throw new Error("Invalid migrated table name")
    const table = TABLE_ALIASES[requested] ?? requested
    if (!ALLOWED_TABLES.has(table)) throw new Error("Table is outside the migrated application boundary")
    return table
}

function columnName(input: string): string {
    const column = input.trim()
    if (!IDENTIFIER.test(column)) throw new Error("Invalid migrated column name")
    return column
}

function quoteIdentifier(input: string): string {
    return `"${input.replaceAll('"', '""')}"`
}

function splitTopLevel(input: string): string[] {
    const result: string[] = []
    let start = 0
    let depth = 0
    let quote: string | null = null

    for (let index = 0; index < input.length; index += 1) {
        const char = input[index]
        if (quote) {
            if (char === quote && input[index - 1] !== "\\") quote = null
            continue
        }
        if (char === '"' || char === "'") {
            quote = char
            continue
        }
        if (char === "(") depth += 1
        if (char === ")") depth -= 1
        if (char === "," && depth === 0) {
            result.push(input.slice(start, index).trim())
            start = index + 1
        }
    }

    const tail = input.slice(start).trim()
    if (tail) result.push(tail)
    return result
}

function parseSelect(input: string, parentTable: string): SelectNode[] {
    const nodes: SelectNode[] = []
    for (const item of splitTopLevel(input.replace(/\s+/gu, " ").trim())) {
        if (item === "*") {
            nodes.push({ kind: "column", name: "*" })
            continue
        }

        const relationMatch = item.match(/^([a-z_][a-z0-9_]*)\s*:\s*([a-z_][a-z0-9_]*)(?:![a-z_][a-z0-9_]*)?\s*\((.*)\)$/u)
        if (relationMatch) {
            const [, alias, relationTable, relationColumns] = relationMatch
            const relation = RELATIONS[parentTable]?.[alias]
            if (!relation || relation.table !== relationTable) {
                throw new Error(`Unsupported migrated relation: ${parentTable}.${alias}`)
            }
            nodes.push({
                kind: "relation",
                alias,
                table: relationTable,
                columns: parseSelect(relationColumns, relationTable),
                many: relation.many,
                localKey: relation.localKey,
                foreignKey: relation.foreignKey,
            })
            continue
        }

        // Supabase's select grammar also permits an alias for a scalar
        // column. No current RenterCheck action uses it, but accepting it here
        // keeps the parser explicit and safe.
        const scalar = item.match(/^(?:[a-z_][a-z0-9_]*\s*:\s*)?([a-z_][a-z0-9_]*)$/u)
        if (!scalar) throw new Error("Unsupported migrated select expression")
        nodes.push({ kind: "column", name: scalar[1] })
    }
    return nodes.length ? nodes : [{ kind: "column", name: "*" }]
}

function baseColumns(nodes: SelectNode[]): string {
    if (nodes.some((node) => node.kind === "column" && node.name === "*")) return "*"
    return nodes
        .filter((node): node is Extract<SelectNode, { kind: "column" }> => node.kind === "column")
        .map((node) => quoteIdentifier(columnName(node.name)))
        .join(", ") || "*"
}

function responseError(error: unknown): { message: string } {
    if (error instanceof Error && error.message) return { message: error.message }
    return { message: "Database operation failed" }
}

function isMissing(value: unknown): boolean {
    return value === null || value === undefined || value === "null"
}

function parseOrExpression(expression: string): Filter[] {
    return splitTopLevel(expression).map((part) => {
        const match = part.match(/^([a-z_][a-z0-9_]*)\.(eq|neq|gt|gte|lt|lte|like|ilike|is)\.(.*)$/u)
        if (!match) throw new Error("Unsupported OR filter")
        const [, column, operator, rawValue] = match
        return { column, operator, value: rawValue === "null" ? null : rawValue }
    })
}

function addFilter(filters: Filter[], column: string, operator: string, value: unknown): void {
    filters.push({ column: columnName(column), operator, value })
}

function operatorSql(filter: Filter, values: unknown[]): string {
    const column = quoteIdentifier(columnName(filter.column))
    const operator = filter.operator.toLowerCase()

    if (operator === "is" || operator === "is_not") {
        if (filter.value === null || filter.value === "null") return `${column} ${operator === "is_not" ? "IS NOT" : "IS"} NULL`
        if (filter.value === true || filter.value === "true") return `${column} ${operator === "is_not" ? "IS NOT" : "IS"} TRUE`
        if (filter.value === false || filter.value === "false") return `${column} ${operator === "is_not" ? "IS NOT" : "IS"} FALSE`
        throw new Error("IS filters only support null and boolean values")
    }

    if (operator === "in") {
        const items = Array.isArray(filter.value) ? filter.value : []
        if (!items.length) return "FALSE"
        const placeholders = items.map((item) => {
            values.push(item)
            return `$${values.length}`
        })
        return `${column} IN (${placeholders.join(", ")})`
    }

    const sqlOperator: Record<string, string> = {
        eq: "=",
        neq: "<>",
        gt: ">",
        gte: ">=",
        lt: "<",
        lte: "<=",
        like: "LIKE",
        ilike: "ILIKE",
    }
    const sql = sqlOperator[operator]
    if (!sql) throw new Error("Unsupported migrated filter operator")
    values.push(filter.value)
    return `${column} ${sql} $${values.length}`
}

function buildWhere(filters: Filter[], orGroups: Filter[][], values: unknown[]): string {
    const expressions = filters.map((filter) => operatorSql(filter, values))
    for (const group of orGroups) {
        const alternatives = group.map((filter) => operatorSql(filter, values))
        expressions.push(`(${alternatives.join(" OR ")})`)
    }
    return expressions.length ? ` WHERE ${expressions.join(" AND ")}` : ""
}

function buildRow(row: Row, nodes: SelectNode[]): Row {
    if (nodes.some((node) => node.kind === "column" && node.name === "*")) return { ...row }
    const selected: Row = {}
    for (const node of nodes) {
        if (node.kind === "column") selected[node.name] = row[node.name]
    }
    return selected
}

async function attachRelations(client: { query: (text: string, values?: unknown[]) => Promise<{ rows: Row[] }> }, rows: Row[], nodes: SelectNode[]): Promise<Row[]> {
    const relations = nodes.filter((node): node is Extract<SelectNode, { kind: "relation" }> => node.kind === "relation")
    if (!relations.length || !rows.length) return rows

    for (const relation of relations) {
        const keys = [...new Set(rows.map((row) => row[relation.localKey]).filter((value) => value !== null && value !== undefined))]
        if (!keys.length) {
            for (const row of rows) row[relation.alias] = relation.many ? [] : null
            continue
        }

        const placeholders = keys.map((_, index) => `$${index + 1}`).join(", ")
        const result = await client.query(
            `SELECT * FROM public.${tableName(relation.table)} WHERE ${quoteIdentifier(relation.foreignKey)} IN (${placeholders})`,
            keys,
        )
        const grouped = new Map<string, Row[]>()
        for (const relatedRow of result.rows) {
            const key = String(relatedRow[relation.foreignKey])
            const list = grouped.get(key) ?? []
            list.push(buildRow(relatedRow, relation.columns))
            grouped.set(key, list)
        }
        for (const row of rows) {
            const related = grouped.get(String(row[relation.localKey])) ?? []
            row[relation.alias] = relation.many ? related : (related[0] ?? null)
        }
    }
    return rows
}

class MrJimQuery implements PromiseLike<QueryResponse<unknown>> {
    private operation: QueryOperation = "select"
    private selectNodes: SelectNode[] = [{ kind: "column", name: "*" }]
    private selectOptions: SelectOptions = {}
    private filters: Filter[] = []
    private orGroups: Filter[][] = []
    private orderBy: Array<{ column: string; options: OrderOptions }> = []
    private rowLimit: number | undefined
    private rowOffset: number | undefined
    private returnRows = false
    private singleMode: "single" | "maybeSingle" | null = null
    private values: Row | Row[] | null = null
    private rpcName: string | null = null
    private rpcArgs: Record<string, unknown> | null = null

    constructor(private readonly table: string, private readonly context: DatabaseRequestContext) {}

    select(columns = "*", options: SelectOptions = {}): this {
        this.selectNodes = parseSelect(columns, this.table)
        this.selectOptions = options
        this.returnRows = this.operation !== "select" || options.head !== true
        return this
    }

    insert(values: Row | Row[]): this {
        this.operation = "insert"
        this.values = values
        return this
    }

    update(values: Row): this {
        this.operation = "update"
        this.values = values
        return this
    }

    delete(): this {
        this.operation = "delete"
        return this
    }

    eq(column: string, value: unknown): this { addFilter(this.filters, column, "eq", value); return this }
    neq(column: string, value: unknown): this { addFilter(this.filters, column, "neq", value); return this }
    gt(column: string, value: unknown): this { addFilter(this.filters, column, "gt", value); return this }
    gte(column: string, value: unknown): this { addFilter(this.filters, column, "gte", value); return this }
    lt(column: string, value: unknown): this { addFilter(this.filters, column, "lt", value); return this }
    lte(column: string, value: unknown): this { addFilter(this.filters, column, "lte", value); return this }
    like(column: string, value: unknown): this { addFilter(this.filters, column, "like", value); return this }
    ilike(column: string, value: unknown): this { addFilter(this.filters, column, "ilike", value); return this }
    is(column: string, value: unknown): this { addFilter(this.filters, column, "is", value); return this }
    not(column: string, operator: string, value: unknown): this { addFilter(this.filters, column, operator === "is" ? "is_not" : `not_${operator}`, value); return this }
    in(column: string, values: unknown[]): this { addFilter(this.filters, column, "in", values); return this }
    or(expression: string): this { this.orGroups.push(parseOrExpression(expression)); return this }

    order(column: string, options: OrderOptions = {}): this {
        this.orderBy.push({ column: columnName(column), options })
        return this
    }

    limit(value: number): this { this.rowLimit = Math.max(0, Math.floor(value)); return this }

    range(from: number, to: number): this {
        this.rowOffset = Math.max(0, Math.floor(from))
        this.rowLimit = Math.max(0, Math.floor(to - from + 1))
        return this
    }

    single(): this { this.singleMode = "single"; return this }
    maybeSingle(): this { this.singleMode = "maybeSingle"; return this }

    async execute(): Promise<QueryResponse<unknown>> {
        try {
            return await withRequestContext(this.context, async (client) => {
                if (this.rpcName) return this.executeRpc(client)
                if (this.operation === "select") return this.executeSelect(client)
                return this.executeMutation(client)
            })
        } catch (error) {
            return { data: null, error: responseError(error), count: null }
        }
    }

    then<TResult1 = QueryResponse<unknown>, TResult2 = never>(
        onfulfilled?: ((value: QueryResponse<unknown>) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): Promise<TResult1 | TResult2> {
        return this.execute().then(onfulfilled, onrejected)
    }

    private async executeSelect(client: { query: (text: string, values?: unknown[]) => Promise<{ rows: Row[] }> }): Promise<QueryResponse<unknown>> {
        const values: unknown[] = []
        const where = buildWhere(this.filters, this.orGroups, values)
        const order = this.orderBy.length
            ? ` ORDER BY ${this.orderBy.map(({ column, options }) => `${quoteIdentifier(column)} ${options.ascending === false ? "DESC" : "ASC"}${options.nullsFirst === true ? " NULLS FIRST" : options.nullsFirst === false ? " NULLS LAST" : ""}`).join(", ")}`
            : ""
        const offset = this.rowOffset ? ` OFFSET ${this.rowOffset}` : ""
        const limit = this.rowLimit === undefined ? "" : ` LIMIT ${this.rowLimit}`
        const needsCount = Boolean(this.selectOptions.count)
        const selectList = baseColumns(this.selectNodes)

        let count: number | null = null
        if (needsCount) {
            const countResult = await client.query(`SELECT count(*)::int AS count FROM public.${this.table}${where}`, values)
            count = Number(countResult.rows[0]?.count ?? 0)
        }
        if (this.selectOptions.head) return { data: null, error: null, count }

        const result = await client.query(`SELECT ${selectList} FROM public.${this.table}${where}${order}${limit}${offset}`, values)
        let rows = result.rows.map((row) => buildRow(row, this.selectNodes))
        rows = await attachRelations(client, rows, this.selectNodes)

        if (this.singleMode === "single" && rows.length !== 1) {
            return { data: null, error: { message: rows.length === 0 ? "JSON object requested, multiple (or no) rows returned" : "JSON object requested, multiple (or no) rows returned" }, count }
        }
        if (this.singleMode === "maybeSingle" && rows.length > 1) {
            return { data: null, error: { message: "JSON object requested, multiple (or no) rows returned" }, count }
        }
        return { data: this.singleMode ? (rows[0] ?? null) : rows, error: null, count }
    }

    private async executeMutation(client: { query: (text: string, values?: unknown[]) => Promise<{ rows: Row[] }> }): Promise<QueryResponse<unknown>> {
        const values: unknown[] = []
        const where = buildWhere(this.filters, this.orGroups, values)
        const returning = this.returnRows ? ` RETURNING ${baseColumns(this.selectNodes)}` : ""
        let result: { rows: Row[] }

        if (this.operation === "insert") {
            const records = Array.isArray(this.values) ? this.values : [this.values ?? {}]
            if (!records.length) return { data: [], error: null }
            const keys = Object.keys(records[0]).filter((key) => records.some((record) => record[key] !== undefined)).map(columnName)
            if (!keys.length) throw new Error("Insert requires at least one column")
            const tuples = records.map((record) => `(${keys.map((key) => {
                values.push(record[key] === undefined ? null : record[key])
                return `$${values.length}`
            }).join(", ")})`).join(", ")
            result = await client.query(`INSERT INTO public.${this.table} (${keys.map(quoteIdentifier).join(", ")}) VALUES ${tuples}${returning}`, values)
        } else if (this.operation === "update") {
            const updates = Object.entries(this.values ?? {}).filter(([, value]) => value !== undefined)
            if (!updates.length) throw new Error("Update requires at least one column")
            const assignments = updates.map(([key, value]) => {
                values.push(value)
                return `${quoteIdentifier(columnName(key))} = $${values.length}`
            })
            result = await client.query(`UPDATE public.${this.table} SET ${assignments.join(", ")}${where}${returning}`, values)
        } else {
            result = await client.query(`DELETE FROM public.${this.table}${where}${returning}`, values)
        }

        if (!this.returnRows) return { data: null, error: null }
        const rows = result.rows.map((row) => buildRow(row, this.selectNodes))
        if (this.singleMode === "single" && rows.length !== 1) {
            return { data: null, error: { message: "JSON object requested, multiple (or no) rows returned" }, count: null }
        }
        if (this.singleMode === "maybeSingle" && rows.length > 1) {
            return { data: null, error: { message: "JSON object requested, multiple (or no) rows returned" }, count: null }
        }
        return { data: this.singleMode ? (rows[0] ?? null) : rows, error: null, count: null }
    }

    private async executeRpc(client: { query: (text: string, values?: unknown[]) => Promise<{ rows: Row[] }> }): Promise<QueryResponse<unknown>> {
        const name = this.rpcName
        if (!name || !RPC_ARGUMENTS[name]) throw new Error("RPC is outside the migrated application boundary")
        const args = RPC_ARGUMENTS[name].map((key) => this.rpcArgs?.[key] ?? null)
        const placeholders = args.map((_, index) => `$${index + 1}`).join(", ")
        const result = await client.query(`SELECT * FROM public.${name}(${placeholders})`, args)
        if (name === "find_renter_matches") return { data: result.rows, error: null }
        return { data: result.rows[0] ? Object.values(result.rows[0])[0] : null, error: null }
    }

    setRpc(name: string, args: Record<string, unknown>): this {
        this.rpcName = name
        this.rpcArgs = args
        return this
    }
}

function createAuth(identity: Awaited<ReturnType<typeof getCurrentIdentity>>) {
    const user = identity ? toClientAuthUser(identity) : null
    return {
        async getUser() {
            return { data: { user }, error: null }
        },
        async getSession() {
            return { data: { session: null }, error: null }
        },
        async signOut() {
            return { error: null }
        },
        admin: {
            async getUserById(id: string) {
                const result = await withRequestContext(
                    { userId: identity?.id ?? null, role: identity ? "authenticated" : "anon" },
                    (client) => client.query<Row>("SELECT id, email, full_name, avatar_url FROM public.users WHERE id = $1::uuid", [id]),
                )
                const row = result.rows[0]
                return {
                    data: { user: row ? { id: row.id, email: row.email, user_metadata: { full_name: row.full_name, avatar_url: row.avatar_url }, app_metadata: {} } : null },
                    error: null,
                }
            },
        },
    }
}

/**
 * The existing server actions use a reviewed, Supabase-shaped query grammar
 * at this single compatibility boundary. The implementation is closed over
 * the allowlisted RDS tables, relations, and RPCs below; it never calls
 * Supabase or accepts arbitrary SQL. The type-only client import preserves
 * existing action inference without adding a provider transport.
 */
export async function createMrJimCompatClient(): Promise<SupabaseClient> {
    const identity = await getCurrentIdentity()
    const context: DatabaseRequestContext = {
        userId: identity?.id ?? null,
        role: identity ? "authenticated" : "anon",
    }
    const client = {
        from(table: string) {
            return new MrJimQuery(tableName(table), context)
        },
        rpc(name: string, args: Record<string, unknown> = {}) {
            return new MrJimQuery("users", context).setRpc(name, args)
        },
        auth: createAuth(identity),
    }
    return client as unknown as SupabaseClient
}
