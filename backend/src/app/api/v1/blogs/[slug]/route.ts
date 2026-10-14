// P-2. ブログ詳細
import { z } from "zod";
import { errorResponse } from "@/lib/api";
import { avatarUrl } from "@/lib/avatar";
import { toExcerpt } from "@/lib/blog-content";
import { prisma } from "@/lib/prisma";
import { isPubliclyVisible, thumbnailUrl } from "@/lib/public-blog";
import { imageUrl } from "@/lib/storage";
import { blogTagsInclude, tagNames } from "@/lib/tags";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const notFound = () => errorResponse(404, "NOT_FOUND", "ブログが見つかりません");

  // slug は UUID。形式が違えば DB を見ずに 404
  if (!z.uuid().safeParse(slug).success) return notFound();

  const blog = await prisma.blog.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, name: true, avatarStorageKey: true } },
      thumbnail: { select: { storageKey: true } },
      images: { orderBy: { id: "asc" } },
      tags: blogTagsInclude,
    },
  });
  if (!blog || blog.deletedAt) return notFound();

  if (!isPubliclyVisible(blog)) {
    // 一度公開したことがあるブログだけ「非公開中です」を返す。未公開のものは存在を知らせない
    return blog.firstPublishedAt
      ? errorResponse(403, "BLOG_PRIVATE", "このブログは現在非公開中です")
      : notFound();
  }

  return Response.json({
    data: {
      slug: blog.slug,
      title: blog.title,
      excerpt: toExcerpt(blog.bodyText),
      thumbnail_url: thumbnailUrl(blog.thumbnail),
      body_html: blog.bodyHtml,
      images: blog.images.map((image) => ({
        id: image.id,
        url: imageUrl(image.storageKey),
        alt: image.alt,
        width: image.width,
        height: image.height,
      })),
      author: { id: blog.author.id, name: blog.author.name, avatar_url: avatarUrl(blog.author.avatarStorageKey) },
      tags: tagNames(blog.tags),
      created_at: blog.createdAt,
      published_at: blog.publishedAt,
      updated_at: blog.updatedAt,
    },
  });
}
