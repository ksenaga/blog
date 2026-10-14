// 認証（APIdesign.md 1-3・4章）
// アクセストークン：JWT（Authorization: Bearer）
// リフレッシュトークン：ランダムな文字列を httpOnly Cookie に入れ、DB にはハッシュだけを保存する
import { createHash, randomBytes } from "node:crypto";
import { isIP } from "node:net";
import { SignJWT, jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api";
import { avatarUrl } from "@/lib/avatar";
import { config } from "@/lib/config";
import { prisma } from "@/lib/prisma";

export type Role = "admin" | "user";
export type AuthUser = { id: number; name: string; email: string; role: Role; avatar_url: string | null };

const REFRESH_COOKIE = "refresh_token";
// リフレッシュトークンは認証APIにだけ送られるようにする
const REFRESH_COOKIE_PATH = "/api/v1/auth";

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET が設定されていません");
  return new TextEncoder().encode(secret);
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export function toAuthUser(user: {
  id: number;
  name: string;
  email: string;
  role: string;
  avatarStorageKey: string | null;
}): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    avatar_url: avatarUrl(user.avatarStorageKey),
  };
}

// ---------- アクセストークン ----------

async function signAccessToken(user: AuthUser) {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${config.accessTokenTtlMinutes}m`)
    .sign(jwtSecret());
}

// ログイン中のユーザーを返す。未ログイン・期限切れ・削除済みなら 401 のレスポンスを返す
export async function authenticate(request: Request): Promise<AuthUser | Response> {
  const unauthenticated = () =>
    errorResponse(401, "UNAUTHENTICATED", "ログインの有効期限が切れました。再度ログインしてください");

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return unauthenticated();

  let userId: number;
  try {
    const { payload } = await jwtVerify(header.slice(7), jwtSecret(), { algorithms: ["HS256"] });
    userId = Number(payload.sub);
  } catch {
    return unauthenticated();
  }

  // ロールの変更や削除をすぐに反映するため、DB の最新の状態を使う
  const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
  return user ? toAuthUser(user) : unauthenticated();
}

export function forbiddenResponse() {
  return errorResponse(403, "FORBIDDEN", "この操作を行う権限がありません");
}

// ---------- リフレッシュトークン ----------

export function clientInfo(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    ipAddress: forwarded && isIP(forwarded) ? forwarded : null,
    userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
  };
}

async function createRefreshToken(userId: number, request: Request) {
  const token = randomBytes(32).toString("base64url");
  const record = await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + config.refreshTokenTtlDays * 24 * 60 * 60 * 1000),
      ...clientInfo(request),
    },
  });
  return { token, record };
}

function setRefreshCookie(response: NextResponse, token: string) {
  response.cookies.set(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: REFRESH_COOKIE_PATH,
    maxAge: config.refreshTokenTtlDays * 24 * 60 * 60,
  });
}

export function clearRefreshCookie(response: NextResponse) {
  response.cookies.set(REFRESH_COOKIE, "", { path: REFRESH_COOKIE_PATH, maxAge: 0 });
}

// ログイン成功時などのレスポンス（A-1 の形式）
export async function tokenResponse(user: AuthUser, request: Request, refreshToken?: string) {
  const token = refreshToken ?? (await createRefreshToken(user.id, request)).token;
  const response = NextResponse.json({
    data: {
      access_token: await signAccessToken(user),
      expires_in: config.accessTokenTtlMinutes * 60,
      user,
    },
  });
  setRefreshCookie(response, token);
  return response;
}

// ユーザーの有効なリフレッシュトークンを全て無効にする
export async function revokeAllRefreshTokens(userId: number) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// リフレッシュトークンを検証し、新しいものに入れ替える（A-2）
export async function rotateRefreshToken(request: NextRequest) {
  const token = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!token) return null;

  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!record) return null;

  // 無効にしたトークンが再び使われた：盗まれた可能性があるため、全てのトークンを無効にする
  if (record.revokedAt) {
    await revokeAllRefreshTokens(record.userId);
    return null;
  }
  if (record.expiresAt <= new Date() || record.user.deletedAt) return null;

  const next = await createRefreshToken(record.userId, request);
  // 同時に2回使われた場合に備え、まだ無効になっていないときだけ入れ替える
  const { count } = await prisma.refreshToken.updateMany({
    where: { id: record.id, revokedAt: null },
    data: { revokedAt: new Date(), replacedById: next.record.id },
  });
  if (count === 0) {
    await revokeAllRefreshTokens(record.userId);
    return null;
  }
  return { user: toAuthUser(record.user), token: next.token };
}

export async function revokeRefreshTokenFromCookie(request: NextRequest) {
  const token = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!token) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
