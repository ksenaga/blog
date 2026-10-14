// 管理APIのレスポンスの型（APIdesign.md 5〜7章）
import type { JSONContent } from "@tiptap/core";

export type BlogStatus = "draft" | "scheduled" | "private" | "public";

export type PageMeta = { page: number; per_page: number; total: number; total_pages: number };
export type Paginated<T> = { data: T[]; meta: PageMeta };

export type BlogImage = { id: number; url: string; alt: string; width: number; height: number };

export type CmsBlog = {
  id: number;
  slug: string;
  title: string;
  body?: JSONContent;
  status: BlogStatus;
  published_at: string | null;
  first_published_at: string | null;
  images: BlogImage[];
  thumbnail_url: string | null;
  tags: string[];
  author: { id: number; name: string; deleted: boolean };
  editable: boolean;
  allowed_transitions: (BlogStatus | "deleted")[];
  version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by: { id: number; name: string } | null;
  restorable: boolean;
};

export type CmsUserDetail = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
  avatar_url: string | null;
  blog_count: number;
  created_at: string;
  updated_at: string;
};

export type Dashboard = {
  blog_counts: Record<BlogStatus | "deleted", number>;
  unread_notification_count: number;
  recent_blogs: { id: number; title: string; status: BlogStatus; updated_at: string }[];
};

export type Notification = {
  id: number;
  type: string;
  message: string;
  blog: { id: number; title: string; deleted: boolean } | null;
  actor: { id: number; name: string };
  read_at: string | null;
  created_at: string;
};

export type CmsTag = {
  id: number;
  name: string;
  blog_count: number;
  template_count: number;
  created_at: string;
};

export type TagTemplate = {
  id: number;
  name: string;
  tags: string[];
  created_by: { id: number; name: string };
  editable: boolean;
  created_at: string;
  updated_at: string;
};
