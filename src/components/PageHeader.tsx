import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const PageHeader = ({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) => {
  return (
    <header className={cn("flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 animate-fade-in", className)}>
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-balance">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-2 text-pretty max-w-2xl">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
};
