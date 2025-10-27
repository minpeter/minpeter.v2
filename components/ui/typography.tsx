import { cva } from "class-variance-authority";

export const h1Variants = cva(
  "scroll-m-20 font-extrabold text-4xl tracking-tight lg:text-5xl",
  {
    variants: {
      color: {
        primary: "",
      },
    },
    defaultVariants: {
      color: "primary",
    },
  }
);

export const h2Variants = cva(
  "scroll-m-20 border-b pb-2 font-semibold text-3xl tracking-tight first:mt-0",
  {
    variants: {
      color: {
        primary: "",
      },
    },
    defaultVariants: {
      color: "primary",
    },
  }
);

export const h3Variants = cva(
  "scroll-m-20 font-semibold text-2xl tracking-tight",
  {
    variants: {
      color: {
        primary: "",
      },
    },
    defaultVariants: {
      color: "primary",
    },
  }
);

export const h4Variants = cva(
  "scroll-m-20 font-semibold text-xl tracking-tight",
  {
    variants: {
      color: {
        primary: "",
      },
    },
    defaultVariants: {
      color: "primary",
    },
  }
);

export const pVariants = cva("not-first:mt-6 leading-7", {
  variants: {
    color: {
      primary: "",
    },
  },
  defaultVariants: {
    color: "primary",
  },
});

export const blockquoteVariants = cva("mt-6 border-l-2 pl-6 italic", {
  variants: {
    color: {
      primary: "",
    },
  },
  defaultVariants: {
    color: "primary",
  },
});

export const ulVariants = cva("ml-6 list-disc [&>li]:mt-0", {
  variants: {
    color: {
      primary: "",
    },
  },
  defaultVariants: {
    color: "primary",
  },
});

export const codeVariants = cva(
  "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono font-semibold text-sm",
  {
    variants: {
      color: {
        primary: "",
      },
    },
    defaultVariants: {
      color: "primary",
    },
  }
);

export const leadVariants = cva("text-muted-foreground text-xl", {
  variants: {
    color: {
      primary: "",
    },
  },
  defaultVariants: {
    color: "primary",
  },
});

export const largeVariants = cva("font-semibold text-lg", {
  variants: {
    color: {
      primary: "",
    },
  },
  defaultVariants: {
    color: "primary",
  },
});

export const smallVariants = cva("font-medium text-sm leading-none", {
  variants: {
    color: {
      primary: "",
    },
  },
  defaultVariants: {
    color: "primary",
  },
});

export const mutedVariants = cva("text-muted-foreground text-sm", {
  variants: {
    color: {
      primary: "",
    },
  },
  defaultVariants: {
    color: "primary",
  },
});
