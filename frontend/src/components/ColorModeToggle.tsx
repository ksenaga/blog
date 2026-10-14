"use client";

import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useColorScheme } from "@mui/material/styles";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";

// ライトモードとダークモードを切り替える（初期値は OS の設定に合わせる）
export default function ColorModeToggle() {
  const { mode, systemMode, setMode } = useColorScheme();
  if (!mode) {
    // サーバーで描画したときは設定が分からないため、場所だけ確保しておく
    return <IconButton aria-hidden disabled sx={{ visibility: "hidden" }}><DarkModeOutlinedIcon /></IconButton>;
  }

  const current = mode === "system" ? systemMode : mode;
  const next = current === "dark" ? "light" : "dark";

  return (
    <Tooltip title={next === "dark" ? "ダークモードにする" : "ライトモードにする"}>
      <IconButton aria-label={next === "dark" ? "ダークモードにする" : "ライトモードにする"} onClick={() => setMode(next)}>
        {current === "dark" ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
      </IconButton>
    </Tooltip>
  );
}
