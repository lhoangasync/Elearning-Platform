import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex outline-none rounded-md h-10 px-3 w-full text-sm border border-gray-200 focus:!border-primary transition-all",
        className
      )}
      {...props}
    />
  );
}

export { Input };
