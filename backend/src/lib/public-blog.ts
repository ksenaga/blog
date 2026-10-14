// 閲覧側に公開するブログの条件（APIdesign.md 3章・DBdesign.md 5-2）
import type { Prisma } from "@/generated/prisma/client";
import { imageUrl } from "@/lib/storage";

// 公開中：status = public、または公開日時を過ぎた公開予定。削除済みは除く
export function publicBlogWhere(now = new Date()): Prisma.BlogWhereInput {
  return {
    deletedAt: null,
    OR: [
      { status: "public" },
      { status: "scheduled", publishedAt: { lte: now } },
    ],
  };
}

export function isPubliclyVisible(
  blog: { status: string; publishedAt: Date | null; deletedAt: Date | null },
  now = new Date(),
) {
  if (blog.deletedAt) return false;
  if (blog.status === "public") return true;
  return blog.status === "scheduled" && !!blog.publishedAt && blog.publishedAt <= now;
}

export function thumbnailUrl(thumbnail: { storageKey: string } | null) {
  return thumbnail ? imageUrl(thumbnail.storageKey) : null;
}
