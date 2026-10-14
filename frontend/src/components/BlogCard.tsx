import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AuthorAvatar from "@/components/AuthorAvatar";
import NextLink from "@/components/NextLink";
import type { BlogSummary } from "@/lib/api";
import { formatDate } from "@/lib/format";

const clamp = (lines: number) => ({
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical" as const,
  overflow: "hidden",
});

// ブログ一覧のカード（V-01・V-02）
export default function BlogCard({ blog }: { blog: BlogSummary }) {
  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.12)",
        },
        "&:hover .blog-card-image": { transform: "scale(1.05)" },
      }}
    >
      {/* カード全体を押すと詳細（V-03）へ */}
      <CardActionArea href={`/blog/${blog.slug}`} sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "stretch" }}>
        <Box sx={{ position: "relative", aspectRatio: "16 / 9", overflow: "hidden", bgcolor: "action.hover" }}>
          <Box
            component="img"
            className="blog-card-image"
            src={blog.thumbnail_url ?? "/no-image.svg"}
            alt=""
            loading="lazy"
            width={1600}
            height={900}
            sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.5s ease" }}
          />
        </Box>
        <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1, p: 2.5 }}>
          <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700, letterSpacing: "0.04em" }}>
            {formatDate(blog.published_at)}
          </Typography>
          <Typography variant="h6" component="h2" sx={{ ...clamp(2), fontSize: 18, lineHeight: 1.5 }}>
            {blog.title}
          </Typography>
          <Typography variant="body2" sx={{ ...clamp(3), color: "text.secondary", lineHeight: 1.8 }}>
            {blog.excerpt}
          </Typography>
        </CardContent>
      </CardActionArea>

      {/* 作者名を押すと、その作者で絞り込んだ検索結果（V-02）へ */}
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", px: 2.5, pb: 2.5 }}>
        <AuthorAvatar author={blog.author} />
        <Link
          component={NextLink}
          href={`/search?author_id=${blog.author.id}`}
          underline="hover"
          variant="body2"
          sx={{ color: "text.primary", fontWeight: 600 }}
        >
          {blog.author.name}
        </Link>
      </Stack>
    </Card>
  );
}
