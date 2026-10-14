"use client";

// タグの入力。これまでに使われたタグを候補に出し、新しいタグもその場で追加できる
import Autocomplete from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import { useApi } from "@/components/cms/useApi";

export const TAG_MAX_PER_BLOG = 10;
const TAG_MAX_LENGTH = 30;

// backend（src/lib/tags.ts）と同じルールでタグ名をそろえる
function normalize(name: string) {
  return name.normalize("NFKC").trim().replace(/^#+/, "").replace(/\s+/g, " ").trim().slice(0, TAG_MAX_LENGTH);
}

export default function TagInput({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}) {
  const { data } = useApi<{ data: { name: string; blog_count: number }[] }>("/cms/tags");
  const options = data?.data.map((tag) => tag.name) ?? [];
  const full = value.length >= TAG_MAX_PER_BLOG;

  function handleChange(next: string[]) {
    const seen = new Set<string>();
    const tags = next.map(normalize).filter((tag) => {
      const key = tag.toLowerCase();
      if (!tag || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    onChange(tags.slice(0, TAG_MAX_PER_BLOG));
  }

  return (
    <Autocomplete
      multiple
      freeSolo
      autoSelect
      size="small"
      disabled={disabled}
      options={options}
      value={value}
      onChange={(_, next) => handleChange(next)}
      // 上限に達したら候補を出さない
      getOptionDisabled={() => full}
      filterSelectedOptions
      renderValue={(tags, getItemProps) =>
        tags.map((tag, index) => {
          const { key, ...itemProps } = getItemProps({ index });
          return <Chip key={key} label={`#${tag}`} size="small" variant="outlined" {...itemProps} />;
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={value.length ? "" : "タグを入力して Enter"}
          helperText={full ? `タグは${TAG_MAX_PER_BLOG}個までです` : `${TAG_MAX_LENGTH}文字以内・${TAG_MAX_PER_BLOG}個まで`}
          slotProps={{ ...params.slotProps, htmlInput: { ...params.slotProps.htmlInput, maxLength: TAG_MAX_LENGTH, readOnly: full } }}
        />
      )}
    />
  );
}
