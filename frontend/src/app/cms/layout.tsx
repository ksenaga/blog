import type { Metadata } from "next";
import CmsProviders from "@/components/cms/CmsProviders";
import { SITE_NAME } from "@/lib/site";

// 管理画面は検索エンジンに載せない（screendesign.md 1-1）
export const metadata: Metadata = {
  title: { default: `管理画面 - ${SITE_NAME}`, template: `%s | 管理画面 - ${SITE_NAME}` },
  robots: { index: false, follow: false },
};

export default function CmsLayout({ children }: LayoutProps<"/cms">) {
  return <CmsProviders>{children}</CmsProviders>;
}
