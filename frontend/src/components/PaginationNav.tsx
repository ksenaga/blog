"use client";

import Pagination from "@mui/material/Pagination";
import PaginationItem from "@mui/material/PaginationItem";
import NextLink from "@/components/NextLink";

type Props = {
  page: number;
  totalPages: number;
  // ページ番号を除いた検索条件（例：{ q: "沖縄" }）
  query?: Record<string, string>;
  basePath: string;
};

// ページング。ページ番号はURLの ?page= に入れる
export default function PaginationNav({ page, totalPages, query = {}, basePath }: Props) {
  if (totalPages <= 1) return null;

  const hrefFor = (target: number | null) => {
    const params = new URLSearchParams(query);
    if (target && target > 1) params.set("page", String(target));
    const search = params.toString();
    return search ? `${basePath}?${search}` : basePath;
  };

  return (
    <Pagination
      page={page}
      count={totalPages}
      color="primary"
      shape="rounded"
      size="large"
      sx={{ display: "flex", justifyContent: "center", mt: 6 }}
      renderItem={(item) => (
        <PaginationItem component={NextLink} href={hrefFor(item.page)} {...item} />
      )}
    />
  );
}
