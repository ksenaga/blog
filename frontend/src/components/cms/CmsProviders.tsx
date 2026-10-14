"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/components/cms/AuthProvider";
import { FeedbackProvider } from "@/components/cms/FeedbackProvider";

export default function CmsProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <FeedbackProvider>{children}</FeedbackProvider>
    </AuthProvider>
  );
}
