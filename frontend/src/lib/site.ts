// サイト全体の設定
export const SITE_NAME = "ひびログ";
export const SITE_DESCRIPTION = "暮らし・旅・学びの記録をつづるブログ";
// OGP などの絶対URLに使う（本番では環境変数 SITE_URL に公開URLを設定する）
export const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

// 閲覧側の一覧の件数（screendesign.md 1-3）
export const PUBLIC_PER_PAGE = 12;
