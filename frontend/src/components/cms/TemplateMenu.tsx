"use client";

// 「テンプレートから追加」：テンプレートのタグを、今のタグに追加する
import { useState } from "react";
import Button from "@mui/material/Button";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import PlaylistAddRoundedIcon from "@mui/icons-material/PlaylistAddRounded";
import { TAG_MAX_PER_BLOG } from "@/components/cms/TagInput";
import { useApi } from "@/components/cms/useApi";
import { useFeedback } from "@/components/cms/FeedbackProvider";
import type { TagTemplate } from "@/lib/cms/types";

export default function TemplateMenu({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}) {
  const { toast } = useFeedback();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  // メニューを開いたときに取得する
  const { data } = useApi<{ data: TagTemplate[] }>(anchor ? "/cms/tag-templates" : null);

  function apply(template: TagTemplate) {
    setAnchor(null);
    const current = new Set(value.map((tag) => tag.toLowerCase()));
    const added = template.tags.filter((tag) => !current.has(tag.toLowerCase()));
    const next = [...value, ...added].slice(0, TAG_MAX_PER_BLOG);
    onChange(next);
    const skipped = value.length + added.length - next.length;
    if (skipped > 0) toast(`タグは${TAG_MAX_PER_BLOG}個までのため、${skipped}個は追加しませんでした`, "info");
    else if (added.length === 0) toast("追加するタグはありませんでした（全て設定済みです）", "info");
  }

  return (
    <>
      <Button
        size="small"
        startIcon={<PlaylistAddRoundedIcon />}
        onClick={(event) => setAnchor(event.currentTarget)}
        disabled={disabled}
        sx={{ ml: -1 }}
      >
        テンプレートから追加
      </Button>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} slotProps={{ paper: { sx: { minWidth: 260, maxWidth: 360 } } }}>
        {!data && <MenuItem disabled>読み込み中…</MenuItem>}
        {data?.data.length === 0 && <MenuItem disabled>テンプレートがありません</MenuItem>}
        {data?.data.map((template) => (
          <MenuItem key={template.id} onClick={() => apply(template)}>
            <ListItemText
              primary={template.name}
              secondary={template.tags.map((tag) => `#${tag}`).join(" ")}
              slotProps={{ secondary: { noWrap: true } }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
