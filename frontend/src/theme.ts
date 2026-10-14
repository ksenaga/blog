"use client";

import { createTheme } from "@mui/material/styles";
import NextLink from "@/components/NextLink";

// モダンでシンプルなテーマ：グレーを基本に、アクセントは黒（ダークモードは白）
// 影やグラデーションは使わず、細い枠線と余白で区切る
const theme = createTheme({
  cssVariables: { colorSchemeSelector: "class" },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#18181b", contrastText: "#ffffff" },
        secondary: { main: "#2563eb" },
        background: { default: "#ffffff", paper: "#ffffff" },
        text: { primary: "#18181b", secondary: "#71717a", disabled: "#a1a1aa" },
        divider: "#e4e4e7",
        action: { hover: "rgba(24, 24, 27, 0.04)", selected: "rgba(24, 24, 27, 0.06)" },
      },
    },
    dark: {
      palette: {
        primary: { main: "#fafafa", contrastText: "#18181b" },
        secondary: { main: "#60a5fa" },
        background: { default: "#09090b", paper: "#09090b" },
        text: { primary: "#fafafa", secondary: "#a1a1aa", disabled: "#52525b" },
        divider: "#27272a",
        action: { hover: "rgba(250, 250, 250, 0.05)", selected: "rgba(250, 250, 250, 0.08)" },
      },
    },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: "var(--font-noto-sans-jp), system-ui, sans-serif",
    h1: { fontWeight: 700, letterSpacing: "-0.02em" },
    h2: { fontWeight: 700, letterSpacing: "-0.02em" },
    h3: { fontWeight: 700, letterSpacing: "-0.01em" },
    h4: { fontWeight: 700, letterSpacing: "-0.01em" },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { fontWeight: 600, textTransform: "none" },
  },
  components: {
    // href を渡したボタンやカードは Next.js の Link で画面遷移する
    MuiButtonBase: {
      defaultProps: { LinkComponent: NextLink, disableRipple: true },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 8, paddingInline: 16 } },
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
    },
    MuiCard: {
      defaultProps: { variant: "outlined" },
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600, borderRadius: 6 } },
    },
    MuiTableCell: {
      styleOverrides: { head: { fontSize: 13 } },
    },
    MuiAlert: {
      defaultProps: { variant: "outlined" },
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiTooltip: {
      styleOverrides: { tooltip: { fontSize: 12 } },
    },
  },
});

export default theme;
