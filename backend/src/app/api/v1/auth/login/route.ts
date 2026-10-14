// A-1. ログイン
import bcrypt from "bcrypt";
import { z } from "zod";
import { errorResponse, validationError } from "@/lib/api";
import { toAuthUser, tokenResponse } from "@/lib/auth";
import { config } from "@/lib/config";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(72),
});

// 存在しないメールアドレスでも同じ時間がかかるようにするためのハッシュ
const DUMMY_HASH = bcrypt.hashSync("dummy-password", 10);

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const { email, password } = parsed.data;

  // ロック中なら受け付けない（存在しないメールアドレスも同じように数える）
  const attempt = await prisma.loginAttempt.findUnique({ where: { email } });
  if (attempt?.lockedUntil && attempt.lockedUntil > new Date()) {
    return errorResponse(
      429,
      "TOO_MANY_REQUESTS",
      "ログインの失敗が続いたため、一時的にロックしています。しばらくしてから再度お試しください",
    );
  }

  const user = await prisma.user.findFirst({ where: { email, deletedAt: null } });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !valid) {
    const failedCount = (attempt?.failedCount ?? 0) + 1;
    const locked = failedCount >= config.loginMaxAttempts;
    await prisma.loginAttempt.upsert({
      where: { email },
      create: { email, failedCount },
      update: {
        // 上限に達したらロックし、回数を数え直す
        failedCount: locked ? 0 : failedCount,
        lockedUntil: locked ? new Date(Date.now() + config.loginLockMinutes * 60 * 1000) : null,
      },
    });
    return errorResponse(401, "INVALID_CREDENTIALS", "メールアドレスまたはパスワードが正しくありません");
  }

  // 成功したら失敗回数をリセットする
  await prisma.loginAttempt.deleteMany({ where: { email } });
  return tokenResponse(toAuthUser(user), request);
}
