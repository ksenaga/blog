import Avatar from "@mui/material/Avatar";
import type { Author } from "@/lib/api";

// 作者のアイコン。画像がなければ名前の1文字目を表示する
export default function AuthorAvatar({
  author,
  size = 28,
}: {
  author: Pick<Author, "name" | "avatar_url">;
  size?: number;
}) {
  return (
    <Avatar
      alt={author.name}
      src={author.avatar_url ?? undefined}
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        fontWeight: 600,
        bgcolor: "action.selected",
        color: "text.primary",
      }}
    >
      {author.name.charAt(0)}
    </Avatar>
  );
}
