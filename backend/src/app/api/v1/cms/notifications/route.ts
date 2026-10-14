// D-2. 通知一覧（自分宛て）
import { z } from "zod";
import { paginationMeta, paginationSchema, searchParamsToObject, validationError } from "@/lib/api";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const querySchema = paginationSchema.extend({
  unread_only: z.enum(["true", "false"]).optional(),
});

export async function GET(request: Request) {
  const user = await authenticate(request);
  if (user instanceof Response) return user;

  const parsed = querySchema.safeParse(searchParamsToObject(new URL(request.url).searchParams));
  if (!parsed.success) return validationError(parsed.error);
  const { unread_only: unreadOnly, page, per_page: perPage } = parsed.data;

  const where = { userId: user.id, ...(unreadOnly === "true" && { readAt: null }) };
  const [total, notifications] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        blog: { select: { id: true, title: true, deletedAt: true } },
        actor: { select: { id: true, name: true } },
      },
    }),
  ]);

  return Response.json({
    data: notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      message: notification.message,
      blog: notification.blog && {
        id: notification.blog.id,
        title: notification.blog.title,
        deleted: !!notification.blog.deletedAt,
      },
      actor: notification.actor,
      read_at: notification.readAt,
      created_at: notification.createdAt,
    })),
    meta: paginationMeta(page, perPage, total),
  });
}
