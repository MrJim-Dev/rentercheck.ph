export interface PutObjectInput {
    bucket: string
    key: string
    body: Uint8Array
    contentType?: string
    cacheControl?: string
}

export interface ObjectStorage {
    putObject(input: PutObjectInput): Promise<void>
    deleteObjects(bucket: string, keys: string[]): Promise<void>
    createSignedDownloadUrl(bucket: string, key: string, expiresInSeconds: number): Promise<string>
}
