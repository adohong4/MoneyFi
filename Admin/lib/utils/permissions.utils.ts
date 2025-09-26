import {
    admin_permissions,
    operator_permissions,
    delegate_admin_permissions,
    signer_permissions,
} from "@/lib/web3/type/permissions"
import { ROLE } from "@/lib/web3/config"

export const roleMapping: {
    [key: string]: { name: string; permissions: string[] }
} = {
    [ROLE.ADMIN_ROLE]: { name: "Super Admin", permissions: admin_permissions },
    [ROLE.ADMIN_DELEGATE_ROLE]: { name: "Delegate Admin", permissions: delegate_admin_permissions },
    [ROLE.OPERATOR_ROLE]: { name: "Operator", permissions: operator_permissions },
    [ROLE.SIGNER_ROLE]: { name: "Signer", permissions: signer_permissions },
}