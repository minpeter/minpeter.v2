import { cva } from "class-variance-authority";

// codeVariants is intentionally exported and used (e.g. in show demos and potential MDX overrides)
export const codeVariants = cva(
  "bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
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
