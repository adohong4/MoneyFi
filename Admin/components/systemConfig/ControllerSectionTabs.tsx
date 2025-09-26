// components/system-config/ControllerSectionTabs.tsx
import { Button } from "@/components/ui/button"

interface ControllerSectionTabsProps {
    controllerSection: string
    setControllerSection: (section: string) => void
}

export function ControllerSectionTabs({ controllerSection, setControllerSection }: ControllerSectionTabsProps) {
    const sections = [
        { id: "protocol", label: "Protocol" },
        { id: "token", label: "Token" },
        { id: "strategy", label: "Strategy" },
        { id: "router", label: "Router" },
        { id: "check", label: "Check Functions" },
        { id: "admin", label: "Admin" },
    ]

    return (
        <div className="bg-muted/30 p-1 rounded-lg">
            <div className="grid grid-cols-6 gap-1">
                {sections.map((section) => (
                    <Button
                        key={section.id}
                        variant={controllerSection === section.id ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setControllerSection(section.id)}
                        className="text-xs"
                    >
                        {section.label}
                    </Button>
                ))}
            </div>
        </div>
    )
}