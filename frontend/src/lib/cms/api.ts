"use client";

// 管理画面からの API 呼び出し（ブラウザで使う）
// アクセストークンはメモリだけに持ち、401 のときはリフレッシュトークン（Cookie）で再発行して1回だけやり直す

export type Role = "admin" | "user";
export type CmsUser = { id: number; name: string; email: string; role: Role; avatar_url: string | null };
export type TokenResponse = { access_token: string; expires_in: number; user: CmsUser };

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: { field: string; message: string }[] = [],
  ) {
    super(message);
  }

  // 項目ごとのエラー（フォームの各入力欄の下に表示する）
  fieldErrors() {
    return Object.fromEntries(this.details.map((detail) => [detail.field, detail.message]));
  }
}

let accessToken: string | null = null;
let refreshing: Promise<TokenResponse | null> | null = null;
// 再発行に失敗したとき（ログインの有効期限切れ）に呼ばれる
let onSessionExpired: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

async function parseError(response: Response) {
  const body = await response.json().catch(() => null);
  const error = body?.error;
  return new ApiError(
    response.status,
    error?.code ?? "INTERNAL_ERROR",
    error?.message ?? "エラーが発生しました。時間をおいて再度お試しください",
    error?.details ?? [],
  );
}

// A-2. アクセストークンの再発行。同時に何度呼ばれても、リクエストは1回にまとめる
export function refreshSession(): Promise<TokenResponse | null> {
  refreshing ??= fetch("/api/v1/auth/refresh", { method: "POST", credentials: "same-origin" })
    .then(async (response) => {
      if (!response.ok) return null;
      const data: TokenResponse = (await response.json()).data;
      accessToken = data.access_token;
      return data;
    })
    .catch(() => null)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

type Options = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  formData?: FormData;
};

export async function api<T = unknown>(path: string, options: Options = {}): Promise<T> {
  const send = () => {
    const headers: Record<string, string> = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    return fetch(`/api/v1${path}`, {
      method: options.method ?? "GET",
      headers,
      credentials: "same-origin",
      body: options.formData ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
    });
  };

  let response = await send();
  // 認証API自体の 401（ログイン失敗など）は再発行の対象にしない
  if (response.status === 401 && !path.startsWith("/auth/")) {
    const refreshed = await refreshSession();
    if (!refreshed) {
      onSessionExpired?.();
      throw await parseError(response);
    }
    response = await send();
  }

  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return undefined as T;
  return response.json();
}

export function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "エラーが発生しました。時間をおいて再度お試しください";
}
