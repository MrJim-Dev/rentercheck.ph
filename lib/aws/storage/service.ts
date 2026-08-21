import "server-only";

import { S3Client } from "@aws-sdk/client-s3";
import { createS3StorageAdapter, type S3StorageAdapter } from "mrjim-auth/storage/s3";
import sharp from "sharp";

const MAX_OBJECT_BYTES = 10 * 1024 * 1024;
const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function configuredAdapter(): S3StorageAdapter {
  const bucket = process.env.S3_BUCKET?.trim();
  if (!bucket) throw new Error("S3_BUCKET is required");
  return createS3StorageAdapter({
    client: new S3Client({ region: process.env.AWS_REGION ?? "ap-southeast-1" }),
    buckets: { evidence: { bucket, prefix: process.env.S3_EVIDENCE_PREFIX ?? "evidence" } },
  });
}

function validateKey(key: string) {
  if (!key || key.length > 1024 || key.startsWith("/") || key.includes("\\") || /[\u0000-\u001f\u007f]/u.test(key)) throw new TypeError("Storage object key is malformed");
  if (key.split("/").some((segment) => !segment || segment === "." || segment === "..")) throw new TypeError("Storage object key is malformed");
  return key;
}

async function bytesOf(body: Uint8Array | ArrayBuffer | Blob) {
  if (body instanceof Uint8Array) return body;
  if (body instanceof ArrayBuffer) return new Uint8Array(body);
  return new Uint8Array(await body.arrayBuffer());
}

function derivativeKeys(key: string) {
  return [`${key}.display.webp`, `${key}.thumb.webp`];
}

async function uploadDisplayVariants(adapter: S3StorageAdapter, key: string, bytes: Uint8Array, contentType: string) {
  if (!IMAGE_MIME_TYPES.has(contentType)) return;
  const image = sharp(bytes, { failOn: "error" });
  const metadata = await image.metadata();
  if ((metadata.width ?? 0) > 12_000 || (metadata.height ?? 0) > 12_000) throw new RangeError("Image dimensions exceed the evidence limit");
  const display = await image.clone().rotate().resize({ width: 2200, height: 2200, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  const thumb = await image.clone().rotate().resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
  await adapter.upload({ bucket: "evidence", key: derivativeKeys(key)[0], body: display, contentLength: display.byteLength, contentType: "image/webp", cacheControl: "public, max-age=31536000, immutable", ifNoneMatch: "*" });
  await adapter.upload({ bucket: "evidence", key: derivativeKeys(key)[1], body: thumb, contentLength: thumb.byteLength, contentType: "image/webp", cacheControl: "public, max-age=31536000, immutable", ifNoneMatch: "*" });
}

export function createStorageCompatClient() {
  const adapter = configuredAdapter();
  return Object.freeze({
    from(alias: string) {
      if (alias !== "evidence") throw new TypeError("Storage bucket is not configured");
      return Object.freeze({
        async upload(path: string, body: Uint8Array | ArrayBuffer | Blob, options: { contentType?: string; cacheControl?: string; upsert?: boolean } = {}) {
          const key = validateKey(path);
          const bytes = await bytesOf(body);
          if (bytes.byteLength < 1 || bytes.byteLength > MAX_OBJECT_BYTES) throw new RangeError("Evidence file exceeds the 10 MB limit");
          const contentType = options.contentType || (body instanceof Blob ? body.type : "application/octet-stream") || "application/octet-stream";
          await adapter.upload({ bucket: "evidence", key, body: bytes, contentLength: bytes.byteLength, contentType, cacheControl: options.cacheControl || "public, max-age=3600", ...(options.upsert ? {} : { ifNoneMatch: "*" as const }) });
          try { await uploadDisplayVariants(adapter, key, bytes, contentType); } catch (error) {
            await adapter.remove({ bucket: "evidence", keys: [key] }).catch(() => undefined);
            throw error;
          }
          return { data: { path: key }, error: null };
        },
        async createSignedUrl(path: string, expiresIn: number) {
          const key = validateKey(path);
          const displayKey = derivativeKeys(key)[0];
          const displayExists = await adapter.exists({ bucket: "evidence", key: displayKey });
          const signedUrl = await adapter.createSignedReadUrl({ bucket: "evidence", key: displayExists ? displayKey : key, expiresIn });
          return { data: { signedUrl }, error: null };
        },
        async remove(paths: readonly string[]) {
          const keys = [...new Set(paths.flatMap((path) => { const key = validateKey(path); return [key, ...derivativeKeys(key)]; }))];
          const result = await adapter.remove({ bucket: "evidence", keys });
          if (result.errors.length) return { data: null, error: { message: result.errors.map((item) => item.message).join("; ") } };
          return { data: result.deleted, error: null };
        },
        async exists(path: string) { return { data: await adapter.exists({ bucket: "evidence", key: validateKey(path) }), error: null }; },
        async download(path: string) { const result = await adapter.download({ bucket: "evidence", key: validateKey(path), maxBytes: MAX_OBJECT_BYTES }); return { data: new Blob([result.bytes as BlobPart], { type: result.contentType }), error: null }; },
        async createSignedUploadUrl(path: string, options: { contentType: string; contentLength: number; checksumSha256: string; cacheControl?: string; expiresIn?: number }) { return { data: await adapter.createSignedUploadUrl({ bucket: "evidence", key: validateKey(path), contentType: options.contentType, contentLength: options.contentLength, checksumSha256: options.checksumSha256, cacheControl: options.cacheControl, expiresIn: options.expiresIn ?? 300 }), error: null }; },
        getPublicUrl(path: string) { return { data: { publicUrl: adapter.getPublicUrl({ bucket: "evidence", key: validateKey(path) }) }, error: null }; },
      });
    },
  });
}
