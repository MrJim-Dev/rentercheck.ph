import {
    DeleteObjectsCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider"
import type { ObjectStorage, PutObjectInput } from "@/lib/storage/types"

function assertStorageKey(key: string): void {
    if (!key || key.startsWith("/") || key.includes("\\") || key.split("/").some((part) => part === "..")) {
        throw new Error("Invalid object storage key")
    }
}

export interface S3StorageConfig {
    region: string
    endpoint?: string
    roleArn?: string
}

export class S3ObjectStorage implements ObjectStorage {
    private readonly client: S3Client

    constructor(config: S3StorageConfig) {
        this.client = new S3Client({
            region: config.region,
            ...(config.roleArn ? { credentials: awsCredentialsProvider({ roleArn: config.roleArn }) } : {}),
            ...(config.endpoint ? { endpoint: config.endpoint, forcePathStyle: true } : {}),
        })
    }

    async putObject(input: PutObjectInput): Promise<void> {
        assertStorageKey(input.key)
        await this.client.send(new PutObjectCommand({
            Bucket: input.bucket,
            Key: input.key,
            Body: input.body,
            ...(input.contentType ? { ContentType: input.contentType } : {}),
            ...(input.cacheControl ? { CacheControl: input.cacheControl } : {}),
        }))
    }

    async deleteObjects(bucket: string, keys: string[]): Promise<void> {
        if (!keys.length) return
        keys.forEach(assertStorageKey)

        for (let offset = 0; offset < keys.length; offset += 1_000) {
            const batch = keys.slice(offset, offset + 1_000)
            const result = await this.client.send(new DeleteObjectsCommand({
                Bucket: bucket,
                Delete: {
                    Objects: batch.map((Key) => ({ Key })),
                    Quiet: true,
                },
            }))
            if (result.Errors?.length) throw new Error("S3 object deletion was not fully successful")
        }
    }

    async createSignedDownloadUrl(bucket: string, key: string, expiresInSeconds: number): Promise<string> {
        assertStorageKey(key)
        const expiresIn = Math.max(1, Math.min(expiresInSeconds, 86_400))
        return getSignedUrl(
            this.client,
            new GetObjectCommand({ Bucket: bucket, Key: key }),
            { expiresIn },
        )
    }
}
