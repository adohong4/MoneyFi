import type React from "react"
import { Input as ShadcnInput } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input: React.FC<InputProps> = ({ className, error, ...props }) => {
  return (
    <div className="space-y-1">
      <ShadcnInput className={cn(error && "border-destructive focus-visible:ring-destructive", className)} {...props} />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
