"use client";

import { forwardRef } from "react";
import { css, cx } from "@/styled-system/css";

const buttonStyles = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "2",
  height: "12",
  px: "6",
  borderRadius: "md",
  fontWeight: "500",
  fontSize: "sm",
  letterSpacing: "0.01em",
  cursor: "pointer",
  border: "none",
  background: "ink.action-primary-default",
  color: "ink.background-primary",
  transition: "background 120ms ease, transform 120ms ease",
  _hover: { background: "ink.action-primary-hover" },
  _active: { transform: "translateY(1px)" },
  _disabled: {
    cursor: "not-allowed",
    opacity: 0.55,
    _hover: { background: "ink.action-primary-default" },
  },
});

export const Button = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  function Button({ className, ...props }, ref) {
    return <button ref={ref} className={cx(buttonStyles, className)} {...props} />;
  },
);
