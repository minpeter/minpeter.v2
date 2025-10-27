export default function Callout({
  children,
  emoji,
}: {
  children: React.ReactNode;
  emoji?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-700 bg-card p-4 text-card-foreground shadow-xs">
      {emoji ? emoji : "💡"}
      <p className="font-medium text-neutral-900 text-sm leading-6 dark:text-neutral-100">
        {children}
      </p>
    </div>
  );
}
