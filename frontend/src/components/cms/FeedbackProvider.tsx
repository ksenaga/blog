"use client";

// トースト（成功・エラーの通知）と確認ダイアログ（screendesign.md 6章）
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Snackbar from "@mui/material/Snackbar";
import TextField from "@mui/material/TextField";
import { errorMessage } from "@/lib/cms/api";

type ToastSeverity = "success" | "error" | "info";
type Toast = { id: number; message: string; severity: ToastSeverity };

type ConfirmOptions = {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  // 削除などの危険な操作はボタンを赤にする
  danger?: boolean;
  // この文字列を入力したときだけ実行できる（ユーザー削除の確認）
  requireText?: string;
};

type FeedbackContextValue = {
  toast: (message: string, severity?: ToastSeverity) => void;
  toastError: (error: unknown) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toastState, setToastState] = useState<Toast | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);
  const [typed, setTyped] = useState("");
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const toast = useCallback((message: string, severity: ToastSeverity = "success") => {
    setToastState({ id: Date.now(), message, severity });
  }, []);

  const toastError = useCallback((error: unknown) => toast(errorMessage(error), "error"), [toast]);

  const confirm = useCallback((options: ConfirmOptions) => {
    setConfirmOptions(options);
    setTyped("");
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setOpen(false);
  };

  const canConfirm = !confirmOptions?.requireText || typed === confirmOptions.requireText;

  return (
    <FeedbackContext.Provider value={{ toast, toastError, confirm }}>
      {children}

      <Snackbar
        key={toastState?.id}
        open={!!toastState}
        autoHideDuration={3000}
        onClose={(_, reason) => reason !== "clickaway" && setToastState(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          variant="outlined"
          severity={toastState?.severity ?? "success"}
          onClose={() => setToastState(null)}
          sx={{ minWidth: 280, bgcolor: "background.paper", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)" }}
        >
          {toastState?.message}
        </Alert>
      </Snackbar>

      <Dialog open={open} onClose={() => close(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18 }}>{confirmOptions?.title}</DialogTitle>
        <DialogContent>
          {confirmOptions?.message && (
            <DialogContentText component="div" sx={{ whiteSpace: "pre-line" }}>
              {confirmOptions.message}
            </DialogContentText>
          )}
          {confirmOptions?.requireText && (
            <TextField
              autoFocus
              fullWidth
              size="small"
              sx={{ mt: 2 }}
              label={`確認のため「${confirmOptions.requireText}」と入力してください`}
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => close(false)} color="inherit">
            キャンセル
          </Button>
          <Button
            variant="contained"
            color={confirmOptions?.danger ? "error" : "primary"}
            onClick={() => close(true)}
            disabled={!canConfirm}
            autoFocus={!confirmOptions?.requireText}
          >
            {confirmOptions?.confirmLabel ?? "OK"}
          </Button>
        </DialogActions>
      </Dialog>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error("FeedbackProvider の中で使ってください");
  return context;
}
