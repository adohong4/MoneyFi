import type React from "react"
import {
  Card as ShadcnCard,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface CardProps {
  className?: string
  children: React.ReactNode
}

interface CardHeaderProps {
  title?: string
  description?: string
  children?: React.ReactNode
}

interface CardContentProps {
  className?: string
  children: React.ReactNode
}

interface CardFooterProps {
  className?: string
  children: React.ReactNode
}

export const Card: React.FC<CardProps> = ({ className, children }) => {
  return <ShadcnCard className={cn(className)}>{children}</ShadcnCard>
}

export const CardHeaderComponent: React.FC<CardHeaderProps> = ({ title, description, children }) => {
  return (
    <CardHeader>
      {title && <CardTitle>{title}</CardTitle>}
      {description && <CardDescription>{description}</CardDescription>}
      {children}
    </CardHeader>
  )
}

export const CardContentComponent: React.FC<CardContentProps> = ({ className, children }) => {
  return <CardContent className={cn(className)}>{children}</CardContent>
}

export const CardFooterComponent: React.FC<CardFooterProps> = ({ className, children }) => {
  return <CardFooter className={cn(className)}>{children}</CardFooter>
}
