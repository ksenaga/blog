// TG-1. タグ一覧 / TG-2. タグ作成（全員）
import { z } from "zod";
import { fieldError, searchParamsToObject, validationError } from "@/lib/api";
import { recordAuditLog } from "@/lib/admin-actions";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findTagByName, tagNameSchema } from "@/lib/tags";
import { serializeTag, tagSelect } from "@/lib/cms-tag";

const querySchema = z.object({ q: z.string().trim().max(30).optional() });

export async function GET(request: Request) {
  const user = await authenticate(request);
  if (user instanceof Response) return user;

  const parsed = querySchema.safeParse(searchParamsToObject(new URL(request.url).searchParams));
  if (!parsed.success) return validationError(parsed.error);
  const { q } = parsed.data;

  const tags = await prisma.tag.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : {},
    select: tagSelect,
    take: 500,
  });

  // 削除されていないブログで使われている件数が多い順
  return Response.json({
    data: tags
      .map(serializeTag)
      .sort((a, b) => b.blog_count - a.blog_count || a.name.localeCompare(b.name, "ja")),
  });
}

const bodySchema = z.object({ name: tagNameSchema });

export async function POST(request: Request) {
  const user = await authenticate(request);
  if (user instanceof Response) return user;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const { name } = parsed.data;

  if (await findTagByName(prisma, name)) return fieldError("name", "このタグは既に存在します");

  const tag = await prisma.$transaction(async (tx) => {
    const created = await tx.tag.create({ data: { name } });
    await recordAuditLog({ actor: user, action: "tag.create", targetType: "tag", targetId: created.id, changes: { name }, request }, tx);
    return tx.tag.findUniqueOrThrow({ where: { id: created.id }, select: tagSelect });
  });
  return Response.json({ data: serializeTag(tag) }, { status: 201 });
}
