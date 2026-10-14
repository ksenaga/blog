// B-1. ブログ一覧 / B-2. ブログ作成
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { fieldError, paginationMeta, searchParamsToObject, validationError } from "@/lib/api";
import { authenticate } from "@/lib/auth";
import {
  EMPTY_DOC,
  blogInclude,
  bodyFields,
  findBlogForResponse,
  listOrderBy,
  listQuerySchema,
  ownerWhere,
  serializeBlog,
  statusWhere,
  validateBody,
  type BlogStatus,
} from "@/lib/cms-blog";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await authenticate(request);
  if (user instanceof Response) return user;

  const parsed = listQuerySchema.safeParse(searchParamsToObject(new URL(request.url).searchParams));
  if (!parsed.success) return validationError(parsed.error);
  const { status, author_id: authorId, q, tag, sort, order, page, per_page: perPage } = parsed.data;

  const now = new Date();
  const where: Prisma.BlogWhereInput = {
    AND: [
      { deletedAt: null },
      ownerWhere(user),
      // 作者での絞り込みは管理者のみ
      authorId && user.role === "admin" ? { authorId } : {},
      status ? { OR: status.map((s: BlogStatus) => statusWhere(s, now)) } : {},
      q ? { title: { contains: q, mode: "insensitive" } } : {},
      tag ? { tags: { some: { tag: { name: { equals: tag, mode: "insensitive" } } } } } : {},
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

const createSchema = z.object({
  title: z.string().trim().min(1).max(100),
  body: z.unknown().optional(),
});

export async function POST(request: Request) {
  const user = await authenticate(request);
  if (user instanceof Response) return user;

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  // 作成時は画像がまだないため、画像を含む本文は受け付けない
  const body = parsed.data.body ?? EMPTY_DOC;
  const bodyError = validateBody(body, new Set());
  if (bodyError) return fieldError("body", bodyError);

  const blog = await prisma.$transaction(async (tx) => {
    const created = await tx.blog.create({
      data: { title: parsed.data.title, authorId: user.id, status: "draft" },
    });
    return tx.blog.update({
      where: { id: created.id },
      data: await bodyFields(tx, created.id, body as object),
    });
  });

  return Response.json({ data: serializeBlog(await findBlogForResponse(blog.id)) }, { status: 201 });
}
