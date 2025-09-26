import { Search } from "lucide-react"

export const URL = "http://localhost:4001/v1/api"

export const TRANSACTION_API_ENDPOINTS = {
    transactionLog: "/trigger/transaction",
    search: "/trigger/search",
}
export const POOL_API_ENDPOINTS = {
    poolAdd: "/pool/add",
    poolGet: "/pool/get",
    poolUpdate: "/pool/update",
}

export const USER_API_ENDPOINTS = {
    userGet: "/user/getAll",
    userInfor: "/user/infor",
    search: "/user/search",
}

export const ADMIN_API_ENDPOINTS = {
    adminCreate: "/admin/create",
    adminGet: "/admin/get",
    adminPut: "/admin/update",
}