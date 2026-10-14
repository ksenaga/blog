import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AuthorAvatarLink from "@/components/AuthorAvatarLink";
import NextLink from "@/components/NextLink";
import TagList from "@/components/TagList";
import type { BlogSummary } from "@/lib/api";
import { formatDate } from "@/lib/format";

const clamp = (lines: number) => ({
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical" as const,
  overflow: "hidden",
});

// ブログ一覧の記事（V-01・V-02）。枠や影は使わず、画像と文字だけで見せる
export default function BlogCard({ blog }: { blog: BlogSummary }) {
  return (
    <Box component="article" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* 画像とタイトルを押すと詳細（V-03）へ */}
      <Box
        component={NextLink}
        href={`/blog/${blog.slug}`}
        sx={{
          color: "inherit",
          textDecoration: "none",
          "&:hover .blog-card-title": { textDecoration: "underline", textUnderlineOffset: "4px" },
          "&:hover .blog-card-image": { opacity: 0.9 },
        }}
      >
        <Box
          component="img"
          className="blog-card-image"
          src={blog.thumbnail_url ?? "/no-image.svg"}
          alt=""
          loading="lazy"
          width={1600}
          height={900}
          sx={{
            display: "block",
            width: "100%",
            height: "auto",
            aspectRatio: "16 / 9",
            objectFit: "cover",
            borderRadius: "8px",
            border: 1,
            borderColor: "divider",
            transition: "opacity 0.15s",
          }}
        />
        <Typography
          variant="h6"
          component="h2"
          className="blog-card-title"
          sx={{ ...clamp(2), mt: 2, fontSize: 18, lineHeight: 1.5 }}
        >
          {blog.title}
        </Typography>
        <Typography variant="body2" sx={{ ...clamp(2), mt: 1, color: "text.secondary", lineHeight: 1.8 }}>
          {blog.excerpt}
        </Typography>
      </Box>

      <Box sx={{ mt: 1.5 }}>
        <TagList tags={blog.tags} max={3} />
      </Box>

      {/* 作者はアイコンで表示する。押すと、その作者で絞り込んだ検索結果（V-02）へ */}
      <Stack direction="row" spacing={1} sx={{ mt: "auto", pt: 1.5, alignItems: "center" }}>
        <AuthorAvatarLink author={blog.author} />
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {formatDate(blog.published_at)}
        </Typography>
      </Stack>
    </Box>
  );
}
