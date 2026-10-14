"use client";

import { createTheme } from "@mui/material/styles";
import NextLink from "@/components/NextLink";

// ライト・ダークの両方に対応したテーマ。色は CSS 変数として出力される
const theme = createTheme({
  cssVariables: { colorSchemeSelector: "class" },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#4f46e5" },
        secondary: { main: "#db2777" },
        background: { default: "#f7f7fb", paper: "#ffffff" },
        text: { primary: "#1f2937", secondary: "#6b7280" },
        divider: "rgba(15, 23, 42, 0.08)",
      },
    },
    dark: {
      palette: {
        primary: { main: "#a5b4fc" },
        secondary: { main: "#f9a8d4" },
        background: { default: "#0b0d17", paper: "#131627" },
        text: { primary: "#e5e7eb", secondary: "#9ca3af" },
        divider: "rgba(255, 255, 255, 0.08)",
      },
    },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: "var(--font-noto-sans-jp), system-ui, sans-serif",
    h1: { fontWeight: 800, letterSpacing: "-0.02em" },
    h2: { fontWeight: 800, letterSpacing: "-0.02em" },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { fontWeight: 700, textTransform: "none" },
  },
  components: {
    // href を渡したボタンやカードは Next.js の Link で画面遷移する
    MuiButtonBase: {
      defaultProps: { LinkComponent: NextLink },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 999, paddingInline: 20 } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: ({ theme }) => ({
          border: `1px solid ${theme.vars.palette.divider}`,
          borderRadius: 20,
        }),
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600 } },
    },
  },
});

export default theme;
