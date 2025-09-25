import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface UserData {
    _id: string;
    userAddress: string;
    invitationCode: string;
    isReferral: boolean;
    referralCode: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    balance: number;
    __v: number;
}

interface StatsCardsProps {
    users: UserData[];
}

export function StatsCards({ users }: StatsCardsProps) {
    const activeUsers = users.filter((u) => u.isActive).length;
    const suspendedUsers = users.filter((u) => !u.isActive).length;
    const totalTVL = "N/A"; // Mocked, as TVL is not in JSON; adjust if needed

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{activeUsers}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Suspended Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{suspendedUsers}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total TVL</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalTVL}</div>
                </CardContent>
            </Card>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    {users.length} Total Users
                </div>
            </div>
        </div>
    );
}