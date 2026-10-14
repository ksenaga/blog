-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(10) NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blogs" (
    "id" SERIAL NOT NULL,
    "slug" UUID NOT NULL DEFAULT gen_random_uuid(),
    "author_id" INTEGER NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "body_json" JSONB NOT NULL DEFAULT '{"type":"doc","content":[]}',
    "body_text" TEXT NOT NULL DEFAULT '',
    "body_html" TEXT NOT NULL DEFAULT '',
    "thumbnail_image_id" INTEGER,
    "status" VARCHAR(10) NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMPTZ,
    "first_published_at" TIMESTAMPTZ,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" INTEGER,

    CONSTRAINT "blogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_images" (
    "id" SERIAL NOT NULL,
    "blog_id" INTEGER NOT NULL,
    "storage_key" VARCHAR(255) NOT NULL,
    "alt" VARCHAR(200) NOT NULL DEFAULT '',
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "file_size" INTEGER NOT NULL,
    "original_filename" VARCHAR(255) NOT NULL,
    "uploaded_by" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "replaced_by_id" INTEGER,
    "user_agent" VARCHAR(500),
    "ip_address" INET,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_attempts" (
    "email" VARCHAR(255) NOT NULL,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "actor_id" INTEGER NOT NULL,
    "blog_id" INTEGER,
    "type" VARCHAR(50) NOT NULL,
    "message" VARCHAR(255) NOT NULL,
    "read_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "actor_id" INTEGER NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "target_type" VARCHAR(20) NOT NULL,
    "target_id" INTEGER NOT NULL,
    "changes" JSONB,
    "ip_address" INET,
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blogs_slug_key" ON "blogs"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_images_storage_key_key" ON "blog_images"("storage_key");

-- CreateIndex
CREATE INDEX "blog_images_blog_id_idx" ON "blog_images"("blog_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_replaced_by_id_key" ON "refresh_tokens"("replaced_by_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_target_type_target_id_created_at_idx" ON "audit_logs"("target_type", "target_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_thumbnail_image_id_fkey" FOREIGN KEY ("thumbnail_image_id") REFERENCES "blog_images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_images" ADD CONSTRAINT "blog_images_blog_id_fkey" FOREIGN KEY ("blog_id") REFERENCES "blogs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_images" ADD CONSTRAINT "blog_images_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_replaced_by_id_fkey" FOREIGN KEY ("replaced_by_id") REFERENCES "refresh_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_blog_id_fkey" FOREIGN KEY ("blog_id") REFERENCES "blogs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
-- 以下は Prisma のスキーマで書けないため手で追記（DBdesign.md 4章）
-- ============================================================

-- 拡張機能：日本語の部分一致検索を速くする
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 4-1. users
ALTER TABLE "users" ADD CONSTRAINT "users_role_check" CHECK ("role" IN ('admin', 'user'));
-- 削除されていないユーザーの中でのみメールアドレスをユニークにする
CREATE UNIQUE INDEX "users_email_active_key" ON "users" ("email") WHERE "deleted_at" IS NULL;

-- 4-2. blogs
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_status_check" CHECK ("status" IN ('draft', 'scheduled', 'private', 'public'));
-- 公開予定には公開日時を必須にする
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_scheduled_published_at_check" CHECK ("status" <> 'scheduled' OR "published_at" IS NOT NULL);
-- 公開一覧
CREATE INDEX "blogs_public_list_idx" ON "blogs" ("status", "published_at" DESC) WHERE "deleted_at" IS NULL;
-- 管理画面の自分のブログ一覧
CREATE INDEX "blogs_author_list_idx" ON "blogs" ("author_id", "updated_at" DESC) WHERE "deleted_at" IS NULL;
-- 削除一覧
CREATE INDEX "blogs_deleted_list_idx" ON "blogs" ("deleted_at" DESC) WHERE "deleted_at" IS NOT NULL;
-- 定期バッチで公開予定を探す
CREATE INDEX "blogs_scheduled_idx" ON "blogs" ("status", "published_at") WHERE "status" = 'scheduled';
-- キーワードの部分一致検索
CREATE INDEX "blogs_title_trgm_idx" ON "blogs" USING GIN ("title" gin_trgm_ops);
CREATE INDEX "blogs_body_text_trgm_idx" ON "blogs" USING GIN ("body_text" gin_trgm_ops);

-- 4-4. refresh_tokens
-- ユーザーの有効なトークンを一括で無効にする
CREATE INDEX "refresh_tokens_active_user_idx" ON "refresh_tokens" ("user_id") WHERE "revoked_at" IS NULL;

-- 4-6. notifications
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_type_check" CHECK ("type" IN (
  'blog_updated_by_admin',
  'blog_status_changed_by_admin',
  'blog_deleted_by_admin',
  'blog_restored_by_admin',
  'blog_images_changed_by_admin',
  'password_reset_by_admin'
));
-- 未読の件数
CREATE INDEX "notifications_unread_idx" ON "notifications" ("user_id") WHERE "read_at" IS NULL;
