// ユーザーのアイコン画像
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { imageUrl, storage } from "@/lib/storage";

export const AVATAR_SIZE = 256;
const ALLOWED_FORMATS = new Set(["png", "jpeg", "webp"]);

export function avatarUrl(storageKey: string | null | undefined) {
  return storageKey ? imageUrl(storageKey) : null;
}

// 画像を正方形に切り抜いて WebP に変換する。EXIF（位置情報など）は削除される
// 画像として読めない・形式が違う場合は null を返す
export async function processAvatar(input: Buffer) {
  const metadata = await sharp(input).metadata().catch(() => null);
  if (!metadata?.format || !ALLOWED_FORMATS.has(metadata.format)) return null;
  return sharp(input)
    .rotate()
    .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover", position: "attention" })
    .webp({ quality: 85 })
    .toBuffer();
}

export async function saveAvatar(userId: number, data: Buffer) {
  const storageKey = `avatars/${userId}/${randomUUID()}.webp`;
  await storage.put(storageKey, data, "image/webp");
  return storageKey;
}

// 古いアイコン画像を削除する（失敗しても処理は続ける）
export async function deleteAvatarFile(storageKey: string | null) {
  if (!storageKey) return;
  await storage.delete(storageKey).catch(() => undefined);
}
