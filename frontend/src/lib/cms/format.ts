import type { BlogStatus } from "@/lib/cms/types";

// 管理側の日時：2026/10/14 10:00（screendesign.md 1-3）
const dateTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Tokyo",
});

export function formatDateTime(value: string | null | undefined) {
  return value ? dateTimeFormatter.format(new Date(value)) : "-";
}

// ステータスの表示（screendesign.md 1-4）
export const STATUS_META: Record<
  BlogStatus | "deleted",
  { label: string; color: "default" | "info" | "success" | "warning" | "error" }
> = {
  draft: { label: "下書き", color: "default" },
  scheduled: { label: "公開予定", color: "info" },
  public: { label: "公開中", color: "success" },
  private: { label: "非公開", color: "warning" },
  deleted: { label: "削除済み", color: "error" },
};

// <input type="datetime-local"> の値（ブラウザのタイムゾーン）
export function toDateTimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// ランダムな初期パスワード（英字と数字を必ず含む12文字）
export function generatePassword() {
  const letters = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
  const digits = "23456789";
  const all = letters + digits;
  const random = (chars: string) => chars[crypto.getRandomValues(new Uint32Array(1))[0] % chars.length];
  const chars = [random(letters), random(digits), ...Array.from({ length: 10 }, () => random(all))];
  return chars.sort(() => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32 - 0.5).join("");
}
