import { requireServerEnv } from "@/lib/runtime/config"
import { S3ObjectStorage } from "@/lib/storage/s3"
import type { ObjectStorage } from "@/lib/storage/types"
import { requireCurrentIdentity } from "@/lib/auth/server"
import { withRequestContext } from "@/lib/db/pool"

let s3Storage: S3ObjectStorage | undefined

/**
 * Server-only object storage boundary. Objects are private S3 objects and
 * signed URLs are created by the AWS SDK; no provider fallback is retained.
 */
export async function getObjectStorage(): Promise<ObjectStorage> {
    if (!s3Storage) {
        s3Storage = new S3ObjectStorage({
            region: requireServerEnv("AWS_REGION"),
            endpoint: process.env.MRJIM_S3_ENDPOINT?.trim() || undefined,
            roleArn: process.env.MRJIM_STORAGE_ROLE_ARN?.trim() || undefined,
        })
    }

    return s3Storage
}

export function getEvidenceBucket(): string {
    return requireServerEnv("MRJIM_S3_BUCKET")
}

/** Enforce the existing row-level evidence policy before issuing a bearer URL. */
export async function getAuthorizedEvidenceUrl(storagePath: string): Promise<string> {
    const identity = await requireCurrentIdentity()
    const allowed = await withRequestContext({ userId: identity.id }, async (client) => {
        const result = await client.query<{ allowed: boolean }>(
            `SELECT EXISTS(SELECT 1 FROM public.report_evidence WHERE storage_path = $1)
                 OR EXISTS(SELECT 1 FROM public.dispute_evidence WHERE storage_path = $1) AS allowed`,
            [storagePath],
        )
        return result.rows[0]?.allowed === true
    })
    if (!allowed) throw new Error("Evidence is not available to this account")
    return (await getObjectStorage()).createSignedDownloadUrl(getEvidenceBucket(), storagePath, 900)
}
