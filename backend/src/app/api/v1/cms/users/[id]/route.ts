// U-3. ユーザー詳細 / U-4. ユーザー編集 / U-7. ユーザー削除
import { NextResponse } from "next/server";
import { z } from "zod";
import { fieldError, validationError } from "@/lib/api";
import { recordAdminAction } from "@/lib/admin-actions";
import {
  authenticate,
  clearRefreshCookie,
  forbiddenResponse,
  revokeAllRefreshTokens,
} from "@/lib/auth";
import {
  emailSchema,
  emailTaken,
  findUserForResponse,
  hasOtherAdmin,
  lastAdminError,
  loadUser,
  nameSchema,
  roleSchema,
  serializeUser,
} from "@/lib/cms-user";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  const actor = await authenticate(request);
  if (actor instanceof Response) return actor;

  const user = await loadUser(Number((await params).id), actor);
  if (user instanceof Response) return user;
  return Response.json({ data: serializeUser(user) });
}

const updateSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  role: roleSchema.optional(),
});

export async function PATCH(request: Request, { params }: Context) {
  const actor = await authenticate(request);
  if (actor instanceof Response) return actor;

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const { name, email, role } = parsed.data;

  const user = await loadUser(Number((await params).id), actor);
  if (user instanceof Response) return user;
  // ロールを変えられるのは管理者のみ
  if (role !== undefined && actor.role !== "admin") return forbiddenResponse();
  if (email && (await emailTaken(email, user.id))) {
    return fieldError("email", "このメールアドレスは既に使用されています");
  }

  const roleChanged = role !== undefined && role !== user.role;
  const result = await prisma.$transaction(async (tx) => {
    if (roleChanged && user.role === "admin" && !(await hasOtherAdmin(tx, user.id))) return "last_admin";

    await tx.user.update({
      where: { id: user.id },
      data: { ...(name !== undefined && { name }), ...(email !== undefined && { email }), ...(role !== undefined && { role }) },
    });
    await recordAdminAction(
      {
        actor,
        ownerId: user.id,
        action: "user.update",
        targetType: "user",
        targetId: user.id,
        changes: {
          ...(name !== undefined && name !== user.name && { name: { before: user.name, after: name } }),
          ...(email !== undefined && email !== user.email && { email: { before: user.email, after: email } }),
          ...(roleChanged && { role: { before: user.role, after: role } }),
        },
        request,
      },
      tx,
    );
    return "ok";
  });
  if (result === "last_admin") return lastAdminError();

  // ロールが変わったら、ログインし直してもらう
  if (roleChanged) await revokeAllRefreshTokens(user.id);

  return Response.json({ data: serializeUser(await findUserForResponse(user.id)) });
}

export async function DELETE(request: Request, { params }: Context) {
  const actor = await authenticate(request);
  if (actor instanceof Response) return actor;

  const user = await loadUser(Number((await params).id), actor);
  if (user instanceof Response) return user;

  // ユーザー削除（APIdesign.md 6-3）。全て同じトランザクションで行う
  const result = await prisma.$transaction(async (tx) => {
    if (user.role === "admin" && !(await hasOtherAdmin(tx, user.id))) return "last_admin";

    const now = new Date();
    await tx.user.update({ where: { id: user.id }, data: { deletedAt: now } });
    // そのユーザーのブログを削除一覧へ移す（作者が削除済みのため復活はできない）
    await tx.blog.updateMany({
      where: { authorId: user.id, deletedAt: null },
      data: { deletedAt: now, deletedById: actor.id },
    });
    await tx.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: now },
    });
    await recordAdminAction(
      { actor, ownerId: user.id, action: "user.delete", targetType: "user", targetId: user.id, request },
      tx,
    );
    return "ok";
  });
  if (result === "last_admin") return lastAdminError();

  const response = new NextResponse(null, { status: 204 });
  // 自分を削除した場合はログアウトする
  if (actor.id === user.id) clearRefreshCookie(response);
  return response;
}
