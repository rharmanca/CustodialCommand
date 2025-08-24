import clsx from "clsx"

type ClassValue = string | number | boolean | undefined | null | { [key: string]: any } | ClassValue[]
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
