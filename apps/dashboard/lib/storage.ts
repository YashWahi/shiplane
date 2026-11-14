import * as Minio from "minio";

const endpoint = process.env.MINIO_ENDPOINT || "localhost";
const port = parseInt(process.env.MINIO_PORT || "9000", 10);
const useSSL = process.env.MINIO_USE_SSL === "true";
const accessKey = process.env.MINIO_ACCESS_KEY || "minioadmin";
const secretKey = process.env.MINIO_SECRET_KEY || "minioadmin";

export const minioClient = new Minio.Client({
  endPoint: endpoint,
  port: port,
  useSSL: useSSL,
  accessKey: accessKey,
  secretKey: secretKey,
});

export const DEFAULT_BUCKET = "nebula-deployments";

/**
 * Ensures the specified MinIO bucket exists, creating it if necessary.
 */
export async function ensureBucket(bucketName: string = DEFAULT_BUCKET): Promise<void> {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, "us-east-1");
      console.log(`[Storage] Bucket '${bucketName}' created successfully`);
    }
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error(`[Storage] Error checking or creating bucket '${bucketName}':`, err);
    throw new Error(`Failed to ensure storage bucket: ${err}`);
  }
}

/**
 * Uploads a buffer to MinIO storage.
 */
export async function uploadBuffer(
  objectKey: string,
  buffer: Buffer,
  contentType: string = "application/gzip",
  bucketName: string = DEFAULT_BUCKET
): Promise<string> {
  await ensureBucket(bucketName);
  try {
    await minioClient.putObject(bucketName, objectKey, buffer, buffer.length, {
      "Content-Type": contentType,
    });
    return objectKey;
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error(`[Storage] Error uploading object '${objectKey}':`, err);
    throw new Error(`Failed to upload archive to storage: ${err}`);
  }
}

/**
 * Retrieves an object stream from MinIO storage.
 */
export async function getObjectStream(
  objectKey: string,
  bucketName: string = DEFAULT_BUCKET
) {
  try {
    return await minioClient.getObject(bucketName, objectKey);
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error(`[Storage] Error retrieving object '${objectKey}':`, err);
    throw new Error(`Failed to retrieve object from storage: ${err}`);
  }
}

/**
 * Deletes an object from MinIO storage.
 */
export async function deleteObject(
  objectKey: string,
  bucketName: string = DEFAULT_BUCKET
): Promise<void> {
  try {
    await minioClient.removeObject(bucketName, objectKey);
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error(`[Storage] Error deleting object '${objectKey}':`, err);
  }
}

