"use client";

// 一覧の検索・絞り込み（C-03・C-05・C-07 で使う）
import { useEffect, useState } from "react";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { api } from "@/lib/cms/api";
import type { CmsUserDetail, Paginated } from "@/lib/cms/types";

// 入力が止まって0.3秒後に検索する（screendesign.md C-03）
export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [text, setText] = useState(value);
  const [lastValue, setLastValue] = useState(value);

  // URL の条件が外から変わったとき（戻るボタンなど）に入力欄を合わせる
  if (value !== lastValue) {
    setLastValue(value);
    if (value !== text.trim()) setText(value);
  }

  useEffect(() => {
    if (text.trim() === value) return;
    const timer = setTimeout(() => onChange(text.trim()), 300);
    return () => clearTimeout(timer);
  }, [text, value, onChange]);

  return (
    <TextField
      size="small"
      placeholder={placeholder}
      value={text}
      onChange={(event) => setText(event.target.value)}
      sx={{ minWidth: { xs: "100%", sm: 280 } }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon fontSize="small" />
            </InputAdornment>
          ),
        },
        htmlInput: { maxLength: 100 },
      }}
    />
  );
}

// 作者の絞り込み（管理者のみ）
export function AuthorSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [users, setUsers] = useState<CmsUserDetail[]>([]);

  useEffect(() => {
    api<Paginated<CmsUserDetail>>("/cms/users?per_page=100")
      .then(({ data }) => setUsers(data))
      .catch(() => undefined);
  }, []);

  return (
    <TextField
      select
      size="small"
      label="作者"
      value={users.length ? value : ""}
      onChange={(event) => onChange(event.target.value)}
      sx={{ minWidth: 160 }}
    >
      <MenuItem value="">すべての作者</MenuItem>
      {users.map((user) => (
        <MenuItem key={user.id} value={String(user.id)}>
          {user.name}
        </MenuItem>
      ))}
    </TextField>
  );
}
