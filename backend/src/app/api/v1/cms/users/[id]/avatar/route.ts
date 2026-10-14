// U-8. アイコン画像の変更 / U-9. アイコン画像の削除（本人・管理者）
import { errorResponse, fieldError } from "@/lib/api";
import { recordAdminAction } from "@/lib/admin-actions";
import { authenticate } from "@/lib/auth";
import { deleteAvatarFile, processAvatar, saveAvatar } from "@/lib/avatar";
import { findUserForResponse, loadUser, serializeUser } from "@/lib/cms-user";
import { config } from "@/lib/config";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  const actor = await authenticate(request);
  if (actor instanceof Response) return actor;

  const user = await loadUser(Number((await params).id), actor);
  if (user instanceof Response) return user;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return fieldError("file", "画像を選択してください");
  if (file.size > config.imageMaxSizeMb * 1024 * 1024) {
    return errorResponse(413, "FILE_TOO_LARGE", `画像のサイズが上限（${config.imageMaxSizeMb}MB）を超えています`);
  }

  const data = await processAvatar(Buffer.from(await file.arrayBuffer()));
  if (!data) return fieldError("file", "PNG・JPEG・WebP の画像を選択してください");

  const storageKey = await saveAvatar(user.id, data);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { avatarStorageKey: storageKey } });
    await recordAdminAction(
      { actor, ownerId: user.id, action: "user.avatar_update", targetType: "user", targetId: user.id, request },
      tx,
    );
  });
  await deleteAvatarFile(user.avatarStorageKey);

  return Response.json({ data: serializeUser(await findUserForResponse(user.id)) });
}

export async function DELETE(request: Request, { params }: Context) {
  const actor = await authenticate(request);
  if (actor instanceof Response) return actor;

  const user = await loadUser(Number((await params).id), actor);
  if (user instanceof Response) return user;

  if (user.avatarStorageKey) {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { avatarStorageKey: null } });
      await recordAdminAction(
        { actor, ownerId: user.id, action: "user.avatar_delete", targetType: "user", targetId: user.id, request },
        tx,
      );
    });
    await deleteAvatarFile(user.avatarStorageKey);
  }

  return Response.json({ data: serializeUser(await findUserForResponse(user.id)) });
}
