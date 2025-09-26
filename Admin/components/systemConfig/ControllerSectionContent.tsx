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
    handleConfigAction: (actionName: string, params: any) => void
}

export function ControllerSectionContent({
    controllerSection,
    isConnected,
    loading,
    handleConfigAction,
}: ControllerSectionContentProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {controllerSection === "protocol" && (
                <ProtocolSection
                    isConnected={isConnected}
                    loading={loading}
                    handleConfigAction={handleConfigAction}
                />
            )}
            {controllerSection === "token" && (
                <TokenSection
                    isConnected={isConnected}
                    loading={loading}
                    handleConfigAction={handleConfigAction}
                />
            )}
            {controllerSection === "strategy" && (
                <StrategySection
                    isConnected={isConnected}
                    loading={loading}
                    handleConfigAction={handleConfigAction}
                />
            )}
            {controllerSection === "router" && (
                <RouterSection
                    isConnected={isConnected}
                    loading={loading}
                    handleConfigAction={handleConfigAction}
                />
            )}
            {controllerSection === "check" && (
                <CheckSection
                    isConnected={isConnected}
                    loading={loading}
                    handleConfigAction={handleConfigAction}
                />
            )}
            {controllerSection === "admin" && (
                <AdminSection
                    isConnected={isConnected}
                    loading={loading}
                    handleConfigAction={handleConfigAction}
                />
            )}
        </div>
    )
}