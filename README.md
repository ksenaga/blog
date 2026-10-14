# ブログ / CMS

ブログを表示するサイトと、ブログを管理する CMS。設計書は [plan/](plan/) を参照。

| 設計書 | 内容 |
|---|---|
| [requirements.md](plan/requirements.md) | 要件定義・技術構成 |
| [APIdesign.md](plan/APIdesign.md) | API設計 |
| [DBdesign.md](plan/DBdesign.md) | DB設計 |
| [screendesign.md](plan/screendesign.md) | 画面設計 |

## 構成

| フォルダ・コンテナ | 内容 | URL |
|---|---|---|
| `frontend` | Next.js（画面）。`/api/v1/*` と `/uploads/*` を backend へ転送する | http://localhost:3000 |
| `backend` | Next.js（API専用）・Prisma | http://localhost:4000（動作確認用） |
| `worker` | 定期バッチ（backend と同じコード） | - |
| `db` | PostgreSQL 16 | localhost:5432 |

## 起動

```bash
cp .env.example .env        # 初回のみ
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy   # 初回・マイグレーション追加時
```

動作確認：http://localhost:3000/api/v1/health が `{"status":"ok","db":"ok"}` を返せばOK。

## テスト用データ

```bash
docker compose exec backend npx prisma db seed
```

※ 実行するたびに、DB の全データとアップロード済みの画像を削除して作り直す（記事の URL も変わる）。

| 作られるもの | 内容 |
|---|---|
| ユーザー | 管理者 `admin@example.com`、ユーザー `yamada@example.com`・`suzuki@example.com`・`takahashi@example.com`・`ito@example.com`（パスワードは全員 `password123`）。アイコン画像は `backend/prisma/seed-assets/avatars/` |
| ブログ | 公開12件・非公開1件・下書き1件・公開予定1件。画像は自動生成。実行結果に各記事の URL が出る |

| 画面 | URL |
|---|---|
| ブログ（閲覧側） | http://localhost:3000 |
| 管理画面 | http://localhost:3000/cms （上のテストユーザーでログイン） |

## よく使うコマンド

| やりたいこと | コマンド |
|---|---|
| ログを見る | `docker compose logs -f backend` |
| 停止 | `docker compose down` |
| DB・画像も含めて全て消す | `docker compose down -v` |
| ライブラリを追加した後 | `docker compose up -d --build -V`（`-V` でコンテナ内の node_modules を作り直す） |
| マイグレーションを作る | `cd backend && npx prisma migrate dev --create-only --name 名前` → SQL を確認・追記 → `npx prisma migrate dev` |

## DB のマイグレーションの注意

CHECK 制約・部分インデックス・`pg_trgm` 拡張は `schema.prisma` に書けないため、マイグレーションSQLに手で追記している（[DBdesign.md](plan/DBdesign.md) 1章）。
