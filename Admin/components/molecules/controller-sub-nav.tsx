"use client"

import type React from "react"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface ControllerSubNavProps {
  children: React.ReactNode
}

export function ControllerSubNav({ children }: ControllerSubNavProps) {
  const [activeTab, setActiveTab] = useState("protocol")

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 h-auto p-1">
          <TabsTrigger value="protocol" className="text-xs">
            Protocol
            <Badge variant="secondary" className="ml-1 text-xs">
              3
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="tokens" className="text-xs">
            Tokens
            <Badge variant="secondary" className="ml-1 text-xs">
              2
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="strategies" className="text-xs">
            Strategies
            <Badge variant="secondary" className="ml-1 text-xs">
              4
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="routers" className="text-xs">
            Routers
            <Badge variant="secondary" className="ml-1 text-xs">
              4
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="checks" className="text-xs">
            Checks
            <Badge variant="secondary" className="ml-1 text-xs">
              5
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="admin" className="text-xs">
            Admin
            <Badge variant="secondary" className="ml-1 text-xs">
              3
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="protocol">{children}</TabsContent>
        <TabsContent value="tokens">{children}</TabsContent>
        <TabsContent value="strategies">{children}</TabsContent>
        <TabsContent value="routers">{children}</TabsContent>
        <TabsContent value="checks">{children}</TabsContent>
        <TabsContent value="admin">{children}</TabsContent>
      </Tabs>
    </div>
  )
}
