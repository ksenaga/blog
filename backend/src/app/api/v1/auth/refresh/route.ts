// A-2. アクセストークンの再発行
import type { NextRequest } from "next/server";
import { errorResponse } from "@/lib/api";
import { rotateRefreshToken, tokenResponse } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const rotated = await rotateRefreshToken(request);
  if (!rotated) {
    return errorResponse(401, "UNAUTHENTICATED", "ログインの有効期限が切れました。再度ログインしてください");
  }
  return tokenResponse(rotated.user, request, rotated.token);
}
