// V-02. ブログ検索結果
import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AuthorAvatar from "@/components/AuthorAvatar";
import BlogGrid from "@/components/BlogGrid";
import PaginationNav from "@/components/PaginationNav";
import { getBlogs } from "@/lib/api";
import { PUBLIC_PER_PAGE } from "@/lib/site";
import { parseKeyword, parsePage, parsePositiveInt } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "検索結果",
  robots: { index: false },
};

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const params = await searchParams;
  const q = parseKeyword(params.q);
  const authorId = parsePositiveInt(params.author_id);
  const page = parsePage(params.page);

  const { data: blogs, meta } =
    q || authorId
      ? await getBlogs({ q, authorId, page, perPage: PUBLIC_PER_PAGE })
      : { data: [], meta: { page: 1, per_page: PUBLIC_PER_PAGE, total: 0, total_pages: 0 } };

  // 作者で絞り込んだ場合、作者名は検索結果から取る（0件のときは見出しに出さない）
  const author = authorId ? blogs[0]?.author : undefined;
  const query: Record<string, string> = {};
  if (q) query.q = q;
  if (authorId) query.author_id = String(authorId);

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 4, md: 6 } }}>
      <Button href="/" startIcon={<ArrowBackRoundedIcon />} sx={{ mb: 3, ml: -1.5 }}>
        トップへ戻る
      </Button>

      <Box sx={{ mb: 4 }}>
        {author ? (
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <AuthorAvatar author={author} size={56} />
            <Box>
              <Typography variant="h4" component="h1">
                {author.name} の記事
              </Typography>
              <Typography sx={{ color: "text.secondary", mt: 0.5 }}>{meta.total}件</Typography>
            </Box>
          </Stack>
        ) : (
          <>
            <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 800, letterSpacing: "0.2em" }}>
              SEARCH
            </Typography>
            <Typography variant="h4" component="h1">
              {q ? `「${q}」の検索結果` : "記事を検索"}
            </Typography>
            {q && <Typography sx={{ color: "text.secondary", mt: 0.5 }}>{meta.total}件</Typography>}
          </>
        )}
      </Box>

      <BlogGrid
        blogs={blogs}
        emptyMessage={q || authorId ? "該当する記事が見つかりませんでした" : "キーワードを入力して検索してください"}
      />
      <PaginationNav page={meta.page} totalPages={meta.total_pages} query={query} basePath="/search" />
    </Container>
  );
}
