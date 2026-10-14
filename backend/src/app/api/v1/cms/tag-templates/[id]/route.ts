// TT-3. テンプレート編集 / TT-4. テンプレート削除（作った本人と管理者）
import { validationError } from "@/lib/api";
import { recordAdminAction } from "@/lib/admin-actions";
import { authenticate, forbiddenResponse } from "@/lib/auth";
import { canEditTemplate, serializeTemplate, templateBodySchema, templateInclude, templateNotFound } from "@/lib/cms-tag";
import { prisma } from "@/lib/prisma";
import { resolveTagIds } from "@/lib/tags";

type Context = { params: Promise<{ id: string }> };

async function loadTemplate(id: string) {
  const templateId = Number(id);
  return Number.isInteger(templateId) && templateId > 0
    ? prisma.tagTemplate.findUnique({ where: { id: templateId }, include: templateInclude })
    : null;
}

export async function PATCH(request: Request, { params }: Context) {
  const user = await authenticate(request);
  if (user instanceof Response) return user;

  const parsed = templateBodySchema.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const { name, tags } = parsed.data;

  const template = await loadTemplate((await params).id);
  if (!template) return templateNotFound();
  if (!canEditTemplate(template, user)) return forbiddenResponse();

  const updated = await prisma.$transaction(async (tx) => {
    await tx.tagTemplate.update({ where: { id: template.id }, data: { ...(name !== undefined && { name }), updatedAt: new Date() } });
    if (tags !== undefined) {
      const tagIds = await resolveTagIds(tx, tags);
      await tx.tagTemplateTag.deleteMany({ where: { templateId: template.id } });
      await tx.tagTemplateTag.createMany({
        data: tagIds.map((tagId, position) => ({ templateId: template.id, tagId, position })),
      });
    }
    // 管理者が他人のテンプレートを変更した場合は操作ログに残す
    await recordAdminAction(
      { actor: user, ownerId: template.createdById, action: "tag_template.update", targetType: "tag_template", targetId: template.id, changes: { name, tags }, request },
      tx,
    );
    return tx.tagTemplate.findUniqueOrThrow({ where: { id: template.id }, include: templateInclude });
  });
  return Response.json({ data: serializeTemplate(updated, user) });
}

export async function DELETE(request: Request, { params }: Context) {
  const user = await authenticate(request);
  if (user instanceof Response) return user;

  const template = await loadTemplate((await params).id);
  if (!template) return templateNotFound();
  if (!canEditTemplate(template, user)) return forbiddenResponse();

  await prisma.$transaction(async (tx) => {
    await tx.tagTemplate.delete({ where: { id: template.id } });
    await recordAdminAction(
      { actor: user, ownerId: template.createdById, action: "tag_template.delete", targetType: "tag_template", targetId: template.id, changes: { name: template.name }, request },
      tx,
    );
  });
  return new Response(null, { status: 204 });
}
