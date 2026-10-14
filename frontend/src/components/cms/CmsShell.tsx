"use client";

// 管理画面の共通レイアウト（screendesign.md 5-0）
import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
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
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
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
        sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 3, height: 68, color: "text.primary", textDecoration: "none" }}
      >
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            width: 36,
            height: 36,
            borderRadius: "12px",
            color: "#fff",
            background: "linear-gradient(135deg, #6366f1, #db2777)",
          }}
        >
          <AutoStoriesRoundedIcon fontSize="small" />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>{SITE_NAME}</Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: "0.12em" }}>
            CMS
          </Typography>
        </Box>
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
              sx={(theme) => ({
                borderRadius: "12px",
                mb: 0.5,
                "&.Mui-selected": {
                  color: theme.vars.palette.primary.main,
                  bgcolor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.1)`,
                  "& .MuiListItemIcon-root": { color: theme.vars.palette.primary.main },
                },
              })}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.badge ? (
                  <Badge badgeContent={count} color="secondary" max={99}>
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: selected ? 700 : 500 } } }} />
            </ListItemButton>
          );
        })}
      </List>
      <Divider />
      <List sx={{ px: 1.5, py: 1 }}>
        <ListItemButton href="/" target="_blank" sx={{ borderRadius: "12px" }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <OpenInNewRoundedIcon />
          </ListItemIcon>
          <ListItemText primary="サイトを見る" />
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
          sx={(theme) => ({
            backdropFilter: "saturate(180%) blur(16px)",
            backgroundColor: `rgba(${theme.vars.palette.background.defaultChannel} / 0.8)`,
            borderBottom: `1px solid ${theme.vars.palette.divider}`,
          })}
        >
          <Toolbar sx={{ gap: 1, minHeight: { xs: 60, md: 68 } }}>
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
                <Badge badgeContent={count} color="secondary" max={99}>
                  <NotificationsNoneRoundedIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <ButtonBase
              onClick={(event) => setMenuAnchor(event.currentTarget)}
              sx={{ borderRadius: 999, pl: 0.5, pr: 1, py: 0.5, gap: 1, ml: 0.5 }}
            >
              <Avatar sx={{ width: 32, height: 32, fontSize: 14, fontWeight: 700, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff" }}>
                {user?.name.charAt(0)}
              </Avatar>
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

        <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, width: "100%", mx: "auto" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
