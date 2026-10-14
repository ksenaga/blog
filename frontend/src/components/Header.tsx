"use client";

import { Suspense, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Collapse from "@mui/material/Collapse";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import NextLink from "@/components/NextLink";
import SearchBox from "@/components/SearchBox";
import ColorModeToggle from "@/components/ColorModeToggle";
import { SITE_NAME } from "@/lib/site";

export default function Header() {
  // スマートフォンでは虫眼鏡アイコンを押すと検索ボックスを開く
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={{ bgcolor: "background.default", borderBottom: 1, borderColor: "divider" }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: 2, minHeight: { xs: 56, md: 64 } }}>
          <Box
            component={NextLink}
            href="/"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: "text.primary",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <AutoStoriesRoundedIcon fontSize="small" />
            <Typography variant="subtitle1" component="span" sx={{ fontWeight: 700 }}>
              {SITE_NAME}
            </Typography>
          </Box>

          <Box sx={{ flex: 1 }} />

          <Box sx={{ display: { xs: "none", sm: "block" }, width: 280 }}>
            <Suspense>
              <SearchBox />
            </Suspense>
          </Box>
          <IconButton
            aria-label={searchOpen ? "検索を閉じる" : "検索を開く"}
            onClick={() => setSearchOpen((open) => !open)}
            sx={{ display: { xs: "inline-flex", sm: "none" } }}
          >
            {searchOpen ? <CloseIcon /> : <SearchIcon />}
          </IconButton>
          <ColorModeToggle />
        </Toolbar>
        <Collapse in={searchOpen} sx={{ display: { sm: "none" } }} unmountOnExit>
          <Box sx={{ pb: 1.5 }}>
            <Suspense>
              <SearchBox autoFocus onSubmitted={() => setSearchOpen(false)} />
            </Suspense>
          </Box>
        </Collapse>
      </Container>
    </AppBar>
  );
}
