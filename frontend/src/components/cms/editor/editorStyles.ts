import type { Theme } from "@mui/material/styles";
import { articleStyles } from "@/components/articleStyles";

// エディタの見た目。閲覧ページと同じ本文のスタイルに、編集用の表示を足す
export const editorStyles = (theme: Theme) => ({
  ...articleStyles(theme),
  "& .ProseMirror": {
    outline: "none",
    minHeight: 420,
    "& > *:first-of-type": { mt: 0 },
  },
  // 未入力のときの案内文
  "& .ProseMirror p.is-editor-empty:first-of-type::before": {
    content: "attr(data-placeholder)",
    color: theme.vars.palette.text.disabled,
    float: "left",
    height: 0,
    pointerEvents: "none",
  },
  "& .ProseMirror img": { cursor: "pointer", transition: "outline-color 0.15s" },
  // 選択中の画像
  "& .ProseMirror img.ProseMirror-selectednode": {
    outline: `3px solid ${theme.vars.palette.primary.main}`,
    outlineOffset: 4,
  },
  "& .ProseMirror a": { cursor: "text" },
});
