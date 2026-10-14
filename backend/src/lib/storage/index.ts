// 画像の保存先の窓口（requirements.md 11-4）
// STORAGE_DRIVER で保存先を切り替える。DB には storage_key だけを保存する。
import { LocalStorage } from "./local";

export interface Storage {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
}

function createStorage(): Storage {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  switch (driver) {
    case "local":
      return new LocalStorage(process.env.LOCAL_STORAGE_DIR ?? "./storage");
    // TODO: 本番用の S3 ドライバ（STORAGE_DRIVER=s3）
    default:
      throw new Error(`未対応の STORAGE_DRIVER です: ${driver}`);
  }
}

export const storage = createStorage();

// 画像URL = IMAGE_BASE_URL + storage_key
export function imageUrl(key: string) {
  const base = (process.env.IMAGE_BASE_URL ?? "/uploads").replace(/\/$/, "");
  return `${base}/${key}`;
}
