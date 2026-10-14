// V-01. ブログ一覧（トップ）
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import BlogGrid from "@/components/BlogGrid";
import PaginationNav from "@/components/PaginationNav";
import { getBlogs } from "@/lib/api";
import { PUBLIC_PER_PAGE, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { parsePage } from "@/lib/search-params";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const page = parsePage((await searchParams).page);
  const { data: blogs, meta } = await getBlogs({ page, perPage: PUBLIC_PER_PAGE });

  return (
    <>
      <Hero />
      <Container maxWidth="lg" sx={{ mt: { xs: 5, md: 7 } }}>
        <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 4 }}>
          <Typography variant="h6" component="h2">
            新着記事
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            全{meta.total}件
          </Typography>
        </Box>
        <BlogGrid blogs={blogs} emptyMessage="まだ記事がありません" />
        <PaginationNav page={meta.page} totalPages={meta.total_pages} basePath="/" />
      </Container>
    </>
  );
}

// トップの見出し
function Hero() {
  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 32, md: 48 }, lineHeight: 1.2 }}>
          {SITE_NAME}
        </Typography>
        <Typography sx={{ mt: 2, color: "text.secondary", fontSize: { xs: 15, md: 17 } }}>
          {SITE_DESCRIPTION}
        </Typography>
      </Container>
    </Box>
  );
}
