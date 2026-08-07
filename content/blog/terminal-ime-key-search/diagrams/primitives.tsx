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
      <div className="font-semibold text-sm leading-snug">{title}</div>
    </div>
    {children}
    <figcaption className="mt-3 text-center text-foreground text-sm leading-relaxed">
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
  <ul aria-label={label} className="m-0 grid list-none gap-2 p-0" data-flow>
    {children}
  </ul>
);

export const FlowStage = ({
  children,
  detail,
  stage,
  title,
  tone = "default",
}: FlowStageProps) => (
  <li
    className={`rounded-lg border px-3 py-3 text-center ${toneClasses[tone]}`}
    data-stage={stage}
    data-tone={tone}
  >
    <div className="font-semibold text-sm leading-snug">{title}</div>
    {detail ? (
      <div className="mt-1 text-foreground text-sm leading-snug">{detail}</div>
    ) : null}
    {children}
  </li>
);

export const FlowArrow = ({ label }: { label: string }) => (
  <li
    aria-label={label}
    className="flex h-5 list-none items-center justify-center font-semibold text-base text-foreground leading-none"
    role="img"
  >
    ↓
  </li>
);

export const LossNote = ({ children }: { children: ReactNode }) => (
  <div className="mt-3 border-foreground border-t border-dashed pt-2 font-medium text-foreground text-sm leading-snug">
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
    <div className="font-mono font-semibold text-base">{value}</div>
    <div className="mt-1 text-foreground text-sm leading-snug">{children}</div>
  </div>
);
