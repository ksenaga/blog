// U-6. パスワードリセット（管理者のみ）
import bcrypt from "bcrypt";
import { z } from "zod";
import { validationError } from "@/lib/api";
import { recordAdminAction } from "@/lib/admin-actions";
import { authenticate, forbiddenResponse, revokeAllRefreshTokens } from "@/lib/auth";
import { BCRYPT_ROUNDS, loadUser, passwordSchema } from "@/lib/cms-user";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ new_password: passwordSchema });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await authenticate(request);
  if (actor instanceof Response) return actor;
  if (actor.role !== "admin") return forbiddenResponse();

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const user = await loadUser(Number((await params).id), actor);
  if (user instanceof Response) return user;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(parsed.data.new_password, BCRYPT_ROUNDS) },
    });
    await recordAdminAction(
      {
        actor,
        ownerId: user.id,
        action: "user.password_reset",
        targetType: "user",
        targetId: user.id,
        notification: {
          type: "password_reset_by_admin",
          message: `管理者 ${actor.name} があなたのパスワードをリセットしました`,
        },
        request,
      },
      tx,
    );
  });
  // 対象ユーザーのログインを無効にする
  await revokeAllRefreshTokens(user.id);

  return new Response(null, { status: 204 });
}
