// テスト用データの作成（開発環境専用）
// 実行：docker compose exec backend npx prisma db seed
// ※ 実行すると、DB の全データとアップロード済みの画像を削除してから作り直す
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import sharp from "sharp";
import type { JSONContent } from "@tiptap/core";
import { imageIds, toHtml, toText } from "@/lib/blog-content";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { resolveTagIds, setBlogTags } from "@/lib/tags";
import { processAvatar, saveAvatar } from "@/lib/avatar";

import { readFile, rm } from "node:fs/promises";
import path from "node:path";

if (process.env.NODE_ENV === "production") {
  throw new Error("本番環境では seed を実行できません");
}

const PASSWORD = "password123";
const DAY = 24 * 60 * 60 * 1000;

// ---------- 本文を組み立てるための関数 ----------
const text = (value: string): JSONContent => ({ type: "text", text: value });
const p = (...parts: (string | JSONContent)[]): JSONContent => ({
  type: "paragraph",
  content: parts.map((part) => (typeof part === "string" ? text(part) : part)),
});
const bold = (value: string): JSONContent => ({ ...text(value), marks: [{ type: "bold" }] });
const link = (value: string, href: string): JSONContent => ({
  ...text(value),
  marks: [{ type: "link", attrs: { href } }],
});
const h = (level: 2 | 3, value: string): JSONContent => ({
  type: "heading",
  attrs: { level },
  content: [text(value)],
});
const ul = (...items: string[]): JSONContent => ({
  type: "bulletList",
  content: items.map((item) => ({ type: "listItem", content: [p(item)] })),
});
const ol = (...items: string[]): JSONContent => ({
  type: "orderedList",
  content: items.map((item) => ({ type: "listItem", content: [p(item)] })),
});
const quote = (value: string): JSONContent => ({ type: "blockquote", content: [p(value)] });
const hr: JSONContent = { type: "horizontalRule" };
// 画像は記事ごとに生成した画像の番号（0始まり）で指定する
const img = (index: number, alt: string) => ({ index, alt });

type Block = JSONContent | ReturnType<typeof img>;

type SeedBlog = {
  title: string;
  author: "sato" | "yamada" | "suzuki" | "takahashi" | "ito";
  status: "public" | "private" | "draft" | "scheduled";
  daysAgo: number; // 公開日（何日前か。公開予定はマイナスで未来）
  tags: string[];
  palette: [string, string, string][]; // 画像ごとの配色
  body: Block[];
};

// ---------- 画像の生成（グラデーションの抽象画） ----------
function artwork([from, to, accent]: [string, string, string], seed: number) {
  const rand = (n: number) => {
    const x = Math.sin(seed * 9301 + n * 49297) * 233280;
    return x - Math.floor(x);
  };
  const circles = Array.from({ length: 6 }, (_, i) => {
    const r = 80 + rand(i) * 260;
    return `<circle cx="${rand(i + 10) * 1600}" cy="${rand(i + 20) * 900}" r="${r}" fill="${accent}" opacity="${0.12 + rand(i + 30) * 0.25}"/>`;
  }).join("");
  const wave = `<path d="M0 ${620 + rand(40) * 80} C 400 ${520 + rand(41) * 120}, 900 ${760 + rand(42) * 80}, 1600 ${600 + rand(43) * 100} L1600 900 L0 900 Z" fill="#ffffff" opacity="0.18"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
    </linearGradient></defs>
    <rect width="1600" height="900" fill="url(#g)"/>${circles}${wave}
  </svg>`;
}

const palettes = {
  ocean: ["#0ea5e9", "#6366f1", "#a5f3fc"],
  sunset: ["#f97316", "#db2777", "#fde68a"],
  forest: ["#16a34a", "#0f766e", "#bbf7d0"],
  night: ["#1e1b4b", "#7c3aed", "#c4b5fd"],
  coffee: ["#78350f", "#d97706", "#fef3c7"],
  sakura: ["#f9a8d4", "#a78bfa", "#fff1f2"],
  mint: ["#14b8a6", "#22d3ee", "#ecfeff"],
  ember: ["#dc2626", "#7c2d12", "#fecaca"],
  sky: ["#38bdf8", "#e0f2fe", "#ffffff"],
  grape: ["#6d28d9", "#db2777", "#f5d0fe"],
} satisfies Record<string, [string, string, string]>;

// ---------- テスト用の記事 ----------
const blogs: SeedBlog[] = [
  {
    title: "はじめての沖縄ひとり旅 ― 青い海と島時間をめぐる3日間",
    author: "yamada",
    tags: ["旅行", "沖縄", "ひとり旅"],
    status: "public",
    daysAgo: 2,
    palette: [palettes.ocean, palettes.mint, palettes.sky],
    body: [
      p("ずっと行きたかった沖縄に、ついにひとりで行ってきました。初めてのひとり旅で不安もありましたが、島の人たちのあたたかさと、どこまでも続く青い海に、すっかり心を奪われてしまいました。"),
      img(0, "エメラルドグリーンの海"),
      h(2, "1日目：那覇の街を歩く"),
      p("空港からゆいレールで国際通りへ。お土産屋さんが並ぶにぎやかな通りを抜けて、一本裏の", bold("市場本通り"), "に入ると、地元の人の暮らしが見えてきます。"),
      ul("公設市場で選んだ魚をその場で調理してもらえる", "サーターアンダギーは揚げたてが一番", "夜は沖縄民謡のライブがある居酒屋へ"),
      h(2, "2日目：レンタカーで北部へ"),
      p("美ら海水族館を目指して北へ。途中の古宇利大橋から見た海の色は、写真では伝えきれない美しさでした。"),
      img(1, "古宇利大橋から見た海"),
      quote("「なんくるないさ」――島で何度も聞いたこの言葉が、旅の一番のお土産になりました。"),
      h(2, "3日目：のんびり島時間"),
      p("最終日は予定を入れず、ビーチでただ波の音を聞いて過ごしました。何もしない贅沢を味わえるのも、ひとり旅ならではです。"),
      img(2, "夕暮れのビーチ"),
    ],
  },
  {
    title: "朝の30分で人生が変わる ― 続けられるモーニングルーティン",
    author: "suzuki",
    tags: ["暮らし", "習慣"],
    status: "public",
    daysAgo: 5,
    palette: [palettes.sky, palettes.sunset],
    body: [
      p("「朝活」と聞くとハードルが高く感じるかもしれません。でも、たった30分でも毎日続けると、1日の質がまったく変わってきます。"),
      img(0, "朝日が差し込む部屋"),
      h(2, "わたしのルーティン"),
      ol("起きたらカーテンを開けて日光を浴びる", "コップ1杯の白湯を飲む", "5分だけストレッチ", "今日やることを3つだけ書き出す", "好きな音楽をかけて朝ごはん"),
      h(2, "続けるコツは「がんばらない」こと"),
      p("最初から完璧を目指すと続きません。", bold("できなかった日があっても気にしない"), "。それくらいの気持ちで始めるのがちょうどいいと思います。"),
      img(1, "朝ごはんのテーブル"),
    ],
  },
  {
    title: "自家焙煎に挑戦！ 手網で始めるコーヒーのある暮らし",
    author: "sato",
    tags: ["コーヒー", "暮らし", "趣味"],
    status: "public",
    daysAgo: 9,
    palette: [palettes.coffee, palettes.ember, palettes.coffee],
    body: [
      p("コーヒー好きが高じて、ついに自分で豆を焙煎するようになりました。道具は手網とカセットコンロだけ。思っていたよりずっと手軽に始められます。"),
      img(0, "焙煎したてのコーヒー豆"),
      h(2, "用意するもの"),
      ul("生豆（まずは200gから）", "手網（ギンナン煎り用でもOK）", "カセットコンロ", "うちわ（豆を冷ますため）"),
      h(2, "焙煎の流れ"),
      p("弱めの中火で、手網を左右に振り続けます。10分ほどで「パチッ」という", bold("1ハゼ"), "の音が聞こえてきたら、そこからが好みの焙煎度を決める勝負どころです。"),
      img(1, "手網で焙煎しているところ"),
      quote("焙煎から2〜3日置いた豆が、いちばん香りが立っておいしいです。"),
      h(2, "おすすめの淹れ方"),
      p("自家焙煎の豆は、ハンドドリップで淹れるのがおすすめ。お湯の温度を変えるだけでも味わいが変わるので、いろいろ試してみてください。"),
      img(2, "ハンドドリップでコーヒーを淹れる"),
    ],
  },
  {
    title: "TypeScript を学んで分かった「型」のありがたさ",
    author: "yamada",
    tags: ["プログラミング", "TypeScript", "学び"],
    status: "public",
    daysAgo: 14,
    palette: [palettes.night, palettes.grape],
    body: [
      p("JavaScript で書いていたプロジェクトを TypeScript に移行してみました。最初は面倒に感じた「型」ですが、今では手放せません。"),
      img(0, "コードが表示されたモニター"),
      h(2, "よかったこと"),
      ul("エディタの補完が強力になり、書くのが速くなった", "リファクタリングが怖くなくなった", "実行前にミスに気づける"),
      h(2, "つまずいたところ"),
      p("ジェネリクスや型ガードは、最初はなかなか理解できませんでした。公式の", link("TypeScript ハンドブック", "https://www.typescriptlang.org/docs/"), "を少しずつ読み進めるのがおすすめです。"),
      img(1, "ノートに書いた学習メモ"),
    ],
  },
  {
    title: "春の京都、桜めぐり ― 混雑を避けて楽しむ穴場スポット",
    author: "suzuki",
    tags: ["旅行", "京都", "写真"],
    status: "public",
    daysAgo: 20,
    palette: [palettes.sakura, palettes.grape, palettes.sakura],
    body: [
      p("桜の季節の京都は、どこへ行っても人でいっぱい。そこで今回は、比較的ゆったりお花見ができる穴場を中心にめぐってきました。"),
      img(0, "満開の桜並木"),
      h(2, "早朝の哲学の道"),
      p("朝7時前に訪れると、人影はまばら。水路に映る桜と、散り始めた花びらが流れる「花いかだ」を独り占めできました。"),
      img(1, "水路に浮かぶ花びら"),
      h(2, "夜は東寺のライトアップへ"),
      p("五重塔と枝垂れ桜のライトアップは圧巻。", bold("平日の閉門1時間前"), "がねらい目です。"),
      img(2, "ライトアップされた夜桜"),
    ],
  },
  {
    title: "週末の作り置き 10品 ― 平日の夕食がぐっと楽になる",
    author: "takahashi",
    tags: ["料理", "暮らし"],
    status: "public",
    daysAgo: 27,
    palette: [palettes.forest, palettes.sunset],
    body: [
      p("平日は仕事で忙しく、夕食を作る時間がなかなか取れません。そこで始めたのが週末の作り置き。2時間で10品を作るわたしの流れをご紹介します。"),
      img(0, "保存容器に並んだ作り置き"),
      h(2, "作り置きリスト"),
      ul("鶏むね肉のしっとり塩煮", "ひじきの煮物", "にんじんのラペ", "きのこのマリネ", "ほうれん草のおひたし", "味たまご", "かぼちゃの煮物", "切り干し大根", "豚こまのしょうが焼き", "ピクルス"),
      h(2, "段取りのコツ"),
      p("まずは", bold("火を使う料理を同時に進める"), "こと。煮込んでいる間に野菜を切り、冷ましている間に和え物を作ると、待ち時間がほとんどなくなります。"),
      img(1, "キッチンで調理中"),
    ],
  },
  {
    title: "フィルムカメラで撮る、何気ない毎日",
    author: "ito",
    tags: ["写真", "趣味"],
    status: "public",
    daysAgo: 33,
    palette: [palettes.ember, palettes.coffee, palettes.sunset],
    body: [
      p("スマホで何枚でも撮れる時代に、あえてフィルムカメラを持ち歩いています。36枚しか撮れないからこそ、1枚1枚を大切に撮るようになりました。"),
      img(0, "フィルムカメラ"),
      h(2, "フィルムの魅力"),
      p("現像するまで写りが分からないドキドキ感。そして、デジタルにはないやわらかな色と粒子感。何気ない街角も、少しだけ特別に見えてきます。"),
      img(1, "夕暮れの街角"),
      quote("いい写真は、いい瞬間を待つ時間から生まれる。"),
      img(2, "光が差し込む窓辺"),
    ],
  },
  {
    title: "リモートワーク3年目、作業環境を見直してみた",
    author: "suzuki",
    tags: ["仕事", "暮らし"],
    status: "public",
    daysAgo: 41,
    palette: [palettes.mint, palettes.night],
    body: [
      p("リモートワークも3年目。なんとなくで揃えた作業環境を、改めて見直してみました。"),
      img(0, "整ったデスク"),
      h(2, "変えてよかったもの"),
      ol("椅子：腰の痛みがなくなった", "モニターアーム：机が広く使えるように", "照明：夕方以降の目の疲れが軽くなった"),
      h(2, "意外と大事だったこと"),
      p("道具よりも効果があったのは、", bold("仕事の始まりと終わりを決めること"), "でした。オンとオフの切り替えができると、集中力がまったく違います。"),
      img(1, "観葉植物のあるワークスペース"),
    ],
  },
  {
    title: "はじめての登山 ― 高尾山で見つけた山歩きの楽しさ",
    author: "sato",
    tags: ["アウトドア", "旅行"],
    status: "public",
    daysAgo: 50,
    palette: [palettes.forest, palettes.sky, palettes.forest],
    body: [
      p("運動不足解消のために、思い切って登山を始めてみました。最初の山に選んだのは、初心者にもやさしい高尾山です。"),
      img(0, "新緑の登山道"),
      h(2, "持っていったもの"),
      ul("歩きやすいスニーカー", "500mlの水を2本", "汗をふくタオル", "おにぎりと行動食"),
      h(2, "山頂からの景色"),
      p("1時間半ほど歩いて山頂へ。天気がよく、遠くに富士山まで見えました。自分の足で登ったからこその達成感は格別です。"),
      img(1, "山頂から見た景色"),
      img(2, "木漏れ日の森"),
    ],
  },
  {
    title: "読書記録のすすめ ― 1年で50冊読めた小さな習慣",
    author: "yamada",
    tags: ["読書", "習慣", "学び"],
    status: "public",
    daysAgo: 62,
    palette: [palettes.grape, palettes.coffee],
    body: [
      p("去年は1年で50冊の本を読むことができました。特別なことはしていません。続けられたのは、", bold("読書記録をつける"), "という小さな習慣のおかげです。"),
      img(0, "積み上げられた本"),
      h(2, "記録するのは3つだけ"),
      ol("タイトルと読み終えた日", "心に残った一文", "一言の感想"),
      p("たったこれだけですが、読んだ本が増えていくのが目に見えると、次の本に手が伸びるようになります。"),
      img(1, "カフェで読書"),
    ],
  },
  {
    title: "ベランダ菜園でミニトマトを育てる",
    author: "ito",
    tags: ["暮らし", "趣味"],
    status: "public",
    daysAgo: 75,
    palette: [palettes.ember, palettes.forest],
    body: [
      p("マンションのベランダで、ミニトマトを育て始めました。プランター1つから始められるので、家庭菜園の入門にぴったりです。"),
      img(0, "赤く実ったミニトマト"),
      h(2, "育て方のポイント"),
      ul("日当たりのよい場所に置く", "水やりは土が乾いてからたっぷりと", "わき芽はこまめに摘む", "支柱を立てて茎を支える"),
      p("初めての収穫は感動もの。自分で育てたトマトは、甘さがまったく違いました。"),
      img(1, "ベランダのプランター"),
    ],
  },
  {
    title: "夜空を見上げよう ― 都会でもできる星空観察",
    author: "takahashi",
    tags: ["趣味", "アウトドア"],
    status: "public",
    daysAgo: 90,
    palette: [palettes.night, palettes.night, palettes.grape],
    body: [
      p("「都会では星が見えない」と思っていませんか？ 実は、少しの工夫で都会でも星空観察を楽しめます。"),
      img(0, "満天の星空"),
      h(2, "観察のコツ"),
      ol("街灯の少ない公園や河川敷を選ぶ", "目を15分ほど暗さに慣らす", "星座アプリで位置を確認する"),
      p("冬はオリオン座、夏は夏の大三角が見つけやすくおすすめです。"),
      img(1, "夜空に輝く月"),
      hr,
      p("次回は、双眼鏡で楽しむ月のクレーター観察について書く予定です。"),
    ],
  },
  // ----- 以下は閲覧側に表示されない記事（動作確認用） -----
  {
    title: "【非公開】キャンプ道具の選び方（加筆修正中）",
    author: "yamada",
    tags: ["アウトドア"],
    status: "private",
    daysAgo: 30,
    palette: [palettes.forest],
    body: [p("この記事は一度公開した後、非公開にしています。URL を開くと「非公開中です」が表示されます。"), img(0, "キャンプ場")],
  },
  {
    title: "【下書き】秋のおすすめ紅葉スポット",
    author: "sato",
    tags: ["旅行"],
    status: "draft",
    daysAgo: 0,
    palette: [palettes.sunset],
    body: [p("この記事は下書きです。URL を開くと 404 になります。")],
  },
  {
    title: "【公開予定】年末の大掃除チェックリスト",
    author: "suzuki",
    tags: ["暮らし"],
    status: "scheduled",
    daysAgo: -7,
    palette: [palettes.sky],
    body: [p("この記事は1週間後に公開される予定です。公開日時までは 404 になります。")],
  },
];

async function main() {
  console.log("既存のデータを削除しています…");
  await prisma.$executeRawUnsafe(
    'TRUNCATE "notifications", "audit_logs", "refresh_tokens", "login_attempts", "tag_template_tags", "tag_templates", "blog_tags", "tags", "blog_images", "blogs", "users" RESTART IDENTITY CASCADE',
  );
  await rm(`${process.env.LOCAL_STORAGE_DIR ?? "./storage"}/blogs`, { recursive: true, force: true });
  await rm(`${process.env.LOCAL_STORAGE_DIR ?? "./storage"}/avatars`, { recursive: true, force: true });

  console.log("ユーザーを作成しています…");
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const users = {
    sato: await prisma.user.create({
      data: { name: "佐藤 花子", email: "admin@example.com", passwordHash, role: "admin" },
    }),
    yamada: await prisma.user.create({
      data: { name: "山田 太郎", email: "yamada@example.com", passwordHash, role: "user" },
    }),
    suzuki: await prisma.user.create({
      data: { name: "鈴木 一郎", email: "suzuki@example.com", passwordHash, role: "user" },
    }),
    takahashi: await prisma.user.create({
      data: { name: "高橋 健太", email: "takahashi@example.com", passwordHash, role: "user" },
    }),
    ito: await prisma.user.create({
      data: { name: "伊藤 さくら", email: "ito@example.com", passwordHash, role: "user" },
    }),
  };

  // アイコン画像（prisma/seed-assets/avatars）
  const avatarFiles: Record<keyof typeof users, string> = {
    sato: "1.webp",
    yamada: "4.webp",
    suzuki: "5.webp",
    takahashi: "2.webp",
    ito: "3.webp",
  };
  for (const [key, file] of Object.entries(avatarFiles) as [keyof typeof users, string][]) {
    const data = await processAvatar(await readFile(path.join(process.cwd(), "prisma/seed-assets/avatars", file)));
    if (data) {
      const avatarStorageKey = await saveAvatar(users[key].id, data);
      await prisma.user.update({ where: { id: users[key].id }, data: { avatarStorageKey } });
    }
  }

  console.log("ブログを作成しています…");
  const now = Date.now();
  for (const [index, seed] of blogs.entries()) {
    const author = users[seed.author];
    const publishedAt =
      seed.status === "draft" ? null : new Date(now - seed.daysAgo * DAY);
    const firstPublishedAt =
      seed.status === "public" || seed.status === "private" ? publishedAt : null;

    const blog = await prisma.blog.create({
      data: {
        title: seed.title,
        authorId: author.id,
        status: seed.status,
        publishedAt,
        firstPublishedAt,
        createdAt: new Date(now - (seed.daysAgo + 3) * DAY),
      },
    });

    // 画像を生成して保存する
    const storageKeys = new Map<number, string>();
    const imageIdByIndex: number[] = [];
    for (const [i, palette] of seed.palette.entries()) {
      const webp = await sharp(Buffer.from(artwork(palette, index * 10 + i)))
        .webp({ quality: 82 })
        .toBuffer();
      const storageKey = `blogs/${blog.id}/${randomUUID()}.webp`;
      await storage.put(storageKey, webp, "image/webp");
      const alt = seed.body.find((b) => "index" in b && b.index === i) as { alt: string } | undefined;
      const image = await prisma.blogImage.create({
        data: {
          blogId: blog.id,
          storageKey,
          alt: alt?.alt ?? "",
          width: 1600,
          height: 900,
          fileSize: webp.length,
          originalFilename: `seed-${i + 1}.png`,
          uploadedById: author.id,
        },
      });
      storageKeys.set(image.id, storageKey);
      imageIdByIndex.push(image.id);
    }

    // 本文を作り、HTML・テキスト・サムネイルを保存する（ブログ保存時と同じ処理）
    const doc: JSONContent = {
      type: "doc",
      content: seed.body.map((block) =>
        "index" in block
          ? {
              type: "image",
              attrs: { imageId: imageIdByIndex[block.index], alt: block.alt, width: 1600, height: 900 },
            }
          : block,
      ),
    };
    const ids = imageIds(doc);
    await prisma.blog.update({
      where: { id: blog.id },
      data: {
        bodyJson: doc,
        bodyText: toText(doc),
        bodyHtml: toHtml(doc, storageKeys),
        thumbnailImageId: ids[0] ?? null,
        // seed で作った直後の更新では、更新日時を公開日時に揃える
        updatedAt: publishedAt ?? new Date(now),
      },
    });

    await setBlogTags(prisma, blog.id, seed.tags);

    console.log(`  [${seed.status}] /blog/${blog.slug}  ${seed.title}`);
  }

  console.log("タグのテンプレートを作成しています…");
  const templates: [string, string[], keyof typeof users][] = [
    ["旅行記", ["旅行", "写真", "ひとり旅"], "sato"],
    ["暮らしのアイデア", ["暮らし", "習慣"], "yamada"],
    ["学びの記録", ["学び", "読書", "習慣"], "suzuki"],
  ];
  for (const [name, tags, owner] of templates) {
    const template = await prisma.tagTemplate.create({ data: { name, createdById: users[owner].id } });
    const tagIds = await resolveTagIds(prisma, tags);
    await prisma.tagTemplateTag.createMany({
      data: tagIds.map((tagId, position) => ({ templateId: template.id, tagId, position })),
    });
  }

  console.log("\n完了しました。ログイン用のテストユーザー（パスワードは全員 password123）");
  console.log("  管理者：admin@example.com");
  console.log("  ユーザー：yamada@example.com, suzuki@example.com, takahashi@example.com, ito@example.com");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
