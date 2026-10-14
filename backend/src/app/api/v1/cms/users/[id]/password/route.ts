// U-5. パスワード変更（本人のみ）
import bcrypt from "bcrypt";
import { z } from "zod";
import { fieldError, validationError } from "@/lib/api";
import { authenticate, forbiddenResponse, revokeAllRefreshTokens, tokenResponse } from "@/lib/auth";
import { BCRYPT_ROUNDS, passwordSchema } from "@/lib/cms-user";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  current_password: z.string().min(1).max(72),
  new_password: passwordSchema,
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await authenticate(request);
  if (actor instanceof Response) return actor;
  if (actor.id !== Number((await params).id)) return forbiddenResponse();

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: actor.id } });
  if (!(await bcrypt.compare(parsed.data.current_password, user.passwordHash))) {
    return fieldError("current_password", "現在のパスワードが正しくありません");
  }

  await prisma.user.update({
    where: { id: actor.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.new_password, BCRYPT_ROUNDS) },
  });
  // 他の端末のログインを無効にし、この端末には新しいトークンを発行する
  await revokeAllRefreshTokens(actor.id);
  return tokenResponse(actor, request);
}
