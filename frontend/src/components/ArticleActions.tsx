"use client";

// 記事のいいね・シェア（V-03）。シェアはリンクのコピーと、端末の共有メニュー（対応している端末のみ）
import { useEffect, useState, useSyncExternalStore } from "react";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import IosShareIcon from "@mui/icons-material/IosShare";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";

type LikeState = { like_count: number; liked: boolean };

export default function ArticleActions({
  slug,
  title,
  url,
  initialLikeCount,
}: {
  slug: string;
  title: string;
  url: string;
  initialLikeCount: number;
}) {
  const [like, setLike] = useState<LikeState>({ like_count: initialLikeCount, liked: false });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // 端末の共有メニュー（Web Share API）が使えるか。サーバーで描画するときは false
  const canNativeShare = useSyncExternalStore(
    () => () => undefined,
    () => typeof navigator.share === "function",
    () => false,
  );

  // このブラウザでいいね済みかどうかを取得する（Cookie はブラウザにしかないため、ここで取得する）
  useEffect(() => {
    fetch(`/api/v1/blogs/${slug}/like`)
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => body && setLike(body.data))
      .catch(() => undefined);
  }, [slug]);

  async function toggleLike() {
    if (busy) return;
    setBusy(true);
    const next = !like.liked;
    // 押した瞬間に表示を切り替え、結果で確定する
    setLike((current) => ({ liked: next, like_count: current.like_count + (next ? 1 : -1) }));
    try {
      const response = await fetch(`/api/v1/blogs/${slug}/like`, { method: next ? "POST" : "DELETE" });
      if (!response.ok) throw new Error();
      setLike((await response.json()).data);
    } catch {
      setLike((current) => ({ liked: !next, like_count: current.like_count + (next ? -1 : 1) }));
      setMessage("いいねできませんでした。時間をおいて再度お試しください");
    } finally {
      setBusy(false);
    }
  }

  const iconButtonSx = { border: 1, borderColor: "divider", width: 40, height: 40, color: "text.secondary", "&:hover": { color: "text.primary" } };

  return (
    <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
      <Button
        variant="outlined"
        onClick={toggleLike}
        aria-pressed={like.liked}
        startIcon={like.liked ? <FavoriteIcon sx={{ color: "#e11d48" }} /> : <FavoriteBorderIcon />}
        sx={{
          borderRadius: 999,
          px: 2,
          color: "text.primary",
          borderColor: like.liked ? "#e11d48" : "divider",
          "&:hover": { borderColor: like.liked ? "#e11d48" : "text.secondary", bgcolor: "action.hover" },
        }}
      >
        いいね
        <Typography component="span" sx={{ ml: 1, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
          {like.like_count}
        </Typography>
      </Button>

      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Typography variant="body2" sx={{ color: "text.secondary", mr: 0.5, display: { xs: "none", sm: "block" } }}>
          シェア
        </Typography>
        <Tooltip title="リンクをコピー">
          <IconButton
            aria-label="リンクをコピー"
            sx={iconButtonSx}
            onClick={() =>
              navigator.clipboard
                .writeText(url)
                .then(() => setMessage("リンクをコピーしました"))
                .catch(() => setMessage("コピーできませんでした"))
            }
          >
            <LinkRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {/* スマートフォンなど、端末の共有メニューが使える場合 */}
        {canNativeShare && (
          <Tooltip title="その他の方法で共有">
            <IconButton
              aria-label="その他の方法で共有"
              sx={iconButtonSx}
              onClick={() => navigator.share({ title, url }).catch(() => undefined)}
            >
              <IosShareIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      <Snackbar
        open={!!message}
        autoHideDuration={2500}
        onClose={() => setMessage(null)}
        message={message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Stack>
  );
}
