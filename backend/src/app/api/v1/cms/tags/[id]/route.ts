// TG-3. タグ名の変更 / TG-4. タグ削除（全員）
// タグは全員で共有しているため、変更・削除は全てのブログ・テンプレートに反映される
import { z } from "zod";
import { fieldError, validationError } from "@/lib/api";
import { recordAuditLog } from "@/lib/admin-actions";
import { authenticate } from "@/lib/auth";
import { serializeTag, tagNotFound, tagSelect } from "@/lib/cms-tag";
import { prisma } from "@/lib/prisma";
import { findTagByName, tagNameSchema } from "@/lib/tags";

type Context = { params: Promise<{ id: string }> };

async function loadTag(id: string) {
  const tagId = Number(id);
  return Number.isInteger(tagId) && tagId > 0 ? prisma.tag.findUnique({ where: { id: tagId } }) : null;
}

const bodySchema = z.object({ name: tagNameSchema });

export async function PATCH(request: Request, { params }: Context) {
  const user = await authenticate(request);
  if (user instanceof Response) return user;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const { name } = parsed.data;

  const tag = await loadTag((await params).id);
  if (!tag) return tagNotFound();
  // 大文字・小文字だけの変更（例：typescript → TypeScript）はできる
  if (await findTagByName(prisma, name, tag.id)) return fieldError("name", "このタグは既に存在します");

  const updated = await prisma.$transaction(async (tx) => {
    await tx.tag.update({ where: { id: tag.id }, data: { name } });
    await recordAuditLog(
      { actor: user, action: "tag.update", targetType: "tag", targetId: tag.id, changes: { name: { before: tag.name, after: name } }, request },
      tx,
    );
    return tx.tag.findUniqueOrThrow({ where: { id: tag.id }, select: tagSelect });
  });
  return Response.json({ data: serializeTag(updated) });
}

export async function DELETE(request: Request, { params }: Context) {
  const user = await authenticate(request);
  if (user instanceof Response) return user;

  const tag = await loadTag((await params).id);
  if (!tag) return tagNotFound();

  // ブログ・テンプレートとの紐付けは一緒に削除される（ON DELETE CASCADE）
  await prisma.$transaction(async (tx) => {
    await tx.tag.delete({ where: { id: tag.id } });
    await recordAuditLog({ actor: user, action: "tag.delete", targetType: "tag", targetId: tag.id, changes: { name: tag.name }, request }, tx);
  });
  return new Response(null, { status: 204 });
}
