import type { ReactNode } from "react";

interface DiagramFigureProps {
  children: ReactNode;
  description: string;
  name: string;
  title: string;
}

interface FlowStageProps {
  children?: ReactNode;
  detail?: string;
  stage: string;
  title: string;
  tone?: "default" | "emphasis" | "loss";
}

const toneClasses: Record<NonNullable<FlowStageProps["tone"]>, string> = {
  default: "border-border bg-background",
  emphasis: "border-foreground bg-muted",
  loss: "border-2 border-foreground bg-background",
};

export const DiagramFigure = ({
  children,
  description,
  name,
  title,
}: DiagramFigureProps) => (
  <figure
    aria-label={description}
    className="not-prose my-6 rounded-xl border border-border bg-muted/20 p-3 text-foreground sm:p-4"
    data-diagram={name}
  >
    <div className="mb-3 text-center">
      <div className="text-sm font-semibold leading-snug">{title}</div>
    </div>
    {children}
    <figcaption className="mt-3 text-center text-sm leading-relaxed text-foreground">
      {description}
    </figcaption>
  </figure>
);

export const DiagramFlow = ({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) => (
  <div aria-label={label} className="grid gap-2" data-flow role="list">
    {children}
  </div>
);

export const FlowStage = ({
  children,
  detail,
  stage,
  title,
  tone = "default",
}: FlowStageProps) => (
  <div
    className={`rounded-lg border px-3 py-3 text-center ${toneClasses[tone]}`}
    data-stage={stage}
    data-tone={tone}
    role="listitem"
  >
    <div className="text-sm font-semibold leading-snug">{title}</div>
    {detail ? (
      <div className="mt-1 text-sm leading-snug text-foreground">{detail}</div>
    ) : null}
    {children}
  </div>
);

export const FlowArrow = ({ label }: { label: string }) => (
  <div
    aria-label={label}
    className="flex h-5 items-center justify-center text-base font-semibold leading-none text-foreground"
    role="img"
  >
    ↓
  </div>
);

export const LossNote = ({ children }: { children: ReactNode }) => (
  <div className="mt-3 border-t border-dashed border-foreground pt-2 text-sm font-medium leading-snug text-foreground">
    <span aria-hidden="true" className="mr-1">
      ×
    </span>
    {children}
  </div>
);

export const FieldCard = ({
  children,
  field,
  value,
}: {
  children: ReactNode;
  field: string;
  value: string;
}) => (
  <div
    className="rounded-lg border border-border bg-background px-3 py-3 text-center"
    data-field={field}
  >
    <div className="font-mono text-base font-semibold">{value}</div>
    <div className="mt-1 text-sm leading-snug text-foreground">{children}</div>
  </div>
);
