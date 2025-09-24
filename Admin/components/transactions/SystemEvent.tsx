// components/TransactionHistory/SystemEvents.tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, TrendingUp, Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface SystemEvent {
    id: string
    type: string
    title: string
    description: string
    admin: string
    timestamp: string
    severity: string
}

interface SystemEventsProps {
    events: SystemEvent[]
}

export function SystemEvents({ events }: SystemEventsProps) {
    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case "high":
                return <Badge variant="destructive">High</Badge>
            case "medium":
                return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Medium</Badge>
            case "low":
                return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Low</Badge>
            default:
                return <Badge variant="secondary">Info</Badge>
        }
    }

    const getEventIcon = (type: string) => {
        switch (type) {
            case "emergency":
                return <AlertTriangle className="h-4 w-4 text-red-500" />
            case "config_change":
                return <RefreshCw className="h-4 w-4 text-blue-500" />
            case "pool_update":
                return <TrendingUp className="h-4 w-4 text-green-500" />
            default:
                return <Activity className="h-4 w-4 text-gray-500" />
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>System Events</CardTitle>
                <CardDescription>Important system events and administrative actions</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {events.map((event) => (
                        <div key={event.id} className="flex items-start gap-4 p-4 rounded-lg border">
                            <div className="mt-1">{getEventIcon(event.type)}</div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium">{event.title}</h4>
                                    {getSeverityBadge(event.severity)}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>Admin: {event.admin === "System" ? "System" : `${event.admin.slice(0, 6)}...`}</span>
                                    <span>{event.timestamp}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}