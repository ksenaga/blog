"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { generatePassword } from "@/lib/cms/format";

export const PASSWORD_HELP = "8〜72文字。英字と数字をそれぞれ1文字以上含めてください";

// パスワード入力（表示切り替え・自動生成つき）
export default function PasswordField({
  onGenerate,
  ...props
}: TextFieldProps & { onGenerate?: (password: string) => void }) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      slotProps={{
        htmlInput: { maxLength: 72 },
        input: {
          endAdornment: (
            <InputAdornment position="end">
              {onGenerate && (
                <Button
                  size="small"
                  onClick={() => {
                    onGenerate(generatePassword());
                    setVisible(true);
                  }}
                  sx={{ mr: 0.5, whiteSpace: "nowrap" }}
                >
                  自動生成
                </Button>
              )}
              <IconButton
                aria-label={visible ? "パスワードを隠す" : "パスワードを表示する"}
                onClick={() => setVisible((value) => !value)}
                edge="end"
              >
                {visible ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
