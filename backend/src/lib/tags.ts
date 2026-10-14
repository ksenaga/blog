// タグの共通処理
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient;

export const TAG_MAX_PER_BLOG = 10;
export const TAG_MAX_LENGTH = 30;

// タグ名をそろえる：全角英数を半角に、前後の空白と先頭の「#」を取り除き、連続する空白を1つにする
export function normalizeTagName(name: string) {
  return name.normalize("NFKC").trim().replace(/^#+/, "").replace(/\s+/g, " ").trim();
}

// 1つのタグ名（タグ管理画面での作成・名前変更）
export const tagNameSchema = z
  .string()
  .transform(normalizeTagName)
  .pipe(
    z
      .string()
      .min(1, "タグ名を入力してください")
      .max(TAG_MAX_LENGTH, `タグは${TAG_MAX_LENGTH}文字以内で入力してください`),
  );

// 入力されたタグの一覧（重複は大文字・小文字を区別せずに1つにまとめる）
export const tagsSchema = z
  .array(z.string())
  .max(TAG_MAX_PER_BLOG, `タグは${TAG_MAX_PER_BLOG}個までです`)
  .transform((names) => {
    const seen = new Set<string>();
    return names.map(normalizeTagName).filter((name) => {
      const key = name.toLowerCase();
      if (!name || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })
  .pipe(z.array(z.string().max(TAG_MAX_LENGTH, `タグは${TAG_MAX_LENGTH}文字以内で入力してください`)));

// 大文字・小文字を区別せずにタグを探す
export function findTagByName(tx: Tx, name: string, exceptId?: number) {
  return tx.tag.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, ...(exceptId && { id: { not: exceptId } }) },
  });
}

// タグ名からタグIDを取り出す。まだないタグは作る
export async function resolveTagIds(tx: Tx, names: string[]) {
  const tagIds: number[] = [];
  for (const name of names) {
    const tag = (await findTagByName(tx, name)) ?? (await tx.tag.create({ data: { name } }));
    tagIds.push(tag.id);
  }
  return tagIds;
}

// ブログのタグを付け直す
export async function setBlogTags(tx: Tx, blogId: number, names: string[]) {
  const tagIds = await resolveTagIds(tx, names);
  await tx.blogTag.deleteMany({ where: { blogId } });
  if (tagIds.length) {
    await tx.blogTag.createMany({ data: tagIds.map((tagId, position) => ({ blogId, tagId, position })) });
  }
}

// レスポンスに含めるタグ（付けた順）
export const blogTagsInclude = {
  orderBy: { position: "asc" },
  select: { tag: { select: { name: true } } },
} satisfies Prisma.Blog$tagsArgs;

export function tagNames(tags: { tag: { name: string } }[]) {
  return tags.map(({ tag }) => tag.name);
}
