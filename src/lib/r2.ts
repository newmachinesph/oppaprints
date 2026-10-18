import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";

// Server-only. R2 credentials must never reach the client.
const endpoint = process.env.R2_ENDPOINT!;
const bucket = process.env.R2_BUCKET!;

export const R2_BUCKET = bucket;

// Objects are namespaced under this prefix inside the (shared) bucket.
export const KEY_PREFIX = process.env.R2_PREFIX || "";
export const withPrefix = (k: string): string =>
  KEY_PREFIX ? `${KEY_PREFIX}/${k}` : k;

export const r2 = new S3Client({
  region: "auto",
  endpoint,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function ensureBucket(): Promise<void> {
  try {
    await r2.send(new CreateBucketCommand({ Bucket: bucket }));
    console.log(`created bucket ${bucket}`);
  } catch (e: unknown) {
    // Already exists → fine. Perms may block create even when the bucket
    // exists; don't block the run — putObject surfaces a real missing bucket.
    const name = (e as { name?: string })?.name ?? "unknown";
    console.log(`ensureBucket: ${name} (continuing)`);
  }
}

export async function putObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<void> {
  await r2.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function getObject(
  key: string,
): Promise<{ body: Buffer; contentType: string } | null> {
  try {
    const res = await r2.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    const bytes = await res.Body!.transformToByteArray();
    return {
      body: Buffer.from(bytes),
      contentType: res.ContentType ?? "application/octet-stream",
    };
  } catch (e: unknown) {
    if ((e as { name?: string })?.name === "NoSuchKey") return null;
    throw e;
  }
}

export async function deleteObject(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
