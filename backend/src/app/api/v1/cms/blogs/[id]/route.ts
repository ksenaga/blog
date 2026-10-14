// B-3. ブログ詳細 / B-4. ブログ編集 / B-6. ブログ削除
import { z } from "zod";
import { fieldError, validationError } from "@/lib/api";
import { quoteTitle, recordAdminAction } from "@/lib/admin-actions";
import { authenticate } from "@/lib/auth";
import {
  blogImageIds,
  bodyFields,
  effectiveStatus,
  findBlogForResponse,
  loadBlog,
  notEditable,
  serializeBlog,
  validateBody,
  versionConflict,
} from "@/lib/cms-blog";
import { prisma } from "@/lib/prisma";
import { setBlogTags, tagNames, tagsSchema } from "@/lib/tags";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  const user = await authenticate(request);
  if (user instanceof Response) return user;

  // 削除済みのブログも閲覧できる（C-06）
  const blog = await loadBlog(Number((await params).id), user, { deleted: "include" });
  if (blog instanceof Response) return blog;
  return Response.json({ data: serializeBlog(blog) });
}

const updateSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  body: z.unknown().optional(),
  tags: tagsSchema.optional(),
  version: z.number().int().positive(),
});

export async function PATCH(request: Request, { params }: Context) {
  const user = await authenticate(request);
  if (user instanceof Response) return user;

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const { title, body, tags, version } = parsed.data;

  const blog = await loadBlog(Number((await params).id), user, { publishDue: true });
  if (blog instanceof Response) return blog;
  if (effectiveStatus(blog) === "public") return notEditable();
  if (blog.version !== version) return versionConflict();

  if (body !== undefined) {
    const bodyError = validateBody(body, await blogImageIds(blog.id));
    if (bodyError) return fieldError("body", bodyError);
  }

  const updated = await prisma.$transaction(async (tx) => {
    // version が一致したときだけ更新する（楽観的ロック）
    const { count } = await tx.blog.updateMany({
      where: { id: blog.id, version },
      data: {
        ...(title !== undefined && { title }),
        ...(body !== undefined && (await bodyFields(tx, blog.id, body as object))),
        version: { increment: 1 },
      },
    });
    if (count === 0) return false;
    if (tags !== undefined) await setBlogTags(tx, blog.id, tags);

    await recordAdminAction(
      {
        actor: user,
        ownerId: blog.authorId,
        action: "blog.update",
        targetType: "blog",
        targetId: blog.id,
        // 本文は大きいため、変更したことだけを記録する
        changes: {
          ...(title !== undefined && title !== blog.title && { title: { before: blog.title, after: title } }),
          ...(body !== undefined && { body: "changed" }),
          ...(tags !== undefined && { tags: { before: tagNames(blog.tags), after: tags } }),
        },
        notification: {
          type: "blog_updated_by_admin",
          message: `管理者 ${user.name} があなたのブログ${quoteTitle(title ?? blog.title)}を編集しました`,
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

export async function DELETE(request: Request, { params }: Context) {
  const user = await authenticate(request);
  if (user instanceof Response) return user;

  const blog = await loadBlog(Number((await params).id), user, { publishDue: true });
  if (blog instanceof Response) return blog;
  // 公開中のブログは非公開にしてから削除する
  if (effectiveStatus(blog) === "public") {
    return notEditable();
  }

  await prisma.$transaction(async (tx) => {
    await tx.blog.update({
      where: { id: blog.id },
      data: { deletedAt: new Date(), deletedById: user.id },
    });
    await recordAdminAction(
      {
        actor: user,
        ownerId: blog.authorId,
        action: "blog.delete",
        targetType: "blog",
        targetId: blog.id,
        notification: {
          type: "blog_deleted_by_admin",
          message: `管理者 ${user.name} があなたのブログ${quoteTitle(blog.title)}を削除しました`,
          blogId: blog.id,
        },
        request,
      },
      tx,
    );
  });

  return new Response(null, { status: 204 });
}
