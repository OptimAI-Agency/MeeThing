
import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full",
      "border-0 shadow-inner ios-transition",
      "data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-green-400 data-[state=checked]:to-green-500",
      "data-[state=unchecked]:bg-gray-300/50 data-[state=unchecked]:backdrop-blur-sm",
      "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-green-500/30",
      "active:scale-95",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-7 w-7 rounded-full",
        "bg-white shadow-lg ring-0",
        "transition-transform duration-200 ease-out",
        "data-[state=checked]:translate-x-[26px]",
        "data-[state=unchecked]:translate-x-[2px]"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
