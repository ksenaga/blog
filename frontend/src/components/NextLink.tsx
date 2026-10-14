"use client";

import Link, { type LinkProps } from "next/link";
import { forwardRef, type AnchorHTMLAttributes } from "react";

// MUI のコンポーネントに渡すための Next.js の Link
const NextLink = forwardRef<
  HTMLAnchorElement,
  LinkProps & AnchorHTMLAttributes<HTMLAnchorElement>
>(function NextLink(props, ref) {
  return <Link ref={ref} {...props} />;
});

export default NextLink;
