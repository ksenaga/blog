// V-03. ブログ詳細
import type { Metadata } from "next";
import { forbidden, notFound } from "next/navigation";
import { cache } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArticleBody from "@/components/ArticleBody";
import ArticleMeta from "@/components/ArticleMeta";
import AuthorAvatar from "@/components/AuthorAvatar";
import BlogGrid from "@/components/BlogGrid";
import NextLink from "@/components/NextLink";
import { getBlog, getBlogs } from "@/lib/api";
import { formatDate, isSameDay, readingMinutes } from "@/lib/format";

// メタ情報と本文で同じ記事を2回取りに行かないようにする
const loadBlog = cache(async (slug: string) => {
  const result = await getBlog(slug);
  if (result.kind === "private") forbidden(); // V-04（403）
  if (result.kind === "not_found") notFound(); // V-05（404）
  return result.blog;
});

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const blog = await loadBlog((await params).slug);
  const image = blog.thumbnail_url ?? "/no-image.svg";
  return {
    title: blog.title,
    description: blog.excerpt,
    openGraph: {
      type: "article",
      title: blog.title,
      description: blog.excerpt,
      url: `/blog/${blog.slug}`,
      images: [image],
      publishedTime: blog.published_at,
      authors: [blog.author.name],
    },
  };
}

export default async function BlogPage({ params }: PageProps<"/blog/[slug]">) {
  const blog = await loadBlog((await params).slug);
  const { data: latest } = await getBlogs({ perPage: 4 });
  const others = latest.filter((item) => item.slug !== blog.slug).slice(0, 3);

  return (
    <>
      <Container maxWidth="md" sx={{ mt: { xs: 3, md: 5 } }}>
        <Button href="/" startIcon={<ArrowBackRoundedIcon />} sx={{ ml: -1.5 }}>
          一覧へ戻る
        </Button>

        <Box component="header" sx={{ mt: 3, textAlign: { md: "center" } }}>
          <ArticleMeta
            publishedDate={formatDate(blog.published_at)}
            updatedDate={isSameDay(blog.published_at, blog.updated_at) ? undefined : formatDate(blog.updated_at)}
            minutes={readingMinutes(blog.body_html)}
          />
          <Typography
            variant="h3"
            component="h1"
            sx={{ mt: 2.5, fontSize: { xs: 26, sm: 32, md: 40 }, lineHeight: 1.4 }}
          >
            {blog.title}
          </Typography>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ mt: 3, alignItems: "center", justifyContent: { md: "center" } }}
          >
            <AuthorAvatar author={blog.author} size={40} />
            <Link
              component={NextLink}
              href={`/search?author_id=${blog.author.id}`}
              underline="hover"
              sx={{ color: "text.primary", fontWeight: 700 }}
            >
              {blog.author.name}
            </Link>
          </Stack>
        </Box>
      </Container>

      <Container maxWidth="md" component="article" sx={{ mt: { xs: 4, md: 6 } }}>
        <ArticleBody html={blog.body_html} />

        <Divider sx={{ my: 6 }} />
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <AuthorAvatar author={blog.author} size={56} />
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              この記事を書いた人
            </Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 18 }}>{blog.author.name}</Typography>
            <Link component={NextLink} href={`/search?author_id=${blog.author.id}`} variant="body2">
              {blog.author.name} の記事をもっと見る
            </Link>
          </Box>
        </Stack>
      </Container>

      {others.length > 0 && (
        <Container maxWidth="lg" sx={{ mt: 10 }}>
          <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
            新着記事
          </Typography>
          <BlogGrid blogs={others} emptyMessage="" />
        </Container>
      )}
    </>
  );
}
