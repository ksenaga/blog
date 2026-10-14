// 定期バッチ（DBdesign.md 5-6）
// 起動：npm run worker（Docker では worker コンテナで動く）
import cron from "node-cron";
import { prisma } from "@/lib/prisma";

// 公開予定の公開（毎分）
async function publishScheduledBlogs() {
  const count = await prisma.$executeRaw`
    UPDATE blogs
    SET status = 'public',
        first_published_at = COALESCE(first_published_at, published_at),
        version = version + 1,
        updated_at = now()
    WHERE status = 'scheduled'
      AND published_at <= now()
      AND deleted_at IS NULL
  `;
  if (count > 0) console.log(`[publish-scheduled] ${count}件を公開しました`);
}

// 期限切れトークンの削除（1日1回）
async function deleteExpiredRefreshTokens() {
  const { count } = await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  console.log(`[delete-expired-tokens] ${count}件を削除しました`);
}

// ログイン試行の掃除（1日1回）
async function deleteOldLoginAttempts() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const { count } = await prisma.loginAttempt.deleteMany({
    where: { updatedAt: { lt: oneDayAgo } },
  });
  console.log(`[delete-old-login-attempts] ${count}件を削除しました`);
}

// TODO: 未使用画像の削除（1日1回）。画像アップロードの実装時に追加する

function run(name: string, job: () => Promise<void>) {
  return async () => {
    try {
      await job();
    } catch (error) {
      console.error(`[${name}] 失敗しました`, error);
    }
  };
}

cron.schedule("* * * * *", run("publish-scheduled", publishScheduledBlogs));
// 1日1回の処理は日本時間の深夜3時に動かす
const daily = { timezone: "Asia/Tokyo" };
cron.schedule("0 3 * * *", run("delete-expired-tokens", deleteExpiredRefreshTokens), daily);
cron.schedule("10 3 * * *", run("delete-old-login-attempts", deleteOldLoginAttempts), daily);

console.log("worker を起動しました");
