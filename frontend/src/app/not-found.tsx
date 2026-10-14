// V-05. 404
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import PublicShell from "@/components/PublicShell";
import StatusPage from "@/components/StatusPage";

export default function NotFound() {
  return (
    <PublicShell>
      <StatusPage
        code="404 NOT FOUND"
        icon={<SearchOffRoundedIcon />}
        title="お探しのページは見つかりませんでした"
        message="URL が間違っているか、ページが削除された可能性があります。"
      />
    </PublicShell>
  );
}
