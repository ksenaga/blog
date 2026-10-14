// API の共通処理（APIdesign.md 1-4・1-5）
import { z } from "zod";

// 入力エラーのメッセージを日本語にする
z.config(z.locales.ja());

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "INVALID_CREDENTIALS"
  | "FORBIDDEN"
  | "BLOG_PRIVATE"
  | "NOT_FOUND"
  | "INVALID_STATUS_TRANSITION"
  | "BLOG_NOT_EDITABLE"
  | "VERSION_CONFLICT"
  | "AUTHOR_DELETED"
  | "LAST_ADMIN"
  | "FILE_TOO_LARGE"
  | "IMAGE_LIMIT_EXCEEDED"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_ERROR";

export function errorResponse(
  status: number,
  code: ErrorCode,
  message: string,
  details?: { field: string; message: string }[],
) {
  return Response.json({ error: { code, message, ...(details && { details }) } }, { status });
}

export function validationError(error: z.ZodError) {
  return errorResponse(
    400,
    "VALIDATION_ERROR",
    "入力内容に誤りがあります",
    error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
  );
}

// 1つの項目のエラー（400 VALIDATION_ERROR）
export function fieldError(field: string, message: string) {
  return errorResponse(400, "VALIDATION_ERROR", "入力内容に誤りがあります", [{ field, message }]);
}

// ページングのパラメータ
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
});

export function paginationMeta(page: number, perPage: number, total: number) {
  return { page, per_page: perPage, total, total_pages: Math.ceil(total / perPage) };
}

// URLのクエリを zod で読むためにオブジェクトにする（空文字は未指定として扱う）
export function searchParamsToObject(searchParams: URLSearchParams) {
  return Object.fromEntries([...searchParams].filter(([, value]) => value !== ""));
}
