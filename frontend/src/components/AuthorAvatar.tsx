import Avatar from "@mui/material/Avatar";
import type { Author } from "@/lib/api";

const gradients = [
  "linear-gradient(135deg, #6366f1, #8b5cf6)",
  "linear-gradient(135deg, #ec4899, #f97316)",
  "linear-gradient(135deg, #14b8a6, #0ea5e9)",
  "linear-gradient(135deg, #f59e0b, #ef4444)",
  "linear-gradient(135deg, #22c55e, #14b8a6)",
];

// 作者のアイコン（名前の1文字目を、作者ごとの色で表示する）
export default function AuthorAvatar({ author, size = 28 }: { author: Author; size?: number }) {
  return (
    <Avatar
      alt={author.name}
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.45,
        fontWeight: 700,
        color: "#fff",
        background: gradients[author.id % gradients.length],
      }}
    >
      {author.name.charAt(0)}
    </Avatar>
  );
}
