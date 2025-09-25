import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

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

interface UserDetailsDialogProps {
    user: UserData;
}

export function UserDetailsDialog({ user }: UserDetailsDialogProps) {
    const getStatusBadge = (status: boolean) => {
        return status ? (
            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
        ) : (
            <Badge variant="destructive">Suspended</Badge>
        );
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>User Details</DialogTitle>
                    <DialogDescription>Detailed information for user {user.userAddress}</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Address</Label>
                        <p className="font-mono text-sm">{user.userAddress}</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Current Balance</Label>
                        <p className="font-medium">{user.balance} USDC</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Invitation Code</Label>
                        <p className="font-medium">{user.invitationCode}</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Referral Code</Label>
                        <p className="font-medium">{user.referralCode || "N/A"}</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Join Date</Label>
                        <p className="font-medium">{new Date(user.createdAt).toISOString().split("T")[0]}</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Status</Label>
                        {getStatusBadge(user.isActive)}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}