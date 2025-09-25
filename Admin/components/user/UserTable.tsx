import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ban, CheckCircle } from "lucide-react";
import { UserDetailsDialog } from "./UserDetailsDialog";

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

interface UserTableProps {
    users: UserData[];
    handleUserAction: (userId: string, action: string) => void;
}

export function UserTable({ users, handleUserAction }: UserTableProps) {
    const getStatusBadge = (status: boolean) => {
        return status ? (
            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
        ) : (
            <Badge variant="destructive">Suspended</Badge>
        );
    };

    const getReferralBadge = (isReferral: boolean) => {
        return isReferral ? (
            <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Yes</Badge>
        ) : (
            <Badge variant="secondary">No</Badge>
        );
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Address</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Invitation Code</TableHead>
                        <TableHead>Is Referral</TableHead>
                        <TableHead>Referral Code</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user._id}>
                            <TableCell className="font-mono text-sm">
                                {user.userAddress.slice(0, 10)}...{user.userAddress.slice(-8)}
                            </TableCell>
                            <TableCell className="font-medium">{user.balance} USDC</TableCell>
                            <TableCell>{user.invitationCode}</TableCell>
                            <TableCell>{getReferralBadge(user.isReferral)}</TableCell>
                            <TableCell>{user.referralCode || "N/A"}</TableCell>
                            <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <UserDetailsDialog user={user} />
                                    {user.isActive ? (
                                        <Button variant="ghost" size="sm" onClick={() => handleUserAction(user._id, "suspend")}>
                                            <Ban className="h-4 w-4 text-red-500" />
                                        </Button>
                                    ) : (
                                        <Button variant="ghost" size="sm" onClick={() => handleUserAction(user._id, "activate")}>
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        </Button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}