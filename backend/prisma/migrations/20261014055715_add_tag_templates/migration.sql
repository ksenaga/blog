-- CreateTable
CREATE TABLE "tag_templates" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tag_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag_template_tags" (
    "template_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tag_template_tags_pkey" PRIMARY KEY ("template_id","tag_id")
);

-- CreateIndex
CREATE INDEX "tag_template_tags_tag_id_idx" ON "tag_template_tags"("tag_id");

-- AddForeignKey
ALTER TABLE "tag_templates" ADD CONSTRAINT "tag_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_template_tags" ADD CONSTRAINT "tag_template_tags_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "tag_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_template_tags" ADD CONSTRAINT "tag_template_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
