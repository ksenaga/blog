// B-8. ブログ復活
import { errorResponse } from "@/lib/api";
import { quoteTitle, recordAdminAction } from "@/lib/admin-actions";
import { authenticate } from "@/lib/auth";
import { findBlogForResponse, loadBlog, serializeBlog } from "@/lib/cms-blog";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticate(request);
  if (user instanceof Response) return user;

  const blog = await loadBlog(Number((await params).id), user, { deleted: "only" });
  if (blog instanceof Response) return blog;
  if (blog.author.deletedAt) {
    return errorResponse(409, "AUTHOR_DELETED", "作者が削除されているため復活できません");
  }

  await prisma.$transaction(async (tx) => {
    await tx.blog.update({
      where: { id: blog.id },
      data: {
        deletedAt: null,
        deletedById: null,
        // 一度でも公開したことがあれば非公開、なければ下書きで復活する
        status: blog.firstPublishedAt ? "private" : "draft",
        version: { increment: 1 },
      },
    });
    await recordAdminAction(
      {
        actor: user,
        ownerId: blog.authorId,
        action: "blog.restore",
        targetType: "blog",
        targetId: blog.id,
        notification: {
          type: "blog_restored_by_admin",
          message: `管理者 ${user.name} があなたのブログ${quoteTitle(blog.title)}を復活しました`,
          blogId: blog.id,
        },
        request,
      },
      tx,
    );
  });

  return Response.json({ data: serializeBlog(await findBlogForResponse(blog.id)) });
}
