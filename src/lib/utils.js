import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function for conditionally joining classNames together
 * Used by shadcn/ui components
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
