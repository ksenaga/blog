// D-4. 通知をすべて既読にする
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await authenticate(request);
  if (user instanceof Response) return user;

  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  return new Response(null, { status: 204 });
}
