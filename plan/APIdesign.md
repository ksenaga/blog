# API設計書

関連資料：[requirements.md](requirements.md) / [DBdesign.md](DBdesign.md) / [screendesign.md](screendesign.md)

## 目次
1. [共通仕様](#1-共通仕様)
2. [API一覧](#2-api一覧)
3. [公開API](#3-公開api)
4. [認証API](#4-認証api)
5. [管理API：ブログ](#5-管理apiブログ)
6. [管理API：ユーザー](#6-管理apiユーザー)
7. [管理API：ダッシュボード・通知](#7-管理apiダッシュボード通知)
8. [操作ログ](#8-操作ログ)

---

## 1. 共通仕様

### 1-1. 基本

| 項目 | 内容 |
|---|---|
| ベースURL | `/api/v1` |
| 形式 | JSON（画像アップロードのみ `multipart/form-data`） |
| 文字コード | UTF-8 |
| 日時 | ISO 8601（例：`2026-10-14T10:00:00+09:00`） |
| JSONキーの命名 | snake_case |

### 1-2. APIの区分

| 区分 | パス | 認証 | 利用者 |
|---|---|---|---|
| 公開API | `/api/v1/blogs` | 不要 | 閲覧者 |
| 認証API | `/api/v1/auth/*` | 一部必要 | 管理者・ユーザー |
| 管理API | `/api/v1/cms/*` | 必要 | 管理者・ユーザー |

### 1-3. 認証（JWT）

| トークン | 有効期限 | 保存場所 | 送り方・備考 |
|---|---|---|---|
| アクセストークン | 15分 | フロントのメモリ | `Authorization: Bearer {token}` で送る。中身は `sub`（ユーザーID）、`role`、`exp` |
| リフレッシュトークン | 14日 | httpOnly / Secure / SameSite=Strict の Cookie | DBにハッシュを保存する。使うたびに新しいものに入れ替える |

| リフレッシュトークンを無効にする操作 | 無効にする範囲 |
|---|---|
| ログアウト | 使用中のトークンのみ |
| パスワード変更 | 本人の全てのトークン（変更した端末には新しいトークンを発行） |
| パスワードリセット | 対象ユーザーの全てのトークン |
| ロール変更 | 対象ユーザーの全てのトークン |
| ユーザー削除 | 対象ユーザーの全てのトークン |

### 1-4. ページング

| 種類 | 項目 | 内容 |
|---|---|---|
| リクエスト | `page` | ページ番号（初期値 1） |
| リクエスト | `per_page` | 1ページの件数（初期値 20、上限 100） |
| レスポンス | `meta.page` | 現在のページ番号 |
| レスポンス | `meta.per_page` | 1ページの件数 |
| レスポンス | `meta.total` | 総件数 |
| レスポンス | `meta.total_pages` | 総ページ数 |

### 1-5. エラー形式

| キー | 型 | 内容 |
|---|---|---|
| `error.code` | string | エラーコード |
| `error.message` | string | エラーメッセージ |
| `error.details[]` | array | 項目ごとのエラー（`field`, `message`） |

| HTTP | code | 発生する場面 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | 入力値が不正 |
| 401 | `UNAUTHENTICATED` | 未ログイン・トークンの期限切れ |
| 401 | `INVALID_CREDENTIALS` | ログイン失敗 |
| 403 | `FORBIDDEN` | 権限がない |
| 403 | `BLOG_PRIVATE` | 非公開のブログを閲覧しようとした（「非公開中です」画面を表示） |
| 404 | `NOT_FOUND` | 対象が存在しない |
| 409 | `INVALID_STATUS_TRANSITION` | 許可されていないステータス遷移 |
| 409 | `BLOG_NOT_EDITABLE` | 公開中のブログを編集・削除しようとした |
| 409 | `VERSION_CONFLICT` | 他の人が先に更新していた（楽観的ロック） |
| 409 | `AUTHOR_DELETED` | 作者が削除済みのため、ブログを復活できない |
| 409 | `LAST_ADMIN` | 最後の管理者を削除・降格しようとした |
| 413 | `FILE_TOO_LARGE` | 画像が上限サイズ（`IMAGE_MAX_SIZE_MB`）を超えている |
| 422 | `IMAGE_LIMIT_EXCEEDED` | 1記事の画像が上限枚数（`IMAGE_MAX_PER_BLOG`）を超える |
| 429 | `TOO_MANY_REQUESTS` | ログインの試行回数を超えた |
| 500 | `INTERNAL_ERROR` | サーバーエラー |

### 1-6. 通信・セキュリティ

| 項目 | 内容 |
|---|---|
| HTTPS | 全ての通信をHTTPSにする |
| HTTPでのアクセス | 301でHTTPSへリダイレクトする |
| HSTS | `Strict-Transport-Security` ヘッダーを付けて、以降は必ずHTTPSで接続させる |
| 画像の配信 | 画像URLもHTTPSにする（HTTPの画像が混ざると、ブラウザがブロックや警告をするため） |
| CORS | API は backend（Next.js の Route Handlers）で作り、frontend の rewrites で `/api/v1/*` を転送する。ブラウザからは同じオリジンに見えるため、CORS の設定はしない（他のオリジンからのリクエストは許可しない） |
| 開発環境 | ローカル（Docker）では HTTP で動かす。HTTPS・HSTS は本番環境のみ |

### 1-7. 設定値

以下の値は環境変数で管理し、コードを変更せずに変えられるようにする。

| 環境変数 | 初期値 | 内容 |
|---|---|---|
| `IMAGE_MAX_SIZE_MB` | 10 | 画像1枚の最大サイズ（MB） |
| `IMAGE_MAX_PER_BLOG` | 20 | 1記事あたりの画像の最大枚数 |
| `IMAGE_MAX_LONG_EDGE_PX` | 1600 | 変換後の画像の長辺の最大値（px） |
| `ACCESS_TOKEN_TTL_MINUTES` | 15 | アクセストークンの有効期限（分） |
| `REFRESH_TOKEN_TTL_DAYS` | 14 | リフレッシュトークンの有効期限（日） |
| `LOGIN_MAX_ATTEMPTS` | 5 | ログインの連続失敗の上限回数 |
| `LOGIN_LOCK_MINUTES` | 15 | ログインをロックする時間（分） |
| `STORAGE_DRIVER` | `local` | 画像の保存先（`local`：ローカルのディスク / `s3`：S3 互換ストレージ。本番用） |
| `LOCAL_STORAGE_DIR` | `/app/storage` | `local` のときの保存先のフォルダ（Docker のボリューム） |
| `IMAGE_BASE_URL` | `/uploads` | 画像URLのベース（本番では CDN などの HTTPS のURL） |
| `S3_ENDPOINT` / `S3_REGION` / `S3_BUCKET` | - | `s3` のときの接続先・リージョン・バケット名 |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | - | `s3` のときの接続用のキー（`.env` で管理し、Git には含めない） |

| 注意点 |
|---|
| `IMAGE_MAX_SIZE_MB` を上げる場合は、Webサーバー（Nginx の `client_max_body_size` など）のアップロード上限もあわせて上げる |
| frontend が backend へ転送するリクエストには Next.js の上限（初期値10MB）があるため、`proxyClientMaxBodySize` を `IMAGE_MAX_SIZE_MB` + 5MB に設定している（frontend/next.config.ts） |
| フロント側でも事前にサイズをチェックする場合は、ビルド時に同じ環境変数を渡す（最終的なチェックはAPI側で行う） |

---

## 2. API一覧

凡例：○ = 利用可 / ✕ = 利用不可 / 自分のみ = 自分のデータのみ利用可

### 2-1. 公開API・認証API

| No | メソッド | パス | 概要 | 管理者 | ユーザー | 閲覧者 |
|---|---|---|---|---|---|---|
| P-1 | GET | `/blogs` | ブログ一覧・検索 | ○ | ○ | ○ |
| P-2 | GET | `/blogs/{slug}` | ブログ詳細 | ○ | ○ | ○ |
| A-1 | POST | `/auth/login` | ログイン | ○ | ○ | ✕ |
| A-2 | POST | `/auth/refresh` | アクセストークンの再発行 | ○ | ○ | ✕ |
| A-3 | POST | `/auth/logout` | ログアウト | ○ | ○ | ✕ |
| A-4 | GET | `/auth/me` | ログイン中のユーザー情報 | ○ | ○ | ✕ |

※ A-2 はアクセストークンではなく、Cookie のリフレッシュトークンで認証する。

### 2-2. 管理API

| No | メソッド | パス | 概要 | 管理者 | ユーザー |
|---|---|---|---|---|---|
| B-1 | GET | `/cms/blogs` | ブログ一覧 | 全件 | 自分のみ |
| B-2 | POST | `/cms/blogs` | ブログ作成 | ○ | ○ |
| B-3 | GET | `/cms/blogs/{id}` | ブログ詳細 | ○ | 自分のみ |
| B-4 | PATCH | `/cms/blogs/{id}` | ブログ編集 | ○ | 自分のみ |
| B-5 | PATCH | `/cms/blogs/{id}/status` | ステータス変更 | ○ | 自分のみ |
| B-6 | DELETE | `/cms/blogs/{id}` | ブログ削除（論理削除） | ○ | 自分のみ |
| B-7 | GET | `/cms/blogs/deleted` | 削除一覧 | 全件 | 自分のみ |
| B-8 | POST | `/cms/blogs/{id}/restore` | ブログ復活 | ○ | 自分のみ |
| B-9 | POST | `/cms/blogs/{id}/images` | 画像アップロード | ○ | 自分のみ |
| U-1 | GET | `/cms/users` | ユーザー一覧 | ○ | ✕ |
| U-2 | POST | `/cms/users` | ユーザー作成 | ○ | ✕ |
| U-3 | GET | `/cms/users/{id}` | ユーザー詳細 | ○ | 自分のみ |
| U-4 | PATCH | `/cms/users/{id}` | ユーザー編集 | ○ | 自分のみ |
| U-5 | PUT | `/cms/users/{id}/password` | パスワード変更 | ✕ | 自分のみ |
| U-6 | POST | `/cms/users/{id}/password-reset` | パスワードリセット | ○ | ✕ |
| U-7 | DELETE | `/cms/users/{id}` | ユーザー削除 | ○ | 自分のみ |
| U-8 | POST | `/cms/users/{id}/avatar` | アイコン画像の変更（`file`。正方形に切り抜き、256×256 の WebP に変換。EXIF は削除） | ○ | 自分のみ |
| U-9 | DELETE | `/cms/users/{id}/avatar` | アイコン画像の削除 | ○ | 自分のみ |
| TG-1 | GET | `/cms/tags` | タグ一覧（`q` で検索。使われている件数が多い順。`id`・`name`・`blog_count`・`template_count`・`created_at`） | ○ | ○ |
| TG-2 | POST | `/cms/tags` | タグ作成（`name`。30文字以内、既にある名前は 400） | ○ | ○ |
| TG-3 | PATCH | `/cms/tags/{id}` | タグ名の変更（全ての記事・テンプレートに反映。既にある名前は 400） | ○ | ○ |
| TG-4 | DELETE | `/cms/tags/{id}` | タグ削除（全ての記事・テンプレートから外れる） | ○ | ○ |
| TT-1 | GET | `/cms/tag-templates` | テンプレート一覧（`id`・`name`・`tags`・`created_by`・`editable`） | ○ | ○ |
| TT-2 | POST | `/cms/tag-templates` | テンプレート作成（`name` 50文字以内、`tags` 1〜10個。ないタグは作る） | ○ | ○ |
| TT-3 | PATCH | `/cms/tag-templates/{id}` | テンプレート編集 | ○ | 自分が作ったもののみ |
| TT-4 | DELETE | `/cms/tag-templates/{id}` | テンプレート削除 | ○ | 自分が作ったもののみ |
| D-1 | GET | `/cms/dashboard` | ダッシュボードの集計 | ○ | ○ |
| D-2 | GET | `/cms/notifications` | 通知一覧 | ○ | ○ |
| D-3 | PATCH | `/cms/notifications/{id}/read` | 通知を既読にする | ○ | ○ |
| D-4 | POST | `/cms/notifications/read-all` | 通知をすべて既読にする | ○ | ○ |

---

## 3. 公開API

### P-1. ブログ一覧・検索　`GET /blogs`

| 項目 | 内容 |
|---|---|
| 取得条件 | 削除されておらず、`status = public` または「`status = scheduled` かつ `published_at` が現在日時以前」のブログ |
| 並び順 | `published_at` の降順 |

**リクエスト**

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| `q` | string | | キーワード（タイトル・本文のテキストを部分一致で検索） |
| `author_id` | integer | | 作者で絞り込む |
| `tag` | string | | タグで絞り込む（大文字・小文字・全角半角の違いは区別しない） |
| `page` / `per_page` | integer | | ページング |

**レスポンス（200）** `data[]`

| 項目 | 型 | 説明 |
|---|---|---|
| `slug` | string | URL用の識別子（UUID） |
| `title` | string | タイトル |
| `excerpt` | string | 本文の先頭120文字程度（本文JSONからテキストだけを取り出してサーバー側で生成） |
| `thumbnail_url` | string / null | 本文中の1枚目の画像。画像がなければ null |
| `author` | object | `{ id, name, avatar_url }` |
| `tags` | string[] | タグ（付けた順） |
| `created_at` | datetime | 作成日時 |
| `published_at` | datetime | 公開日時 |

### P-2. ブログ詳細　`GET /blogs/{slug}`

**ブログの状態ごとのレスポンス**

| ブログの状態 | HTTP | 画面 |
|---|---|---|
| 公開中（公開日時を過ぎた公開予定を含む） | 200 | 記事を表示 |
| 非公開（一度公開したことがある） | 403 `BLOG_PRIVATE` | 「現在は非公開中です」画面 |
| 下書き・公開日時前の公開予定・削除済み・存在しない | 404 `NOT_FOUND` | 404画面 |

**レスポンス（200）** `data`

| 項目 | 型 | 説明 |
|---|---|---|
| `slug` | string | URL用の識別子（UUID） |
| `title` | string | タイトル |
| `excerpt` | string | 本文の先頭120文字程度（ページの説明文・OGPに使う） |
| `thumbnail_url` | string / null | 本文中の1枚目の画像（OGP画像に使う） |
| `body_html` | string | 保存時に本文JSONから変換し、サニタイズしたHTML（5-7 参照） |
| `images[]` | array | `{ id, url, alt, width, height }` |
| `author` | object | `{ id, name, avatar_url }` |
| `tags` | string[] | タグ（付けた順） |
| `created_at` | datetime | 作成日時 |
| `published_at` | datetime | 公開日時 |
| `updated_at` | datetime | 更新日時 |

---

## 4. 認証API

| No | リクエスト | 成功時のレスポンス | 補足 |
|---|---|---|---|
| A-1 ログイン | `email`、`password` | 200：`access_token`、`expires_in`（900秒）、`user`。リフレッシュトークンは `Set-Cookie` で返す | 失敗時はメールとパスワードのどちらが誤りか区別せず 401 `INVALID_CREDENTIALS` |
| A-2 再発行 | なし（Cookie） | 200：A-1 と同じ形式 | リフレッシュトークンも新しいものに入れ替える。無効・期限切れなら 401 |
| A-3 ログアウト | なし（Cookie） | 204 | リフレッシュトークンを無効にし、Cookie を削除する。アクセストークンの期限が切れていてもログアウトできるよう、Cookie で判断する |
| A-4 ログインユーザー情報 | なし | 200：`{ id, name, email, role }` | |

**ログイン試行の制限**

| 条件 | 処理 |
|---|---|
| 同じメールアドレスで5回連続してログインに失敗 | 15分間、429 `TOO_MANY_REQUESTS` を返す |
| ログイン成功 | 失敗回数をリセットする |

---

## 5. 管理API：ブログ

### 5-1. ブログオブジェクト（管理側）

| 項目 | 型 | 説明 |
|---|---|---|
| `id` | integer | ブログID |
| `slug` | string | URL用の識別子（UUID。作成時に自動生成し、変更不可） |
| `title` | string | タイトル |
| `body` | object | 本文（TipTap の JSON。5-7 参照） |
| `status` | string | `draft` / `scheduled` / `private` / `public` |
| `published_at` | datetime / null | 公開日時（公開予定の場合は予定日時） |
| `first_published_at` | datetime / null | 初めて公開した日時 |
| `images[]` | array | `{ id, url, alt, width, height }` |
| `author` | object | `{ id, name }` |
| `editable` | boolean | 公開中以外なら true |
| `allowed_transitions` | array | 変更できるステータスの一覧（画面でボタンを出し分ける） |
| `version` | integer | 楽観的ロック用。更新のたびに +1 |
| `created_at` | datetime | 作成日時 |
| `updated_at` | datetime | 更新日時 |
| `deleted_at` | datetime / null | 削除日時 |
| `deleted_by` | object / null | 削除した人 `{ id, name }` |
| `restorable` | boolean | 復活できるか（削除済みで、かつ作者が削除されていなければ true） |

### 5-2. ステータス遷移

| 現在 \ 変更先 | draft | scheduled | public | private | 削除 | 編集 |
|---|---|---|---|---|---|---|
| draft | - | ○ | ○ | ✕ | ○ | ○ |
| scheduled | ✕ | - | ○ | ○ | ○ | ○ |
| public | ✕ | ✕ | - | ○ | ✕ | ✕ |
| private | ✕ | ○ | ○ | - | ○ | ○ |

| 変更先 | 処理 |
|---|---|
| scheduled | 未来の `published_at` が必須 |
| public（初回） | `published_at` と `first_published_at` を現在日時にする |
| public（非公開から再公開） | `published_at` は変えずに維持する |
| 削除 | B-6 で行う。公開中のブログは 409（非公開にしてから削除する） |
| 上記以外 | 409 `INVALID_STATUS_TRANSITION` |

**公開予定の自動公開**

| 項目 | 内容 |
|---|---|
| 取得時の判定 | 公開日時を過ぎた `scheduled` は、公開API・管理画面ともに公開として扱う |
| 定期バッチ | 公開日時を過ぎた `scheduled` のステータスを `public` に更新する |
| 両方を使う理由 | バッチが止まっても、公開が遅れないようにするため |
| 操作時の扱い | 公開日時を過ぎた `scheduled` のブログに編集・ステータス変更・削除・画像アップロードの操作が来た場合は、先に `public` へ更新してからルールを判定する（公開中として扱うため、編集・削除は 409） |

### 5-3. 各APIの詳細

| No | リクエスト | ルール・処理 | 成功時 |
|---|---|---|---|
| B-1 一覧 | `status`（カンマ区切りで複数指定可）、`author_id`（管理者のみ）、`q`（タイトル）、`tag`（タグ）、`sort`（`updated_at` / `created_at` / `published_at`）、`order`（`desc` / `asc`）、ページング | ユーザーは自分のブログのみ取得。`body` は返さない | 200 |
| B-2 作成 | `title`、`body` | 作成時のステータスは常に `draft`。slug はUUIDを自動生成する。画像は作成後に B-9 でアップロード | 201 |
| B-3 詳細 | なし | 削除済みのブログも閲覧できる | 200 |
| B-4 編集 | `title`、`body`、`tags`（文字列の配列。10個まで、1つ30文字以内）、`version`（必須） | 公開中なら 409 `BLOG_NOT_EDITABLE`。`version` が一致しなければ 409 `VERSION_CONFLICT`。slug は変更できない | 200 |
| B-5 ステータス変更 | `status`、`published_at`、`version`（必須） | 5-2 の遷移ルールに従う | 200 |
| B-6 削除 | なし | `deleted_at` に日時を入れる（論理削除）。公開中なら 409 | 204 |
| B-7 削除一覧 | B-1 と同じ（`status` を除く） | `deleted_at` の降順。`deleted_by` と `restorable` を含める | 200 |
| B-8 復活 | なし | 一度でも公開したことがあれば `private`、なければ `draft` に戻す。作者が削除済みなら 409 `AUTHOR_DELETED` | 200 |
| B-9 画像アップロード | `file`、`alt` | 公開中なら 409、上限枚数を超えたら 422 | 201 |

### 5-4. 画像アップロード（B-9）

**サーバー側の処理**

| 順番 | 処理 |
|---|---|
| 1 | ファイル形式・サイズをチェックする |
| 2 | EXIF（位置情報など）を削除する |
| 3 | 長辺が上限（`IMAGE_MAX_LONG_EDGE_PX`）を超える場合は縮小する |
| 4 | WebPに変換して保存する |

**レスポンス（201）** `data`

| 項目 | 型 | 説明 |
|---|---|---|
| `id` | integer | 画像ID |
| `url` | string | 画像URL（HTTPS） |
| `alt` | string | 代替テキスト |
| `width` / `height` | integer | 変換後のサイズ（px） |

### 5-5. 入力チェック

| 項目 | 必須 | ルール |
|---|---|---|
| `title` | ○ | 1〜100文字 |
| `body` | | TipTap の JSON。テキスト量は最大100,000文字。許可していない要素は 400（5-7 参照） |
| `file` | ○ | PNG / JPEG / WebP。最大 `IMAGE_MAX_SIZE_MB`（初期値10MB） |
| `alt` | | 最大200文字 |

### 5-6. 管理者が他人のブログを操作したとき

| 操作 | 操作ログ | 作者への通知 |
|---|---|---|
| 編集（B-4） | ○ | ○ |
| ステータス変更（B-5） | ○ | ○ |
| 削除（B-6） | ○ | ○ |
| 復活（B-8） | ○ | ○ |
| 画像の追加（B-9） | ○ | ○ |

※ 画像の削除は本文の編集（B-4）に含まれるため、編集の通知で知らせる。


### 5-7. 本文（TipTap）

本文は、リッチエディタ **TipTap** で編集する。無料（MIT ライセンス）の拡張機能だけを使い、有料の機能（共同編集のクラウド、AI 機能など）は使わない。

**保存と表示の流れ**

| 順番 | 処理 | 場所 |
|---|---|---|
| 1 | TipTap で編集し、本文を JSON で送信する | フロント（CMS） |
| 2 | JSON を検証する（許可していない要素・属性があれば 400） | API |
| 3 | JSON をそのまま保存する。あわせて、検索・抜粋用のテキストを取り出して保存する | API |
| 4 | あわせて、JSON を HTML に変換・サニタイズし、表示用として保存する | API |
| 5 | 閲覧側では、保存してある HTML を返す（閲覧のたびに変換しない） | API |

**本文で使える要素**

| 種類 | 要素 | 備考 |
|---|---|---|
| ブロック | 段落 | |
| ブロック | 見出し | h2〜h4 のみ（h1 は記事タイトルに使うため） |
| ブロック | 箇条書き・番号付きリスト | |
| ブロック | 引用 | |
| ブロック | 区切り線 | |
| ブロック | 画像 | このブログにアップロードした画像のみ（`image_id` で指定） |
| 装飾 | 太字・斜体・取り消し線・下線 | |
| 装飾 | リンク | `http` / `https` のみ。外部リンクには `rel="noopener noreferrer"` を付ける |

**画像の挿入**

| 順番 | 処理 |
|---|---|
| 1 | エディタに画像をドラッグ＆ドロップするか、ツールバーの画像ボタンで選ぶ |
| 2 | フロントが B-9 で画像をアップロードする |
| 3 | レスポンスの `id`・`url`・`alt` を使って、エディタに画像を挿入する |
| 4 | 保存時に API は、本文中の `image_id` がこのブログの画像であることを確認する |

**画像の代替テキスト・削除**

| 操作 | 処理 |
|---|---|
| 代替テキスト（alt）の変更 | エディタ上で画像ノードの `alt` を変更する。保存（B-4）したときに、API が本文の `alt` を `blog_images` に反映する |
| 画像の削除 | エディタから画像を取り除いて保存する。本文で使われなくなった画像ファイルは、定期バッチで削除する（DBdesign.md 5-6） |

---

## 6. 管理API：ユーザー

### 6-1. ユーザーオブジェクト

| 項目 | 型 | 説明 |
|---|---|---|
| `id` | integer | ユーザーID |
| `name` | string | 表示名 |
| `email` | string | メールアドレス（ログインID） |
| `role` | string | `admin` / `user` |
| `avatar_url` | string / null | アイコン画像のURL（未設定なら null） |
| `blog_count` | integer | ブログ数 |
| `created_at` | datetime | 作成日時 |
| `updated_at` | datetime | 更新日時 |

### 6-2. 各APIの詳細

| No | リクエスト | ルール・処理 | 成功時 |
|---|---|---|---|
| U-1 一覧 | `q`（名前・メールアドレス）、`role`、ページング | 管理者のみ。削除済みのユーザーは含めない | 200 |
| U-2 作成 | `name`、`email`、`password`、`role` | 管理者のみ | 201 |
| U-3 詳細 | なし | ユーザーは自分のみ閲覧できる | 200 |
| U-4 編集 | `name`、`email`、`role` | ユーザーは `role` を変更できない（403）。最後の管理者を降格すると 409 `LAST_ADMIN` | 200 |
| U-5 パスワード変更 | `current_password`、`new_password` | 本人のみ。変更後、他の端末のログインを無効にする。この端末には新しいトークンを発行する（レスポンスは A-1 と同じ形式） | 200 |
| U-6 パスワードリセット | `new_password` | 管理者のみ。新しいパスワードは本人に口頭などで伝える。対象ユーザーのログインを無効にする | 204 |
| U-7 削除 | なし | 下記 6-3 の処理を行う | 204 |

### 6-3. ユーザー削除（U-7）の処理

| 順番 | 処理 |
|---|---|
| 1 | 最後の管理者でないことを確認する（最後の管理者なら 409 `LAST_ADMIN`） |
| 2 | ユーザーを論理削除する |
| 3 | そのユーザーのブログを全て論理削除する（削除一覧へ移す） |
| 4 | そのユーザーのリフレッシュトークンを全て無効にする |
| 5 | 本人が自分を削除した場合は、そのままログアウトする |

※ 2〜4 は同じトランザクションで行う。

### 6-4. 入力チェック

| 項目 | 必須 | ルール |
|---|---|---|
| `name` | ○ | 1〜50文字 |
| `email` | ○ | メールアドレス形式。重複不可 |
| `password` | ○ | 8〜72文字。英字と数字をそれぞれ1文字以上含む |
| `role` | ○ | `admin` / `user` |

---

## 7. 管理API：ダッシュボード・通知

### 7-1. 各APIの詳細

| No | リクエスト | 成功時 | 補足 |
|---|---|---|---|
| D-1 ダッシュボード | なし | 200 | ユーザーは自分のブログ、管理者は全体を集計する |
| D-2 通知一覧 | `unread_only`、ページング | 200 | 自分宛ての通知のみ。新しい順 |
| D-3 既読 | なし | 204 | |
| D-4 すべて既読 | なし | 204 | |

### 7-2. ダッシュボード（D-1）のレスポンス

| 項目 | 型 | 説明 |
|---|---|---|
| `blog_counts` | object | ステータス別の件数（`draft` / `scheduled` / `private` / `public`）と削除済みの件数（`deleted`） |
| `unread_notification_count` | integer | 未読の通知数 |
| `recent_blogs[]` | array | 最近更新したブログ5件（`id`, `title`, `status`, `updated_at`） |

### 7-3. 通知一覧（D-2）のレスポンス

| 項目 | 型 | 説明 |
|---|---|---|
| `id` | integer | 通知ID |
| `type` | string | 通知の種類（下表） |
| `message` | string | 表示する文章（例：「管理者 佐藤 があなたのブログ「沖縄旅行記」を編集しました」） |
| `blog` | object / null | 対象のブログ `{ id, title, deleted }`。`deleted` は削除済みなら true |
| `actor` | object | 操作した人 `{ id, name }` |
| `read_at` | datetime / null | 既読日時 |
| `created_at` | datetime | 通知日時 |

### 7-4. 通知の種類

| type | 発生する操作 |
|---|---|
| `blog_updated_by_admin` | 管理者が他人のブログを編集した |
| `blog_status_changed_by_admin` | 管理者が他人のブログのステータスを変更した |
| `blog_deleted_by_admin` | 管理者が他人のブログを削除した |
| `blog_restored_by_admin` | 管理者が他人のブログを復活した |
| `blog_images_changed_by_admin` | 管理者が他人のブログに画像を追加した |
| `password_reset_by_admin` | 管理者がパスワードをリセットした |

---

## 8. 操作ログ

| 項目 | 内容 |
|---|---|
| 記録するタイミング | 管理者が他人のリソースを操作したとき（5-6 参照） |
| 記録する場所 | API側で記録する（テーブル定義は DBdesign.md） |
| 閲覧API | 初期リリースでは用意しない |

| 記録する項目 | 例 |
|---|---|
| 操作者 | ユーザーID |
| 操作の種類 | `blog.update` / `blog.status_change` / `blog.delete` など |
| 対象の種類・対象ID | `blog` / 12 |
| 変更前後の差分 | 変更前と変更後の値（JSON） |
| IPアドレス | 192.0.2.1 |
| 日時 | 2026-10-14T10:00:00+09:00 |
