import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import BlogCard from "@/components/BlogCard";
import type { BlogSummary } from "@/lib/api";

// スマートフォン1列・タブレット2列・PC3列（screendesign.md 1-2）
export default function BlogGrid({ blogs, emptyMessage }: { blogs: BlogSummary[]; emptyMessage: string }) {
  if (blogs.length === 0) {
    return (
      <Box sx={{ py: 10, textAlign: "center", color: "text.secondary" }}>
        <ArticleOutlinedIcon sx={{ fontSize: 56, opacity: 0.4 }} />
        <Typography sx={{ mt: 2 }}>{emptyMessage}</Typography>
      </Box>
    );
  }

  return (
    <Grid container rowSpacing={{ xs: 5, md: 7 }} columnSpacing={4}>
      {blogs.map((blog) => (
        <Grid key={blog.slug} size={{ xs: 12, sm: 6, md: 4 }}>
          <BlogCard blog={blog} />
        </Grid>
      ))}
    </Grid>
  );
}
