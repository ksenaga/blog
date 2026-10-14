// B-9. 画像アップロード（APIdesign.md 5-4）
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { errorResponse, fieldError } from "@/lib/api";
import { quoteTitle, recordAdminAction } from "@/lib/admin-actions";
import { authenticate } from "@/lib/auth";
import { config } from "@/lib/config";
import { effectiveStatus, loadBlog, notEditable } from "@/lib/cms-blog";
import { prisma } from "@/lib/prisma";
import { imageUrl, storage } from "@/lib/storage";

const ALLOWED_FORMATS = new Set(["png", "jpeg", "webp"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticate(request);
  if (user instanceof Response) return user;

  const blog = await loadBlog(Number((await params).id), user, { publishDue: true });
  if (blog instanceof Response) return blog;
  if (effectiveStatus(blog) === "public") return notEditable();

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return fieldError("file", "画像を選択してください");
  const alt = String(form?.get("alt") ?? "").slice(0, 200);

  // 1. ファイル形式・サイズのチェック
  if (file.size > config.imageMaxSizeMb * 1024 * 1024) {
    return errorResponse(413, "FILE_TOO_LARGE", `画像のサイズが上限（${config.imageMaxSizeMb}MB）を超えています`);
  }
  const count = await prisma.blogImage.count({ where: { blogId: blog.id } });
  if (count >= config.imageMaxPerBlog) {
    return errorResponse(
      422,
      "IMAGE_LIMIT_EXCEEDED",
      `1つの記事に追加できる画像は${config.imageMaxPerBlog}枚までです`,
    );
  }

  const input = Buffer.from(await file.arrayBuffer());
  // 拡張子や Content-Type ではなく、中身から形式を判定する
  const metadata = await sharp(input).metadata().catch(() => null);
  if (!metadata?.format || !ALLOWED_FORMATS.has(metadata.format)) {
    return fieldError("file", "PNG・JPEG・WebP の画像を選択してください");
  }

  // 2〜4. EXIF の向きを反映してから EXIF を削除し、縮小して WebP に変換する
  const { data, info } = await sharp(input)
    .rotate()
    .resize({
      width: config.imageMaxLongEdgePx,
      height: config.imageMaxLongEdgePx,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  const storageKey = `blogs/${blog.id}/${randomUUID()}.webp`;
  await storage.put(storageKey, data, "image/webp");

  const image = await prisma.$transaction(async (tx) => {
    const created = await tx.blogImage.create({
      data: {
        blogId: blog.id,
        storageKey,
        alt,
        width: info.width,
        height: info.height,
        fileSize: info.size,
        originalFilename: file.name.slice(0, 255) || "image",
        uploadedById: user.id,
      },
    });
    await recordAdminAction(
      {
        actor: user,
        ownerId: blog.authorId,
        action: "blog.image_add",
        targetType: "blog",
        targetId: blog.id,
        changes: { image_id: created.id },
        notification: {
          type: "blog_images_changed_by_admin",
          message: `管理者 ${user.name} があなたのブログ${quoteTitle(blog.title)}に画像を追加しました`,
          blogId: blog.id,
        },
        request,
      },
      tx,
    );
    return created;
  });

  return Response.json(
    {
      data: {
        id: image.id,
        url: imageUrl(image.storageKey),
        alt: image.alt,
        width: image.width,
        height: image.height,
      },
    },
    { status: 201 },
  );
}
