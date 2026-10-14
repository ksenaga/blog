// B-7. 削除一覧
import type { Prisma } from "@/generated/prisma/client";
import { paginationMeta, searchParamsToObject, validationError } from "@/lib/api";
import { authenticate } from "@/lib/auth";
import { blogInclude, listOrderBy, listQuerySchema, ownerWhere, serializeBlog } from "@/lib/cms-blog";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await authenticate(request);
  if (user instanceof Response) return user;

  const params = searchParamsToObject(new URL(request.url).searchParams);
  const parsed = listQuerySchema.omit({ status: true }).safeParse({ sort: "deleted_at", ...params });
  if (!parsed.success) return validationError(parsed.error);
  const { author_id: authorId, q, sort, order, page, per_page: perPage } = parsed.data;

  const where: Prisma.BlogWhereInput = {
    AND: [
      { deletedAt: { not: null } },
      ownerWhere(user),
      authorId && user.role === "admin" ? { authorId } : {},
      q ? { title: { contains: q, mode: "insensitive" } } : {},
    ],
  };

  const [total, blogs] = await Promise.all([
    prisma.blog.count({ where }),
    prisma.blog.findMany({
      where,
      orderBy: listOrderBy(sort, order),
      skip: (page - 1) * perPage,
      take: perPage,
      include: blogInclude,
    }),
  ]);

  return Response.json({
    data: blogs.map((blog) => serializeBlog(blog, { body: false })),
    meta: paginationMeta(page, perPage, total),
  });
}
