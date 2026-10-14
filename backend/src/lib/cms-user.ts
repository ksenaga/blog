// 管理側のユーザーの共通処理（APIdesign.md 6章）
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { errorResponse } from "@/lib/api";
import { avatarUrl } from "@/lib/avatar";
import { forbiddenResponse, type AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Tx = Prisma.TransactionClient;

export const nameSchema = z.string().trim().min(1).max(50);
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email()).pipe(z.string().max(255));
export const passwordSchema = z
  .string()
  .min(8, "パスワードは8文字以上で入力してください")
  .max(72, "パスワードは72文字以内で入力してください")
  .regex(/[A-Za-z]/, "英字を1文字以上含めてください")
  .regex(/[0-9]/, "数字を1文字以上含めてください");
export const roleSchema = z.enum(["admin", "user"]);

export const BCRYPT_ROUNDS = 10;

const userInclude = {
  _count: { select: { blogs: { where: { deletedAt: null } } } },
} satisfies Prisma.UserInclude;

type UserWithCount = Prisma.UserGetPayload<{ include: typeof userInclude }>;

// ユーザーオブジェクト（APIdesign.md 6-1）
export function serializeUser(user: UserWithCount) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar_url: avatarUrl(user.avatarStorageKey),
    blog_count: user._count.blogs,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}

export async function findUserForResponse(id: number) {
  return prisma.user.findUniqueOrThrow({ where: { id }, include: userInclude });
}

export { userInclude };

// 削除されていないユーザーを取得し、権限を確認する（管理者は全員、ユーザーは自分のみ）
export async function loadUser(id: number, actor: AuthUser) {
  if (!Number.isInteger(id) || id <= 0) return userNotFound();
  if (actor.role !== "admin" && actor.id !== id) return forbiddenResponse();
  const user = await prisma.user.findFirst({ where: { id, deletedAt: null }, include: userInclude });
  return user ?? userNotFound();
}

export function userNotFound() {
  return errorResponse(404, "NOT_FOUND", "ユーザーが見つかりません");
}

export function lastAdminError() {
  return errorResponse(409, "LAST_ADMIN", "最後の管理者は削除・変更できません");
}

// 対象の管理者を除いても管理者が残るか。同時に操作されても数え間違えないよう、管理者の行をロックする
export async function hasOtherAdmin(tx: Tx, userId: number) {
  const admins = await tx.$queryRaw<{ id: number }[]>`
    SELECT id FROM users WHERE role = 'admin' AND deleted_at IS NULL FOR UPDATE
  `;
  return admins.some((admin) => admin.id !== userId);
}

// メールアドレスが他のユーザーに使われていないか
export async function emailTaken(email: string, exceptUserId?: number) {
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null, ...(exceptUserId && { id: { not: exceptUserId } }) },
  });
  return !!user;
}
