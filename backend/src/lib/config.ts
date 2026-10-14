// 環境変数で変えられる設定値（APIdesign.md 1-7）
const number = (name: string, fallback: number) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

export const config = {
  accessTokenTtlMinutes: number("ACCESS_TOKEN_TTL_MINUTES", 15),
  refreshTokenTtlDays: number("REFRESH_TOKEN_TTL_DAYS", 14),
  loginMaxAttempts: number("LOGIN_MAX_ATTEMPTS", 5),
  loginLockMinutes: number("LOGIN_LOCK_MINUTES", 15),
  imageMaxSizeMb: number("IMAGE_MAX_SIZE_MB", 10),
  imageMaxPerBlog: number("IMAGE_MAX_PER_BLOG", 20),
  imageMaxLongEdgePx: number("IMAGE_MAX_LONG_EDGE_PX", 1600),
};
