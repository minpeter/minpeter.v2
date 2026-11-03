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
    className="not-prose border-border bg-muted/20 text-foreground my-6 rounded-xl border p-3 sm:p-4"
    data-diagram={name}
  >
    <div className="mb-3 text-center">
      <div className="text-sm leading-snug font-semibold">{title}</div>
    </div>
    {children}
    <figcaption className="text-foreground mt-3 text-center text-sm leading-relaxed">
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
    <div className="text-sm leading-snug font-semibold">{title}</div>
    {detail ? (
      <div className="text-foreground mt-1 text-sm leading-snug">{detail}</div>
    ) : null}
    {children}
  </li>
);

export const FlowArrow = ({ label }: { label: string }) => (
  <li
    aria-label={label}
    className="text-foreground flex h-5 list-none items-center justify-center text-base leading-none font-semibold"
    role="img"
  >
    ↓
  </li>
);

export const LossNote = ({ children }: { children: ReactNode }) => (
  <div className="border-foreground text-foreground mt-3 border-t border-dashed pt-2 text-sm leading-snug font-medium">
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
    className="border-border bg-background rounded-lg border px-3 py-3 text-center"
    data-field={field}
  >
    <div className="font-mono text-base font-semibold">{value}</div>
    <div className="text-foreground mt-1 text-sm leading-snug">{children}</div>
  </div>
);
