"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Pagination } from "@/components/pagination";
import { StatsCards } from "./StatsCards";
import { UserFilters } from "./UserFilters";
import { UserTable } from "./UserTable";
import { UserAPI, ResponsePaginate, UserData } from "@/services/apis/user.api";

export function UserManagement() {
    const { toast } = useToast();
    const [users, setUsers] = useState<UserData[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10); // Match JSON limit
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(false);

    const userAPI = new UserAPI();

    // Fetch users from API
    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const response: ResponsePaginate = await userAPI.GetAllUsers({
                    page: currentPage,
                    limit: pageSize,
                });
                setUsers(response.metadata.users);
                setTotalPages(response.metadata.totalPages);
                setTotalItems(response.metadata.totalUser);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to fetch users.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [currentPage, pageSize]);

    // Handle search and filter
    useEffect(() => {
        const searchUsers = async () => {
            if (!searchTerm && statusFilter === "all") return;
            setLoading(true);
            try {
                const response: ResponsePaginate = await userAPI.searchTransactions({
                    query: searchTerm,
                    status: statusFilter === "all" ? undefined : statusFilter,
                });
                setUsers(response.metadata.users);
                setTotalPages(response.metadata.totalPages);
                setTotalItems(response.metadata.totalUser);
                setCurrentPage(1);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to search users.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };
        searchUsers();
    }, [searchTerm, statusFilter]);

    // Handle user actions (suspend/activate)
    const handleUserAction = (userId: string, action: string) => {
        setUsers(
            users.map((user) =>
                user._id === userId
                    ? { ...user, isActive: action === "suspend" ? false : true }
                    : user
            )
        );
        toast({
            title: "User Updated",
            description: `User has been ${action === "suspend" ? "suspended" : "activated"} successfully.`,
        });
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-balance">User Management</h1>
                    <p className="text-muted-foreground">Monitor and manage protocol users and their activities</p>
                </div>
            </div>

            {/* Stats Cards */}
            <StatsCards users={users} />

            {/* Filters and Table */}
            <Card>
                <CardHeader>
                    <CardTitle>User Directory</CardTitle>
                    <CardDescription>Search and filter protocol users</CardDescription>
                </CardHeader>
                <CardContent>
                    <UserFilters
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                    />
                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        <>
                            <UserTable users={users} handleUserAction={handleUserAction} />
                            <div className="mt-4">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    pageSize={pageSize}
                                    totalItems={totalItems}
                                    onPageChange={setCurrentPage}
                                    onPageSizeChange={(newPageSize) => {
                                        setPageSize(newPageSize);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}