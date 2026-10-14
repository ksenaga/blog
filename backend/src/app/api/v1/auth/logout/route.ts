// A-3. ログアウト
// アクセストークンの期限が切れていてもログアウトできるよう、Cookie のリフレッシュトークンで判断する
import { NextResponse, type NextRequest } from "next/server";
import { clearRefreshCookie, revokeRefreshTokenFromCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  await revokeRefreshTokenFromCookie(request);
  const response = new NextResponse(null, { status: 204 });
  clearRefreshCookie(response);
  return response;
}
