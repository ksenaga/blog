"use client";

// 管理画面の共通レイアウト（screendesign.md 5-0）
import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import ButtonBase from "@mui/material/ButtonBase";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import AuthorAvatar from "@/components/AuthorAvatar";
import ColorModeToggle from "@/components/ColorModeToggle";
import NextLink from "@/components/NextLink";
import { useAuth } from "@/components/cms/AuthProvider";
import { useUnreadCount } from "@/components/cms/UnreadCountProvider";
import { SITE_NAME } from "@/lib/site";

const DRAWER_WIDTH = 260;

type NavItem = { href: string; label: string; icon: ReactNode; adminOnly?: boolean; badge?: boolean };

const NAV_ITEMS: NavItem[] = [
  { href: "/cms", label: "ダッシュボード", icon: <DashboardOutlinedIcon /> },
  { href: "/cms/blogs", label: "ブログ一覧", icon: <ArticleOutlinedIcon /> },
  { href: "/cms/blogs/trash", label: "削除一覧", icon: <DeleteOutlineRoundedIcon /> },
  { href: "/cms/tags", label: "タグ", icon: <LocalOfferOutlinedIcon /> },
  { href: "/cms/users", label: "ユーザー一覧", icon: <PeopleAltOutlinedIcon />, adminOnly: true },
  { href: "/cms/notifications", label: "通知", icon: <NotificationsNoneRoundedIcon />, badge: true },
];

// 開いている画面のメニューを強調する。より長く一致するメニューを優先する
function activeHref(pathname: string) {
  return NAV_ITEMS.map((item) => item.href)
    .filter((href) => pathname === href || (href !== "/cms" && pathname.startsWith(`${href}/`)))
    .sort((a, b) => b.length - a.length)[0];
}

export default function CmsShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { count } = useUnreadCount();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const active = activeHref(pathname);

  async function handleLogout() {
    setMenuAnchor(null);
    await logout();
    router.replace("/cms/login");
  }

  const drawer = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box
        component={NextLink}
        href="/cms"
        onClick={() => setMobileOpen(false)}
        sx={{ display: "flex", alignItems: "center", gap: 1, px: 2.5, height: 64, color: "text.primary", textDecoration: "none" }}
      >
        <AutoStoriesRoundedIcon fontSize="small" />
        <Typography sx={{ fontWeight: 700 }}>{SITE_NAME}</Typography>
        <Typography variant="caption" sx={{ color: "text.secondary", border: 1, borderColor: "divider", borderRadius: "4px", px: 0.75, lineHeight: 1.6 }}>
          CMS
        </Typography>
      </Box>
      <List sx={{ px: 1.5, py: 1, flex: 1 }}>
        {NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === "admin").map((item) => {
          const selected = item.href === active;
          return (
            <ListItemButton
              key={item.href}
              href={item.href}
              selected={selected}
              onClick={() => setMobileOpen(false)}
              sx={{
                borderRadius: "6px",
                mb: 0.25,
                py: 0.75,
                color: "text.secondary",
                "& .MuiListItemIcon-root": { color: "inherit" },
                "&.Mui-selected, &.Mui-selected:hover": { color: "text.primary", bgcolor: "action.selected" },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, "& svg": { fontSize: 20 } }}>
                {item.badge ? (
                  <Badge badgeContent={count} color="error" max={99}>
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontSize: 14, fontWeight: selected ? 600 : 500 } } }} />
            </ListItemButton>
          );
        })}
      </List>
      <Divider />
      <List sx={{ px: 1.5, py: 1 }}>
        <ListItemButton href="/" target="_blank" sx={{ borderRadius: "6px", py: 0.75, color: "text.secondary" }}>
          <ListItemIcon sx={{ minWidth: 36, color: "inherit", "& svg": { fontSize: 20 } }}>
            <OpenInNewRoundedIcon />
          </ListItemIcon>
          <ListItemText primary="サイトを見る" slotProps={{ primary: { sx: { fontSize: 14 } } }} />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* サイドメニュー：PC は常に表示、スマートフォン・タブレットはハンバーガーメニュー */}
      <Box component="nav" sx={{ width: { lg: DRAWER_WIDTH }, flexShrink: { lg: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ display: { xs: "block", lg: "none" }, "& .MuiDrawer-paper": { width: DRAWER_WIDTH } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", lg: "block" },
            "& .MuiDrawer-paper": { width: DRAWER_WIDTH, borderRight: 1, borderColor: "divider" },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <AppBar
          position="sticky"
          color="transparent"
          elevation={0}
          sx={{ bgcolor: "background.default", borderBottom: 1, borderColor: "divider" }}
        >
          <Toolbar sx={{ gap: 1, minHeight: { xs: 56, md: 64 } }}>
            <IconButton
              aria-label="メニューを開く"
              onClick={() => setMobileOpen(true)}
              sx={{ display: { lg: "none" } }}
              edge="start"
            >
              <MenuRoundedIcon />
            </IconButton>
            <Box sx={{ flex: 1 }} />
            <ColorModeToggle />
            <Tooltip title="通知">
              <IconButton href="/cms/notifications" aria-label={`通知（未読${count}件）`}>
                <Badge badgeContent={count} color="error" max={99}>
                  <NotificationsNoneRoundedIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <ButtonBase
              onClick={(event) => setMenuAnchor(event.currentTarget)}
              sx={{ borderRadius: 999, pl: 0.5, pr: 1, py: 0.5, gap: 1, ml: 0.5 }}
            >
              {user && <AuthorAvatar author={user} size={30} />}
              <Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "left" }}>
                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                  {user?.name}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.2 }}>
                  {user?.role === "admin" ? "管理者" : "ユーザー"}
                </Typography>
              </Box>
              <ExpandMoreRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} />
            </ButtonBase>
            <Menu
              anchorEl={menuAnchor}
              open={!!menuAnchor}
              onClose={() => setMenuAnchor(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              slotProps={{ paper: { sx: { mt: 1, minWidth: 200 } } }}
            >
              <MenuItem component={NextLink} href="/cms/account" onClick={() => setMenuAnchor(null)}>
                <ListItemIcon>
                  <ManageAccountsOutlinedIcon fontSize="small" />
                </ListItemIcon>
                アカウント設定
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutRoundedIcon fontSize="small" />
                </ListItemIcon>
                ログアウト
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 3, md: 5 }, maxWidth: 1280, width: "100%", mx: "auto" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
