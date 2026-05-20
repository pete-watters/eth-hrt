import { css, cx } from "@/styled-system/css";

const cardStyles = css({
  background: "ink.background-secondary",
  border: "1px solid",
  borderColor: "ink.border-default",
  borderRadius: "lg",
  p: "8",
});

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx(cardStyles, className)} {...props} />;
}
