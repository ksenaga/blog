// V-04. 非公開中（URL はそのまま、HTTP 403）
import LockClockRoundedIcon from "@mui/icons-material/LockClockRounded";
import StatusPage from "@/components/StatusPage";

export default function BlogForbidden() {
  return (
    <StatusPage
      icon={<LockClockRoundedIcon />}
      title="このブログは現在非公開中です"
      message="公開されるまでお待ちください。"
    />
  );
}
