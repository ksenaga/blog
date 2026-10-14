// 管理側のブログの共通処理（APIdesign.md 5章・DBdesign.md 5章）
import type { JSONContent } from "@tiptap/core";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { errorResponse, paginationSchema } from "@/lib/api";
import type { AuthUser } from "@/lib/auth";
import { forbiddenResponse } from "@/lib/auth";
import { imageIds, toHtml, toText } from "@/lib/blog-content";
import { prisma } from "@/lib/prisma";
import { imageUrl } from "@/lib/storage";

type Tx = Prisma.TransactionClient;

export type BlogStatus = "draft" | "scheduled" | "private" | "public";

export const STATUS_LABELS: Record<BlogStatus, string> = {
  draft: "下書き",
  scheduled: "公開予定",
  private: "非公開",
  public: "公開中",
};

// ステータス遷移（requirements.md 7-2）。削除は B-6 で行う
export const TRANSITIONS: Record<BlogStatus, BlogStatus[]> = {
  draft: ["public", "scheduled"],
  scheduled: ["public", "private"],
  public: ["private"],
  private: ["public", "scheduled"],
};

// ---------- 一覧 ----------

const STATUSES = ["draft", "scheduled", "private", "public"] as const;

// B-1・B-7 の一覧の条件
export const listQuerySchema = paginationSchema.extend({
  status: z
    .string()
    .transform((value) => value.split(","))
    .pipe(z.array(z.enum(STATUSES)))
    .optional(),
  author_id: z.coerce.number().int().positive().optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(["updated_at", "created_at", "published_at", "deleted_at"]).default("updated_at"),
  order: z.enum(["desc", "asc"]).default("desc"),
});

const SORT_FIELDS = {
  updated_at: "updatedAt",
  created_at: "createdAt",
  published_at: "publishedAt",
  deleted_at: "deletedAt",
} as const;

export function listOrderBy(sort: keyof typeof SORT_FIELDS, order: "asc" | "desc") {
  const field = SORT_FIELDS[sort];
  // 公開日時・削除日時は空の場合があるため、空のものを最後に並べる
  const nullable = field === "publishedAt" || field === "deletedAt";
  return [
    { [field]: nullable ? { sort: order, nulls: "last" } : order },
    { id: order },
  ] as Prisma.BlogOrderByWithRelationInput[];
}

export const EMPTY_DOC: JSONContent = { type: "doc", content: [] };

const blogInclude = {
  author: { select: { id: true, name: true, deletedAt: true } },
  deletedBy: { select: { id: true, name: true } },
  images: { orderBy: { id: "asc" } },
} satisfies Prisma.BlogInclude;

export type BlogWithRelations = Prisma.BlogGetPayload<{ include: typeof blogInclude }>;

// 公開日時を過ぎた公開予定は公開中として扱う
export function effectiveStatus(blog: { status: string; publishedAt: Date | null }, now = new Date()): BlogStatus {
  if (blog.status === "scheduled" && blog.publishedAt && blog.publishedAt <= now) return "public";
  return blog.status as BlogStatus;
}

// 管理画面の一覧で、ステータスで絞り込むときの条件
export function statusWhere(status: BlogStatus, now = new Date()): Prisma.BlogWhereInput {
  switch (status) {
    case "public":
      return { OR: [{ status: "public" }, { status: "scheduled", publishedAt: { lte: now } }] };
    case "scheduled":
      return { status: "scheduled", publishedAt: { gt: now } };
    default:
      return { status };
  }
}

// ユーザーは自分のブログのみ、管理者は全てのブログ
export function ownerWhere(user: AuthUser): Prisma.BlogWhereInput {
  return user.role === "admin" ? {} : { authorId: user.id };
}

// 操作の前に、公開日時を過ぎた公開予定を公開中に更新する（DBdesign.md 5-2）
async function publishIfDue(blogId: number) {
  await prisma.$executeRaw`
    UPDATE blogs
    SET status = 'public',
        first_published_at = COALESCE(first_published_at, published_at),
        version = version + 1,
        updated_at = now()
    WHERE id = ${blogId} AND status = 'scheduled' AND published_at <= now()
  `;
}

// ブログを取得し、権限を確認する。見つからない・権限がない場合はエラーのレスポンスを返す
export async function loadBlog(
  id: number,
  user: AuthUser,
  options: { deleted?: "exclude" | "include" | "only"; publishDue?: boolean } = {},
): Promise<BlogWithRelations | Response> {
  if (!Number.isInteger(id) || id <= 0) return blogNotFound();
  if (options.publishDue) await publishIfDue(id);

  const blog = await prisma.blog.findUnique({ where: { id }, include: blogInclude });
  const deleted = options.deleted ?? "exclude";
  if (!blog) return blogNotFound();
  if (deleted === "exclude" && blog.deletedAt) return blogNotFound();
  if (deleted === "only" && !blog.deletedAt) return blogNotFound();
  if (user.role !== "admin" && blog.authorId !== user.id) return forbiddenResponse();
  return blog;
}

export function blogNotFound() {
  return errorResponse(404, "NOT_FOUND", "ブログが見つかりません");
}

export function notEditable() {
  return errorResponse(409, "BLOG_NOT_EDITABLE", "公開中のため編集できません。編集するには非公開にしてください");
}

export function versionConflict() {
  return errorResponse(409, "VERSION_CONFLICT", "他の人がこのブログを更新しました。最新の内容を読み込んでください");
}

// 本文の画像ノードの src を、保存先から組み立て直す
function refreshImageSrc(doc: JSONContent, urls: Map<number, string>): JSONContent {
  if (doc.type === "image") {
    const url = urls.get(Number(doc.attrs?.imageId));
    return { ...doc, attrs: { ...doc.attrs, src: url ?? null } };
  }
  if (!doc.content) return doc;
  return { ...doc, content: doc.content.map((child) => refreshImageSrc(child, urls)) };
}

// 管理側のブログオブジェクト（APIdesign.md 5-1）
export function serializeBlog(blog: BlogWithRelations, options: { body?: boolean } = { body: true }) {
  const status = effectiveStatus(blog);
  const deleted = !!blog.deletedAt;
  const urls = new Map(blog.images.map((image) => [image.id, imageUrl(image.storageKey)]));
  return {
    id: blog.id,
    slug: blog.slug,
    title: blog.title,
    ...(options.body && { body: refreshImageSrc(blog.bodyJson as JSONContent, urls) }),
    status,
    published_at: blog.publishedAt,
    first_published_at: blog.firstPublishedAt,
    images: blog.images.map((image) => ({
      id: image.id,
      url: imageUrl(image.storageKey),
      alt: image.alt,
      width: image.width,
      height: image.height,
    })),
    thumbnail_url: blog.thumbnailImageId ? (urls.get(blog.thumbnailImageId) ?? null) : null,
    author: { id: blog.author.id, name: blog.author.name, deleted: !!blog.author.deletedAt },
    editable: !deleted && status !== "public",
    allowed_transitions: deleted ? [] : [...TRANSITIONS[status], ...(status === "public" ? [] : ["deleted"])],
    version: blog.version,
    created_at: blog.createdAt,
    updated_at: blog.updatedAt,
    deleted_at: blog.deletedAt,
    deleted_by: blog.deletedBy,
    restorable: deleted && !blog.author.deletedAt,
  };
}

export async function findBlogForResponse(id: number) {
  return prisma.blog.findUniqueOrThrow({ where: { id }, include: blogInclude });
}

// ---------- 本文の検証と保存（APIdesign.md 5-7） ----------

const BLOCKS = new Set([
  "doc", "paragraph", "heading", "bulletList", "orderedList", "listItem",
  "blockquote", "horizontalRule", "image", "text", "hardBreak",
]);
const MARKS = new Set(["bold", "italic", "strike", "underline", "link"]);
const MAX_TEXT_LENGTH = 100_000;

// 許可していない要素があればエラーの文章を返す
export function validateBody(doc: unknown, blogImageIds: Set<number>): string | null {
  if (!doc || typeof doc !== "object" || (doc as JSONContent).type !== "doc") {
    return "本文の形式が正しくありません";
  }
  if (JSON.stringify(doc).length > 2_000_000) return "本文が長すぎます";

  const check = (node: JSONContent): string | null => {
    if (!node || typeof node !== "object" || !BLOCKS.has(node.type ?? "")) {
      return `使用できない要素が含まれています（${node?.type ?? "不明"}）`;
    }
    if (node.type === "heading" && ![2, 3, 4].includes(Number(node.attrs?.level))) {
      return "見出しは h2〜h4 のみ使用できます";
    }
    if (node.type === "image" && !blogImageIds.has(Number(node.attrs?.imageId))) {
      return "このブログにアップロードされていない画像が含まれています";
    }
    for (const mark of node.marks ?? []) {
      if (!MARKS.has(mark.type)) return `使用できない装飾が含まれています（${mark.type}）`;
      if (mark.type === "link" && !/^https?:\/\//i.test(String(mark.attrs?.href ?? ""))) {
        return "リンクは http または https の URL のみ使用できます";
      }
    }
    if (node.content !== undefined && !Array.isArray(node.content)) return "本文の形式が正しくありません";
    for (const child of node.content ?? []) {
      const error = check(child);
      if (error) return error;
    }
    return null;
  };

  const error = check(doc as JSONContent);
  if (error) return error;
  if (toText(doc as JSONContent).length > MAX_TEXT_LENGTH) {
    return `本文は${MAX_TEXT_LENGTH.toLocaleString()}文字以内で入力してください`;
  }
  return null;
}

function collectImageAlts(doc: JSONContent, alts = new Map<number, string>()) {
  if (doc.type === "image") {
    alts.set(Number(doc.attrs?.imageId), String(doc.attrs?.alt ?? "").slice(0, 200));
  }
  for (const child of doc.content ?? []) collectImageAlts(child, alts);
  return alts;
}

// 本文から HTML・テキスト・サムネイルを作る。画像の alt も本文の値で更新する
export async function bodyFields(tx: Tx, blogId: number, doc: JSONContent) {
  const images = await tx.blogImage.findMany({ where: { blogId } });
  const alts = collectImageAlts(doc);
  for (const image of images) {
    const alt = alts.get(image.id);
    if (alt !== undefined && alt !== image.alt) {
      await tx.blogImage.update({ where: { id: image.id }, data: { alt } });
    }
  }
  const storageKeys = new Map(images.map((image) => [image.id, image.storageKey]));
  return {
    bodyJson: doc as Prisma.InputJsonValue,
    bodyText: toText(doc),
    bodyHtml: toHtml(doc, storageKeys),
    thumbnailImageId: imageIds(doc)[0] ?? null,
  };
}

export async function blogImageIds(blogId: number) {
  const images = await prisma.blogImage.findMany({ where: { blogId }, select: { id: true } });
  return new Set(images.map((image) => image.id));
}
