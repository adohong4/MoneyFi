"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw, Wallet } from "lucide-react"

interface InputWithButtonProps {
  label: string
  placeholder: string
  buttonText: string
  onButtonClick: (value: string) => void
  loading?: boolean
  disabled?: boolean
  type?: string
  step?: string
  min?: string
  max?: string
}

export function InputWithButton({
  label,
  placeholder,
  buttonText,
  onButtonClick,
  loading = false,
  disabled = false,
  type = "text",
  step,
  min,
  max,
}: InputWithButtonProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const value = formData.get("input") as string
    onButtonClick(value)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Label htmlFor={`input-${buttonText}`}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={`input-${buttonText}`}
          name="input"
          type={type}
          placeholder={placeholder}
          step={step}
          min={min}
          max={max}
          className="flex-1"
          disabled={disabled}
        />
        <Button type="submit" disabled={loading || disabled} className="gap-2 whitespace-nowrap">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
          {buttonText}
        </Button>
      </div>
    </form>
  )
}
