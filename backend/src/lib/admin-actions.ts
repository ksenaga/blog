// 管理者が他人のリソースを操作したときの操作ログと通知（APIdesign.md 5-6・7-4・8章）
import type { Prisma } from "@/generated/prisma/client";
import type { AuthUser } from "@/lib/auth";
import { clientInfo } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Tx = Prisma.TransactionClient;

export type NotificationType =
  | "blog_updated_by_admin"
  | "blog_status_changed_by_admin"
  | "blog_deleted_by_admin"
  | "blog_restored_by_admin"
  | "blog_images_changed_by_admin"
  | "password_reset_by_admin";

type Params = {
  actor: AuthUser;
  ownerId: number; // 操作されたリソースの持ち主（ブログの作者・ユーザー本人）
  action: string; // 例：blog.update
  targetType: "blog" | "user";
  targetId: number;
  changes?: Prisma.InputJsonValue;
  notification?: { type: NotificationType; message: string; blogId?: number };
  request: Request;
};

// 自分のリソースの操作なら何もしない
export async function recordAdminAction(params: Params, tx: Tx = prisma) {
  if (params.actor.id === params.ownerId) return;
  const { ipAddress, userAgent } = clientInfo(params.request);

  await tx.auditLog.create({
    data: {
      actorId: params.actor.id,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      changes: params.changes,
      ipAddress,
      userAgent,
    },
  });

  if (params.notification) {
    await tx.notification.create({
      data: {
        userId: params.ownerId,
        actorId: params.actor.id,
        blogId: params.notification.blogId ?? null,
        type: params.notification.type,
        message: params.notification.message.slice(0, 255),
      },
    });
  }
}

// 通知の文章に入れるブログのタイトル（長すぎる場合は省略する）
export function quoteTitle(title: string) {
  return `「${title.length > 60 ? `${title.slice(0, 60)}…` : title}」`;
}
