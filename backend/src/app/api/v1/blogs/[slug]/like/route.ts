// P-3. いいねの状態 / P-4. いいねする / P-5. いいねを取り消す
// 閲覧者はログインしないため、ブラウザごとに発行する識別子（Cookie）で1回に制限する
import { createHash, randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { isPubliclyVisible } from "@/lib/public-blog";

const VISITOR_COOKIE = "visitor_id";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1年

type Context = { params: Promise<{ slug: string }> };

const hashVisitor = (visitorId: string) => createHash("sha256").update(visitorId).digest("hex");

// いいねできるのは公開中のブログのみ
async function loadBlog(slug: string) {
  if (!z.uuid().safeParse(slug).success) return null;
  const blog = await prisma.blog.findUnique({ where: { slug } });
  return blog && !blog.deletedAt ? blog : null;
}

async function likeState(blogId: number, visitorHash: string | null) {
  const [count, liked] = await Promise.all([
    prisma.blogLike.count({ where: { blogId } }),
    visitorHash
      ? prisma.blogLike.findUnique({ where: { blogId_visitorHash: { blogId, visitorHash } } }).then(Boolean)
      : false,
  ]);
  return { like_count: count, liked };
}

function notAvailable(blog: Awaited<ReturnType<typeof loadBlog>>) {
  if (blog?.firstPublishedAt) return errorResponse(403, "BLOG_PRIVATE", "このブログは現在非公開中です");
  return errorResponse(404, "NOT_FOUND", "ブログが見つかりません");
}

export async function GET(request: NextRequest, { params }: Context) {
  const blog = await loadBlog((await params).slug);
  if (!blog || !isPubliclyVisible(blog)) return notAvailable(blog);
  const visitorId = request.cookies.get(VISITOR_COOKIE)?.value;
  return Response.json({ data: await likeState(blog.id, visitorId ? hashVisitor(visitorId) : null) });
}

export async function POST(request: NextRequest, { params }: Context) {
  const blog = await loadBlog((await params).slug);
  if (!blog || !isPubliclyVisible(blog)) return notAvailable(blog);

  // 識別子がなければ発行する
  const existing = request.cookies.get(VISITOR_COOKIE)?.value;
  const visitorId = existing && z.uuid().safeParse(existing).success ? existing : randomUUID();
  const visitorHash = hashVisitor(visitorId);

  // 同じブラウザから何度押しても1回として数える
  await prisma.blogLike.upsert({
    where: { blogId_visitorHash: { blogId: blog.id, visitorHash } },
    create: { blogId: blog.id, visitorHash },
    update: {},
  });

  const response = NextResponse.json({ data: await likeState(blog.id, visitorHash) });
  if (visitorId !== existing) {
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/v1/blogs",
      maxAge: VISITOR_COOKIE_MAX_AGE,
    });
  }
  return response;
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const blog = await loadBlog((await params).slug);
  if (!blog || !isPubliclyVisible(blog)) return notAvailable(blog);

  const visitorId = request.cookies.get(VISITOR_COOKIE)?.value;
  const visitorHash = visitorId ? hashVisitor(visitorId) : null;
  if (visitorHash) {
    await prisma.blogLike.deleteMany({ where: { blogId: blog.id, visitorHash } });
  }
  return Response.json({ data: await likeState(blog.id, visitorHash) });
}
