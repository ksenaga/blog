import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import NextLink from "@/components/NextLink";

// タグの一覧。押すとそのタグの記事一覧（V-02）へ
export default function TagList({ tags, max, size = "small" }: { tags: string[]; max?: number; size?: "small" | "medium" }) {
  const shown = max ? tags.slice(0, max) : tags;
  if (shown.length === 0) return null;
  return (
    <Stack direction="row" sx={{ flexWrap: "wrap", columnGap: size === "small" ? 1.25 : 1, rowGap: 0.75 }}>
      {shown.map((tag) => (
        <Link
          key={tag}
          component={NextLink}
          href={`/search?tag=${encodeURIComponent(tag)}`}
          underline="none"
          sx={
            size === "small"
              ? { fontSize: 13, color: "text.secondary", "&:hover": { color: "text.primary" } }
              : {
                  fontSize: 13,
                  color: "text.secondary",
                  border: 1,
                  borderColor: "divider",
                  borderRadius: "6px",
                  px: 1,
                  py: 0.25,
                  "&:hover": { color: "text.primary", borderColor: "text.secondary" },
                }
          }
        >
          #{tag}
        </Link>
      ))}
    </Stack>
  );
}
