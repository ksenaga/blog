// 管理側のタグ・テンプレートの共通処理
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { errorResponse } from "@/lib/api";
import type { AuthUser } from "@/lib/auth";
import { tagsSchema } from "@/lib/tags";

export const tagSelect = {
  id: true,
  name: true,
  createdAt: true,
  _count: {
    select: {
      blogs: { where: { blog: { deletedAt: null } } },
      templates: true,
    },
  },
} satisfies Prisma.TagSelect;

type TagRow = Prisma.TagGetPayload<{ select: typeof tagSelect }>;

export function serializeTag(tag: TagRow) {
  return {
    id: tag.id,
    name: tag.name,
    blog_count: tag._count.blogs,
    template_count: tag._count.templates,
    created_at: tag.createdAt,
  };
}

export function tagNotFound() {
  return errorResponse(404, "NOT_FOUND", "タグが見つかりません");
}

export const templateInclude = {
  createdBy: { select: { id: true, name: true } },
  tags: { orderBy: { position: "asc" }, select: { tag: { select: { name: true } } } },
} satisfies Prisma.TagTemplateInclude;

type TemplateRow = Prisma.TagTemplateGetPayload<{ include: typeof templateInclude }>;

// テンプレートを編集・削除できるのは、作った本人と管理者
export function canEditTemplate(template: { createdById: number }, user: AuthUser) {
  return user.role === "admin" || template.createdById === user.id;
}

export function serializeTemplate(template: TemplateRow, user: AuthUser) {
  return {
    id: template.id,
    name: template.name,
    tags: template.tags.map(({ tag }) => tag.name),
    created_by: template.createdBy,
    editable: canEditTemplate(template, user),
    created_at: template.createdAt,
    updated_at: template.updatedAt,
  };
}

export function templateNotFound() {
  return errorResponse(404, "NOT_FOUND", "テンプレートが見つかりません");
}

// テンプレートの入力（作成・編集）
export const templateBodySchema = z.object({
  name: z.string().trim().min(1, "テンプレート名を入力してください").max(50, "テンプレート名は50文字以内で入力してください"),
  tags: tagsSchema.pipe(z.array(z.string()).min(1, "タグを1つ以上入力してください")),
});
