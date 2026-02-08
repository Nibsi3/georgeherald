import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "e02c769a6506c70f402644285cd691b8";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "georgeherald";

function getClient() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

function isR2Configured(): boolean {
  return !!(
    R2_ACCESS_KEY_ID &&
    R2_ACCESS_KEY_ID !== "YOUR_ACCESS_KEY_ID" &&
    R2_SECRET_ACCESS_KEY &&
    R2_SECRET_ACCESS_KEY !== "YOUR_SECRET_ACCESS_KEY"
  );
}

/**
 * Save a JSON object to R2 under the given key.
 */
async function putJSON(key: string, data: unknown): Promise<void> {
  if (!isR2Configured()) return;
  const s3 = getClient();
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: "application/json",
    })
  );
}

/**
 * Read a JSON object from R2 by key. Returns null if not found.
 */
async function getJSON<T = unknown>(key: string): Promise<T | null> {
  if (!isR2Configured()) return null;
  const s3 = getClient();
  try {
    const res = await s3.send(
      new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
    const body = await res.Body?.transformToString("utf-8");
    if (!body) return null;
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}

/**
 * Delete a JSON object from R2 by key.
 */
async function deleteJSON(key: string): Promise<void> {
  if (!isR2Configured()) return;
  const s3 = getClient();
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
  } catch {
    // Ignore delete errors
  }
}

// ── Article-specific helpers ──

const ARTICLES_INDEX_KEY = "data/articles.json";
const ARTICLE_DETAIL_PREFIX = "data/articles/";

/**
 * Save the full articles listing index to R2.
 */
export async function saveArticlesIndexToR2(articles: Record<string, unknown>[]): Promise<void> {
  await putJSON(ARTICLES_INDEX_KEY, articles);
}

/**
 * Load the full articles listing index from R2.
 */
export async function loadArticlesIndexFromR2(): Promise<Record<string, unknown>[] | null> {
  return getJSON<Record<string, unknown>[]>(ARTICLES_INDEX_KEY);
}

/**
 * Save an individual article detail file to R2.
 */
export async function saveArticleDetailToR2(slug: string, data: Record<string, unknown>): Promise<void> {
  await putJSON(`${ARTICLE_DETAIL_PREFIX}${slug}.json`, data);
}

/**
 * Load an individual article detail file from R2.
 */
export async function loadArticleDetailFromR2(slug: string): Promise<Record<string, unknown> | null> {
  return getJSON<Record<string, unknown>>(`${ARTICLE_DETAIL_PREFIX}${slug}.json`);
}

/**
 * Delete an individual article detail file from R2.
 */
export async function deleteArticleDetailFromR2(slug: string): Promise<void> {
  await deleteJSON(`${ARTICLE_DETAIL_PREFIX}${slug}.json`);
}
