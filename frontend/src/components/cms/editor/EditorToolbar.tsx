"use client";

// エディタのツールバー（screendesign.md C-04）
import { useRef, useState, type ReactNode } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import FormatBoldRoundedIcon from "@mui/icons-material/FormatBoldRounded";
import FormatItalicRoundedIcon from "@mui/icons-material/FormatItalicRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import FormatStrikethroughRoundedIcon from "@mui/icons-material/FormatStrikethroughRounded";
import FormatUnderlinedRoundedIcon from "@mui/icons-material/FormatUnderlinedRounded";
import HorizontalRuleRoundedIcon from "@mui/icons-material/HorizontalRuleRounded";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import InsertLinkRoundedIcon from "@mui/icons-material/InsertLinkRounded";
import RedoRoundedIcon from "@mui/icons-material/RedoRounded";
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";

type Props = {
  editor: Editor;
  onPickImages: (files: File[]) => void;
};

export default function EditorToolbar({ editor, onPickImages }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  // 選択位置が変わるたびに、ボタンの選択状態を更新する
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      h4: e.isActive("heading", { level: 4 }),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      blockquote: e.isActive("blockquote"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  function openLinkDialog() {
    setLinkUrl(editor.getAttributes("link").href ?? "");
    setLinkError(null);
    setLinkOpen(true);
  }

  function applyLink() {
    const url = linkUrl.trim();
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setLinkOpen(false);
      return;
    }
    if (!/^https?:\/\/\S+$/i.test(url)) {
      setLinkError("http:// または https:// から始まる URL を入力してください");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    setLinkOpen(false);
  }

  const chain = () => editor.chain().focus();

  return (
    <Box
      sx={(theme) => ({
        position: "sticky",
        top: { xs: 60, md: 68 },
        zIndex: 2,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 0.25,
        p: 0.75,
        borderRadius: "14px",
        border: `1px solid ${theme.vars.palette.divider}`,
        backgroundColor: `rgba(${theme.vars.palette.background.paperChannel} / 0.9)`,
        backdropFilter: "blur(12px)",
      })}
    >
      <ToolButton title="太字" active={state.bold} onClick={() => chain().toggleBold().run()}>
        <FormatBoldRoundedIcon />
      </ToolButton>
      <ToolButton title="斜体" active={state.italic} onClick={() => chain().toggleItalic().run()}>
        <FormatItalicRoundedIcon />
      </ToolButton>
      <ToolButton title="下線" active={state.underline} onClick={() => chain().toggleUnderline().run()}>
        <FormatUnderlinedRoundedIcon />
      </ToolButton>
      <ToolButton title="取り消し線" active={state.strike} onClick={() => chain().toggleStrike().run()}>
        <FormatStrikethroughRoundedIcon />
      </ToolButton>
      <Separator />
      {([2, 3, 4] as const).map((level) => (
        <ToolButton
          key={level}
          title={`見出し${level - 1}（H${level}）`}
          active={state[`h${level}`]}
          onClick={() => chain().toggleHeading({ level }).run()}
        >
          <Typography component="span" sx={{ fontWeight: 800, fontSize: 14, width: 24 }}>
            H{level}
          </Typography>
        </ToolButton>
      ))}
      <Separator />
      <ToolButton title="箇条書き" active={state.bulletList} onClick={() => chain().toggleBulletList().run()}>
        <FormatListBulletedRoundedIcon />
      </ToolButton>
      <ToolButton title="番号付きリスト" active={state.orderedList} onClick={() => chain().toggleOrderedList().run()}>
        <FormatListNumberedRoundedIcon />
      </ToolButton>
      <ToolButton title="引用" active={state.blockquote} onClick={() => chain().toggleBlockquote().run()}>
        <FormatQuoteRoundedIcon />
      </ToolButton>
      <ToolButton title="区切り線" onClick={() => chain().setHorizontalRule().run()}>
        <HorizontalRuleRoundedIcon />
      </ToolButton>
      <Separator />
      <ToolButton title="リンク" active={state.link} onClick={openLinkDialog}>
        <InsertLinkRoundedIcon />
      </ToolButton>
      <ToolButton title="画像を追加" onClick={() => fileInput.current?.click()}>
        <ImageOutlinedIcon />
      </ToolButton>
      <Box sx={{ flex: 1 }} />
      <ToolButton title="元に戻す" disabled={!state.canUndo} onClick={() => chain().undo().run()}>
        <UndoRoundedIcon />
      </ToolButton>
      <ToolButton title="やり直す" disabled={!state.canRedo} onClick={() => chain().redo().run()}>
        <RedoRoundedIcon />
      </ToolButton>

      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        hidden
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length) onPickImages(files);
        }}
      />

      <Dialog open={linkOpen} onClose={() => setLinkOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>リンク</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="URL"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), applyLink())}
            error={!!linkError}
            helperText={linkError ?? "空にして設定すると、リンクを解除します"}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={() => setLinkOpen(false)}>
            キャンセル
          </Button>
          <Button variant="contained" onClick={applyLink}>
            設定する
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function ToolButton({
  title,
  active,
  disabled,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip title={title}>
      <span>
        <IconButton
          size="small"
          aria-label={title}
          aria-pressed={active}
          disabled={disabled}
          onClick={onClick}
          sx={(theme) => ({
            borderRadius: "10px",
            color: active ? theme.vars.palette.primary.main : "text.secondary",
            bgcolor: active ? `rgba(${theme.vars.palette.primary.mainChannel} / 0.12)` : "transparent",
          })}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}

function Separator() {
  return <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.75 }} />;
}
