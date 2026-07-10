import { cva } from "class-variance-authority";

// codeVariants is intentionally exported and used (e.g. in show demos and potential MDX overrides)
export const codeVariants = cva(
  "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono font-semibold text-sm",
  {
    defaultVariants: {
      color: "primary",
    },
    variants: {
      color: {
        primary: "",
      },
    },
  }
);
