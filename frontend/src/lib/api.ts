// 公開APIの呼び出し（サーバーコンポーネントから使う）
// サーバーからは frontend を経由せず、backend を直接呼ぶ
import "server-only";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export type Author = { id: number; name: string };

export type BlogSummary = {
  slug: string;
  title: string;
  excerpt: string;
  thumbnail_url: string | null;
  author: Author;
  created_at: string;
  published_at: string;
};

export type BlogDetail = Omit<BlogSummary, "excerpt"> & {
  excerpt: string;
  body_html: string;
  images: { id: number; url: string; alt: string; width: number; height: number }[];
  updated_at: string;
};

export type PageMeta = { page: number; per_page: number; total: number; total_pages: number };

async function request(path: string) {
  const response = await fetch(`${BACKEND_URL}/api/v1${path}`, { cache: "no-store" });
  return response;
}

export async function getBlogs(params: {
  q?: string;
  authorId?: number;
  page?: number;
  perPage?: number;
}): Promise<{ data: BlogSummary[]; meta: PageMeta }> {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.authorId) query.set("author_id", String(params.authorId));
  if (params.page) query.set("page", String(params.page));
  if (params.perPage) query.set("per_page", String(params.perPage));

  const response = await request(`/blogs?${query}`);
  if (!response.ok) throw new Error(`ブログ一覧の取得に失敗しました（${response.status}）`);
  return response.json();
}

export type BlogResult =
  | { kind: "ok"; blog: BlogDetail }
  | { kind: "private" }
  | { kind: "not_found" };

export async function getBlog(slug: string): Promise<BlogResult> {
  const response = await request(`/blogs/${encodeURIComponent(slug)}`);
  if (response.ok) return { kind: "ok", blog: (await response.json()).data };
  if (response.status === 403) return { kind: "private" };
  if (response.status === 404) return { kind: "not_found" };
  throw new Error(`ブログの取得に失敗しました（${response.status}）`);
}
