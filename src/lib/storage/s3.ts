import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";

const s3Bucket = process.env.S3_BUCKET || "trippygo-itineraries-dev";
const s3Region = process.env.S3_REGION || "ap-south-1";
const s3Endpoint = process.env.S3_ENDPOINT || undefined;

let s3Client: S3Client | null = null;
let publicS3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: s3Region,
      endpoint: s3Endpoint,
      forcePathStyle: !!s3Endpoint, // Required for MinIO / LocalStack
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "minioadmin",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "minioadmin",
      },
    });
  }
  return s3Client;
}

function getPublicS3Client(): S3Client {
  const publicEndpoint = process.env.S3_PUBLIC_ENDPOINT || s3Endpoint;
  if (!publicS3Client) {
    publicS3Client = new S3Client({
      region: s3Region,
      endpoint: publicEndpoint,
      forcePathStyle: !!publicEndpoint,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "minioadmin",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "minioadmin",
      },
    });
  }
  return publicS3Client;
}

export interface UploadOptions {
  key: string;
  data: Buffer | Uint8Array | string;
  contentType: string;
  isPrivate?: boolean;
}

/**
 * Upload a raw file to S3 bucket with local disk fallback
 */
export async function uploadToStorage(options: UploadOptions): Promise<{ key: string; s3Url?: string }> {
  const { key, data, contentType } = options;
  const buffer = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);

  // Attempt S3 / MinIO upload if configured
  try {
    const client = getS3Client();
    const command = new PutObjectCommand({
      Bucket: s3Bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });
    await client.send(command);
    return { key, s3Url: `s3://${s3Bucket}/${key}` };
  } catch (err) {
    // Graceful fallback to local disk storage for dev/offline mode
    console.warn(
      `[Storage] S3 upload failed or offline. Falling back to local disk storage for ${key}:`,
      (err as Error).message
    );
    const localDir = path.join(process.cwd(), ".uploads");
    const filePath = path.join(localDir, key);
    const fileFolder = path.dirname(filePath);

    if (!fs.existsSync(fileFolder)) {
      fs.mkdirSync(fileFolder, { recursive: true });
    }
    fs.writeFileSync(filePath, buffer);
    return { key, s3Url: `file://${filePath}` };
  }
}

/**
 * Helper to upload rendered PDF documents
 */
export async function uploadPdf(buffer: Buffer, key: string): Promise<{ key: string; s3Url?: string }> {
  return uploadToStorage({
    key,
    data: buffer,
    contentType: "application/pdf",
    isPrivate: true,
  });
}

/**
 * Helper to upload source supplier files
 */
export async function uploadSourceFile(
  buffer: Buffer,
  key: string,
  contentType: string = "application/pdf"
): Promise<{ key: string; s3Url?: string }> {
  return uploadToStorage({
    key,
    data: buffer,
    contentType,
    isPrivate: true,
  });
}

/**
 * Generate a pre-signed S3 download URL (default 1-hour expiry) with local file fallback
 */
export async function getPresignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  let localFilePath = path.join(process.cwd(), ".uploads", key);
  if (!fs.existsSync(localFilePath)) {
    const dir = path.dirname(localFilePath);
    const base = path.basename(localFilePath);
    if (fs.existsSync(dir)) {
      const match = base.match(/^v_(\d+\.pdf)$/);
      if (match) {
        const found = fs.readdirSync(dir).find((f) => f.endsWith(`_${match[1]}`));
        if (found) {
          localFilePath = path.join(dir, found);
          key = path.relative(path.join(process.cwd(), ".uploads"), localFilePath).replace(/\\/g, "/");
        }
      }
    }
  }

  if (fs.existsSync(localFilePath)) {
    return `/api/storage/download?key=${encodeURIComponent(key)}`;
  }

  try {
    const client = getPublicS3Client();
    const command = new GetObjectCommand({
      Bucket: s3Bucket,
      Key: key,
    });
    return await getSignedUrl(client, command, { expiresIn });
  } catch (err) {
    // Return relative API download endpoint for local file store
    return `/api/storage/download?key=${encodeURIComponent(key)}`;
  }
}
