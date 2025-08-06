import { cn } from "@/lib/utils";

function Skeleton({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "card" | "text" | "avatar" | "button";
}) {
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