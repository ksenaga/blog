// P-1. ブログ一覧・検索
import { z } from "zod";
import {
  paginationMeta,
  paginationSchema,
  searchParamsToObject,
  validationError,
} from "@/lib/api";
import { toExcerpt } from "@/lib/blog-content";
import { prisma } from "@/lib/prisma";
import { publicBlogWhere, thumbnailUrl } from "@/lib/public-blog";
import type { Prisma } from "@/generated/prisma/client";

const querySchema = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  author_id: z.coerce.number().int().positive().optional(),
});

export async function GET(request: Request) {
  const parsed = querySchema.safeParse(
    searchParamsToObject(new URL(request.url).searchParams),
  );
  if (!parsed.success) return validationError(parsed.error);
  const { q, author_id: authorId, page, per_page: perPage } = parsed.data;

  const where: Prisma.BlogWhereInput = {
    AND: [
      publicBlogWhere(),
      authorId ? { authorId } : {},
      q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { bodyText: { contains: q, mode: "insensitive" } },
            ],
          }
        : {},
    ],
  };

  const [total, blogs] = await Promise.all([
    prisma.blog.count({ where }),
    prisma.blog.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        slug: true,
        title: true,
        bodyText: true,
        createdAt: true,
        publishedAt: true,
        author: { select: { id: true, name: true } },
        thumbnail: { select: { storageKey: true } },
      },
    }),
  ]);

  return Response.json({
    data: blogs.map((blog) => ({
      slug: blog.slug,
      title: blog.title,
      excerpt: toExcerpt(blog.bodyText),
      thumbnail_url: thumbnailUrl(blog.thumbnail),
      author: blog.author,
      created_at: blog.createdAt,
      published_at: blog.publishedAt,
    })),
    meta: paginationMeta(page, perPage, total),
  });
}
