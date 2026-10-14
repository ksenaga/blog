import type { NextConfig } from "next";

// 画像1枚の上限サイズ（MB）。backend と同じ環境変数を使う
const imageMaxSizeMb = Number(process.env.IMAGE_MAX_SIZE_MB) || 10;

const nextConfig: NextConfig = {
  // 画像を選んだ時点でサイズを確認するため、ブラウザにも上限を渡す（最終的な確認は backend で行う）
  env: {
    NEXT_PUBLIC_IMAGE_MAX_SIZE_MB: String(imageMaxSizeMb),
  },
  experimental: {
    // 非公開ブログで forbidden()（403）を使うため
    authInterrupts: true,
    // backend へ転送するリクエストの上限（初期値は10MB）。画像の上限サイズを少し超えるものまで転送し、
    // backend がサイズ超過（413）を返せるようにする
    proxyClientMaxBodySize: `${imageMaxSizeMb + 5}mb`,
  },
  // /api/v1/* と /uploads/* を backend へ転送する（ブラウザからは同じオリジンに見えるため CORS 不要）
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
      // アップロードした画像（ローカル開発で STORAGE_DRIVER=local のとき）
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
