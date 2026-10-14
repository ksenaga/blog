// エディタで使う要素（APIdesign.md 5-7）。backend（src/lib/blog-content.ts）と同じ要素・属性にする
import Image from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extensions";
import StarterKit from "@tiptap/starter-kit";

// 本文の画像。このブログにアップロードした画像を imageId で指定する
export const BlogImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      imageId: {
        default: null,
        parseHTML: (element) => Number(element.getAttribute("data-image-id")) || null,
        renderHTML: (attributes) => (attributes.imageId ? { "data-image-id": attributes.imageId } : {}),
      },
      width: { default: null },
      height: { default: null },
    };
  },
});

export function blogEditorExtensions(placeholder = "本文を入力（画像はドラッグ＆ドロップでも追加できます）") {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
      code: false,
      codeBlock: false,
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        // http・https 以外のリンクは作らない
        isAllowedUri: (url) => /^https?:\/\//i.test(url),
      },
    }),
    BlogImage,
    Placeholder.configure({ placeholder }),
  ];
}
