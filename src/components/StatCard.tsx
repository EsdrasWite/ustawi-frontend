import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  variant?: "default" | "primary" | "danger" | "info" | "warning";
  className?: string;
};

const variantStyles: Record<NonNullable<Props["variant"]>, string> = {
  default: "",
  primary: "bg-gradient-primary text-primary-foreground border-transparent",
  danger: "bg-gradient-danger text-destructive-foreground border-transparent",
  info: "bg-gradient-accent text-accent-foreground border-transparent",
  warning: "bg-warning/10 border-warning/30",
};

export const StatCard = ({ label, value, hint, icon, variant = "default", className }: Props) => {
  const isColored = variant === "primary" || variant === "danger" || variant === "info";
  return (
    <div className={cn("stat-card", variantStyles[variant], className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn("text-xs uppercase tracking-wider font-semibold", isColored ? "text-current/80" : "text-muted-foreground")}>
            {label}
          </p>
          <div className={cn("mt-2 font-display font-bold text-3xl tabular truncate", isColored ? "text-current" : "")}>
            {value}
          </div>
          {hint && (
            <p className={cn("mt-2 text-sm", isColored ? "text-current/80" : "text-muted-foreground")}>{hint}</p>
          )}
        </div>
        {icon && (
          <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0",
            isColored ? "bg-white/15 text-current" : "bg-muted text-muted-foreground")}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
