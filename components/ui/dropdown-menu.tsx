"use client";

import * as React from "react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { cn } from "@/lib/utils";

function DropdownMenu(
  props: React.ComponentProps<typeof MenuPrimitive.Root>
) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuTrigger(
  props: React.ComponentProps<typeof MenuPrimitive.Trigger>
) {
  return (
    <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
  );
}

type DropdownMenuContentProps = React.ComponentProps<typeof MenuPrimitive.Popup> & {
  sideOffset?: number;
  align?: "start" | "center" | "end";
};

function DropdownMenuContent({
  className,
  children,
  sideOffset = 8,
  align = "end",
  ...props
}: DropdownMenuContentProps) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        sideOffset={sideOffset}
        align={align}
        data-slot="dropdown-menu-positioner"
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            "z-50 min-w-44 rounded-lg border border-zinc-700 bg-zinc-900 p-1.5 text-zinc-100 shadow-lg backdrop-blur-none",
            className
          )}
          {...props}
        >
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

function DropdownMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Item>) {
  return (
    <MenuPrimitive.Item
      render={<button type="button" />}
      data-slot="dropdown-menu-item"
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-zinc-100 outline-none transition-colors data-highlighted:bg-zinc-800",
        className
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
};
