// 本文（TipTap の JSON）の変換（APIdesign.md 5-7）
// 保存時に HTML（表示用）とテキスト（検索・抜粋用）を作り、DB に保存する。
import { generateHTML } from "@tiptap/html/server";
import Image from "@tiptap/extension-image";
import StarterKit from "@tiptap/starter-kit";
import type { JSONContent } from "@tiptap/core";
import sanitizeHtml from "sanitize-html";
import { imageUrl } from "@/lib/storage";

// 本文の画像。このブログにアップロードした画像を image_id で指定する
const BlogImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      imageId: {
        default: null,
        parseHTML: (element) => Number(element.getAttribute("data-image-id")) || null,
        renderHTML: (attributes) =>
          attributes.imageId ? { "data-image-id": attributes.imageId } : {},
      },
      width: { default: null },
      height: { default: null },
    };
  },
});

// 本文で使える要素：段落・見出し（h2〜h4）・リスト・引用・区切り線・画像・太字・斜体・取り消し線・下線・リンク
export const blogExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3, 4] },
    code: false,
    codeBlock: false,
    link: { protocols: ["http", "https"] },
  }),
  BlogImage,
];

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "hr", "br",
    "strong", "em", "s", "u", "a", "img",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height", "loading", "decoding", "data-image-id"],
  },
  allowedSchemes: ["http", "https"],
  allowedSchemesByTag: { img: ["http", "https"] },
  allowProtocolRelative: false,
  transformTags: {
    // 外部リンクは新しいタブで開き、リンク先から元のページを操作されないようにする
    a: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, target: "_blank", rel: "noopener noreferrer" },
    }),
    // 画像は遅延読み込みにする
    img: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, loading: "lazy", decoding: "async" },
    }),
  },
};

// 画像ノードの src を storage_key から組み立てる
function withImageUrls(
  doc: JSONContent,
  storageKeys: Map<number, string>,
): JSONContent {
  if (doc.type === "image") {
    const key = storageKeys.get(Number(doc.attrs?.imageId));
    return { ...doc, attrs: { ...doc.attrs, src: key ? imageUrl(key) : null } };
  }
  if (!doc.content) return doc;
  return { ...doc, content: doc.content.map((child) => withImageUrls(child, storageKeys)) };
}

// 表示用の HTML（サニタイズ済み）
export function toHtml(doc: JSONContent, storageKeys: Map<number, string>) {
  const html = generateHTML(withImageUrls(doc, storageKeys), blogExtensions);
  return sanitizeHtml(html, sanitizeOptions);
}

// 検索・抜粋用のテキスト
export function toText(doc: JSONContent): string {
  if (doc.type === "text") return doc.text ?? "";
  // 段落・見出しの中は文字をそのままつなげ、それ以外（リストや引用など）は改行で区切る
  const inline = doc.type === "paragraph" || doc.type === "heading";
  const text = (doc.content ?? []).map(toText).join(inline ? "" : "\n");
  return doc.type === "doc" ? text.trim() : text;
}

// 本文中の画像IDを出てくる順に返す（1枚目がサムネイルになる）
export function imageIds(doc: JSONContent): number[] {
  if (doc.type === "image") {
    const id = Number(doc.attrs?.imageId);
    return Number.isInteger(id) ? [id] : [];
  }
  return (doc.content ?? []).flatMap(imageIds);
}

// 一覧に表示する抜粋（本文の先頭120文字程度）
export function toExcerpt(bodyText: string, length = 120) {
  const text = bodyText.replace(/\s+/g, " ").trim();
  return text.length > length ? `${text.slice(0, length)}…` : text;
}
