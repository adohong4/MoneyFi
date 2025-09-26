// components/system-config/ControllerSectionContent.tsx
import { ProtocolSection } from "./controllerSections/ProtocolSection"
import { TokenSection } from "./controllerSections/TokenSection"
import { StrategySection } from "./controllerSections/StrategySection"
import { RouterSection } from "./controllerSections/RouterSection"
import { CheckSection } from "./controllerSections/CheckSection"
import { AdminSection } from "./controllerSections/AdminSection"

interface ControllerSectionContentProps {
    controllerSection: string
    isConnected: boolean
    loading: string | null
}

export function ControllerSectionContent({
    controllerSection,
    isConnected,
    loading,
}: ControllerSectionContentProps) {
    return (
        <div className="w-4xl max-w-5xl mx-auto grid grid-cols-1 gap-6">
            {controllerSection === "protocol" && <ProtocolSection isConnected={isConnected} loading={loading} />}
            {controllerSection === "token" && <TokenSection isConnected={isConnected} loading={loading} />}
            {controllerSection === "strategy" && <StrategySection isConnected={isConnected} loading={loading} />}
            {controllerSection === "router" && <RouterSection isConnected={isConnected} loading={loading} />}
            {controllerSection === "check" && <CheckSection isConnected={isConnected} loading={loading} />}
            {controllerSection === "admin" && <AdminSection isConnected={isConnected} loading={loading} />}
        </div>
    )
}