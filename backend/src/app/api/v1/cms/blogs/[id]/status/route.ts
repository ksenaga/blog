// B-5. ステータス変更
import { z } from "zod";
import { errorResponse, fieldError, validationError } from "@/lib/api";
import { quoteTitle, recordAdminAction } from "@/lib/admin-actions";
import { authenticate } from "@/lib/auth";
import {
  STATUS_LABELS,
  TRANSITIONS,
  effectiveStatus,
  findBlogForResponse,
  loadBlog,
  serializeBlog,
  versionConflict,
} from "@/lib/cms-blog";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  status: z.enum(["draft", "scheduled", "private", "public"]),
  published_at: z.iso.datetime({ offset: true }).optional(),
  version: z.number().int().positive(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticate(request);
  if (user instanceof Response) return user;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const { status: next, version } = parsed.data;

  const blog = await loadBlog(Number((await params).id), user, { publishDue: true });
  if (blog instanceof Response) return blog;
  if (blog.version !== version) return versionConflict();

  const current = effectiveStatus(blog);
  if (!TRANSITIONS[current].includes(next)) {
    return errorResponse(
      409,
      "INVALID_STATUS_TRANSITION",
      `「${STATUS_LABELS[current]}」から「${STATUS_LABELS[next]}」には変更できません`,
    );
  }

  const now = new Date();
  let publishedAt = blog.publishedAt;
  let firstPublishedAt = blog.firstPublishedAt;

  if (next === "scheduled") {
    // 公開予定には未来の公開日時が必須
    if (!parsed.data.published_at) return fieldError("published_at", "公開日時を指定してください");
    publishedAt = new Date(parsed.data.published_at);
    if (publishedAt <= now) return fieldError("published_at", "公開日時は未来の日時を指定してください");
  }
  if (next === "public") {
    if (!firstPublishedAt) {
      // 初めての公開
      publishedAt = now;
      firstPublishedAt = now;
    } else if (!publishedAt || publishedAt > now) {
      // 非公開から公開予定を経て公開する場合など、未来の日時が残っていれば今にする
      publishedAt = now;
    }
    // それ以外（非公開からの再公開）は、公開日時をそのまま維持する
  }

  const updated = await prisma.$transaction(async (tx) => {
    const { count } = await tx.blog.updateMany({
      where: { id: blog.id, version },
      data: { status: next, publishedAt, firstPublishedAt, version: { increment: 1 } },
    });
    if (count === 0) return false;

    await recordAdminAction(
      {
        actor: user,
        ownerId: blog.authorId,
        action: "blog.status_change",
        targetType: "blog",
        targetId: blog.id,
        changes: { status: { before: current, after: next } },
        notification: {
          type: "blog_status_changed_by_admin",
          message: `管理者 ${user.name} があなたのブログ${quoteTitle(blog.title)}を「${STATUS_LABELS[next]}」にしました`,
          blogId: blog.id,
        },
        request,
      },
      tx,
    );
    return true;
  });
  if (!updated) return versionConflict();

  return Response.json({ data: serializeBlog(await findBlogForResponse(blog.id)) });
}
