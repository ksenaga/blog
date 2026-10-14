import { storage } from "@/lib/storage";

// アップロードした画像を返す（STORAGE_DRIVER=local のときに使う）
// 本番で S3 を使う場合は、画像は S3・CDN から直接配信する
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const storageKey = key.join("/");

  // 保存する画像は全て WebP
  if (!storageKey.endsWith(".webp")) {
    return new Response(null, { status: 404 });
  }

  let body: Buffer | null;
  try {
    body = await storage.get(storageKey);
  } catch {
    return new Response(null, { status: 404 });
  }
  if (!body) {
    return new Response(null, { status: 404 });
  }

  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": "image/webp",
      // storage_key はアップロードごとに一意のため、長くキャッシュしてよい
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
