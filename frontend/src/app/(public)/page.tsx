// V-01. ブログ一覧（トップ）
import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import BlogGrid from "@/components/BlogGrid";
import PaginationNav from "@/components/PaginationNav";
import SearchBox from "@/components/SearchBox";
import { getBlogs } from "@/lib/api";
import { PUBLIC_PER_PAGE, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { parsePage } from "@/lib/search-params";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const page = parsePage((await searchParams).page);
  const { data: blogs, meta } = await getBlogs({ page, perPage: PUBLIC_PER_PAGE });

  return (
    <>
      <Hero />
      <Container maxWidth="lg" sx={{ mt: { xs: 5, md: 8 } }}>
        <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 3 }}>
          <Typography variant="h5" component="h2">
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

// トップのメインビジュアル
function Hero() {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        py: { xs: 8, md: 12 },
        textAlign: "center",
        isolation: "isolate",
        // 背景のグラデーション。下に向かって自然に消す（文字や検索ボックスは消さない）
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          zIndex: -1,
          maskImage: "linear-gradient(to bottom, #000 60%, transparent)",
          background:
            "radial-gradient(60% 80% at 15% 20%, rgba(99, 102, 241, 0.28), transparent 70%)," +
            "radial-gradient(50% 70% at 85% 30%, rgba(219, 39, 119, 0.22), transparent 70%)," +
            "radial-gradient(60% 60% at 50% 100%, rgba(14, 165, 233, 0.18), transparent 70%)",
        },
      }}
    >
      <Container maxWidth="md">
        <Typography
          variant="overline"
          sx={{ color: "primary.main", fontWeight: 800, letterSpacing: "0.3em" }}
        >
          WELCOME TO {SITE_NAME}
        </Typography>
        <Typography
          variant="h2"
          component="h1"
          sx={{
            mt: 1,
            fontSize: { xs: 28, sm: 44, md: 56 },
            lineHeight: 1.25,
            background: "linear-gradient(120deg, #4f46e5 10%, #db2777 60%, #f97316 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          毎日に、ちいさな発見を。
        </Typography>
        <Typography sx={{ mt: 2.5, color: "text.secondary", fontSize: { xs: 15, md: 17 } }}>
          {SITE_DESCRIPTION}
        </Typography>
        <Box sx={{ mt: 4, mx: "auto", maxWidth: 520 }}>
          <Suspense>
            <SearchBox size="large" />
          </Suspense>
        </Box>
      </Container>
    </Box>
  );
}
