// D-1. ダッシュボード
import { authenticate } from "@/lib/auth";
import { effectiveStatus, ownerWhere, statusWhere } from "@/lib/cms-blog";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await authenticate(request);
  if (user instanceof Response) return user;

  // ユーザーは自分のブログ、管理者は全体を集計する
  const owner = ownerWhere(user);
  const now = new Date();
  const count = (where: object) => prisma.blog.count({ where: { AND: [owner, where] } });

  const [draft, scheduled, privateCount, publicCount, deleted, unread, recent] = await Promise.all([
    count({ deletedAt: null, ...statusWhere("draft", now) }),
    count({ deletedAt: null, ...statusWhere("scheduled", now) }),
    count({ deletedAt: null, ...statusWhere("private", now) }),
    count({ deletedAt: null, ...statusWhere("public", now) }),
    count({ deletedAt: { not: null } }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    prisma.blog.findMany({
      where: { AND: [owner, { deletedAt: null }] },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, title: true, status: true, publishedAt: true, updatedAt: true },
    }),
  ]);

  return Response.json({
    data: {
      blog_counts: { draft, scheduled, private: privateCount, public: publicCount, deleted },
      unread_notification_count: unread,
      recent_blogs: recent.map((blog) => ({
        id: blog.id,
        title: blog.title,
        status: effectiveStatus(blog, now),
        updated_at: blog.updatedAt,
      })),
    },
  });
}
