
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "card" | "text" | "avatar" | "button";
}

function Skeleton({
  className,
  variant = "default",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted", 
        {
          "h-6 w-full": variant === "text",
          "h-12 w-12 rounded-full": variant === "avatar",
          "h-10 w-32": variant === "button",
          "w-full h-[120px]": variant === "card",
        },
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
