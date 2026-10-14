// TT-1. テンプレート一覧 / TT-2. テンプレート作成（全員で共有）
import { validationError } from "@/lib/api";
import { authenticate } from "@/lib/auth";
import { serializeTemplate, templateBodySchema, templateInclude } from "@/lib/cms-tag";
import { prisma } from "@/lib/prisma";
import { resolveTagIds } from "@/lib/tags";

export async function GET(request: Request) {
  const user = await authenticate(request);
  if (user instanceof Response) return user;

  const templates = await prisma.tagTemplate.findMany({
    orderBy: [{ name: "asc" }, { id: "asc" }],
    include: templateInclude,
  });
  return Response.json({ data: templates.map((template) => serializeTemplate(template, user)) });
}

export async function POST(request: Request) {
  const user = await authenticate(request);
  if (user instanceof Response) return user;

  const parsed = templateBodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const { name, tags } = parsed.data;

  const template = await prisma.$transaction(async (tx) => {
    const created = await tx.tagTemplate.create({ data: { name, createdById: user.id } });
    const tagIds = await resolveTagIds(tx, tags);
    await tx.tagTemplateTag.createMany({
      data: tagIds.map((tagId, position) => ({ templateId: created.id, tagId, position })),
    });
    return tx.tagTemplate.findUniqueOrThrow({ where: { id: created.id }, include: templateInclude });
  });
  return Response.json({ data: serializeTemplate(template, user) }, { status: 201 });
}
