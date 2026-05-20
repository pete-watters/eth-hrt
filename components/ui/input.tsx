"use client";

import { forwardRef } from "react";
import { css, cx } from "@/styled-system/css";

const inputStyles = css({
  width: "100%",
  height: "14",
  px: "5",
  borderRadius: "md",
  fontSize: "md",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  background: "ink.component-background-default",
  color: "ink.text-primary",
  border: "1px solid",
  borderColor: "ink.border-default",
  outline: "none",
  transition: "border-color 120ms ease, box-shadow 120ms ease",
  _placeholder: { color: "ink.text-non-interactive" },
  _focus: {
    borderColor: "blue.action-primary-default",
    boxShadow: "0 0 0 3px token(colors.blue.background-primary)",
  },
});

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cx(inputStyles, className)} {...props} />;
  },
);
