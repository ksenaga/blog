// D-3. 通知を既読にする
import { errorResponse } from "@/lib/api";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticate(request);
  if (user instanceof Response) return user;

  const id = Number((await params).id);
  // 自分宛ての通知だけを既読にできる。既に既読なら既読日時は変えない
  const notification = Number.isInteger(id)
    ? await prisma.notification.findFirst({ where: { id, userId: user.id } })
    : null;
  if (!notification) return errorResponse(404, "NOT_FOUND", "通知が見つかりません");

  if (!notification.readAt) {
    await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }
  return new Response(null, { status: 204 });
}
