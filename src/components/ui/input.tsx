import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  // Prevent React warning when a component changes an input from controlled to uncontrolled
  // If a `value` prop is present but undefined/null, normalize it to an empty string
  const hasValueProp = Object.prototype.hasOwnProperty.call(props, "value");
  const safeProps = hasValueProp
    ? { ...(props as any), value: (props as any).value ?? "" }
    : props;

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-[35px] w-full min-w-0 rounded-md border bg-transparent px-3 py-0 text-sm leading-none box-border shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...(safeProps as any)}
    />
  );
}

export { Input };
