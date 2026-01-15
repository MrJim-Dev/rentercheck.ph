"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getAdminUsersList, type AdminUser } from "@/lib/actions/admin-credits"
import { Coins, History, Loader2, Search, User } from "lucide-react"
import { useEffect, useState } from "react"
import { UserTransactionHistoryDialog } from "./user-transaction-history-dialog"

export function AdminUserCreditTable() {
    const [users, setUsers] = useState<AdminUser[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Dialog state
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
    const [showHistoryDialog, setShowHistoryDialog] = useState(false)

    useEffect(() => {
        loadUsers()
    }, [])

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            loadUsers()
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const loadUsers = async () => {
        setLoading(true)
        const result = await getAdminUsersList(searchQuery || undefined)
        if (result.success && result.data) {
            setUsers(result.data)
        }
        setLoading(false)
    }

    const handleViewHistory = (user: AdminUser) => {
        setSelectedUser(user)
        setShowHistoryDialog(true)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Coins className="w-5 h-5" />
                    User Credits
                </CardTitle>
                <CardDescription>
                    View all users and their credit balances. Click "View Logs" to see transaction history.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* User List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No users found.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {users.map((user) => (
                            <div
                                key={user.id}
                                className="flex items-center gap-4 p-4 rounded-lg border bg-card/50 hover:bg-muted/30 transition-colors"
                            >
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                        <User className="w-5 h-5 text-muted-foreground" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                        {user.full_name || 'Unnamed User'}
                                    </p>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {user.email}
                                    </p>
                                </div>

                                {/* Balance */}
                                <Badge
                                    variant="outline"
                                    className="font-mono text-base px-3 py-1 shrink-0"
                                >
                                    <Coins className="w-4 h-4 mr-1.5 text-amber-400" />
                                    {user.balance}
                                </Badge>

                                {/* Action */}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleViewHistory(user)}
                                    className="shrink-0 gap-1.5"
                                >
                                    <History className="w-4 h-4" />
                                    <span className="hidden sm:inline">View Logs</span>
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            {/* History Dialog */}
            {selectedUser && (
                <UserTransactionHistoryDialog
                    open={showHistoryDialog}
                    onOpenChange={setShowHistoryDialog}
                    userId={selectedUser.id}
                    userName={selectedUser.full_name || selectedUser.email}
                />
            )}
        </Card>
    )
}
