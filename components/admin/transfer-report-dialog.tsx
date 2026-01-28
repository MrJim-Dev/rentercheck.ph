"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Search, User, Mail, ArrowRight } from "lucide-react"
import { getAllUsers } from "@/app/actions/admin"
import type { Database } from "@/lib/database.types"

type Report = Database["public"]["Tables"]["incident_reports"]["Row"]
type UserOption = { id: string; email: string; full_name: string | null }

interface TransferReportDialogProps {
    report: Report | null
    isOpen: boolean
    isPending: boolean
    onClose: () => void
    onConfirm: (newUserId: string, reason: string) => void
}

export function TransferReportDialog({
    report,
    isOpen,
    isPending,
    onClose,
    onConfirm,
}: TransferReportDialogProps) {
    const [users, setUsers] = useState<UserOption[]>([])
    const [isLoadingUsers, setIsLoadingUsers] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedUser, setSelectedUser] = useState<UserOption | null>(null)
    const [reason, setReason] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [reporterInfo, setReporterInfo] = useState<UserOption | null>(null)

    const loadUsers = async (search?: string) => {
        if (!report) return
        setIsLoadingUsers(true)
        const result = await getAllUsers(search, report.reporter_id)
        if (result.success && result.data) {
            setUsers(result.data)
        }
        setIsLoadingUsers(false)
    }

    useEffect(() => {
        if (isOpen && report) {
            loadUsers()
            // Set reporter info
            setReporterInfo({
                id: report.reporter_id,
                email: report.reporter_email || "Unknown",
                full_name: null
            })
        } else {
            // Reset state when dialog closes
            setSearchQuery("")
            setSelectedUser(null)
            setReason("")
            setError(null)
            setReporterInfo(null)
        }
    }, [isOpen, report])

    const handleSearch = (query: string) => {
        setSearchQuery(query)
        const delayDebounceFn = setTimeout(() => {
            loadUsers(query)
        }, 300)

        return () => clearTimeout(delayDebounceFn)
    }

    const handleConfirm = () => {
        if (!selectedUser) {
            setError("Please select a user")
            return
        }
        if (!reason.trim()) {
            setError("Please provide a reason for the transfer")
            return
        }
        setError(null)
        onConfirm(selectedUser.id, reason)
    }

    if (!report) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Transfer Report Ownership</DialogTitle>
                    <DialogDescription>
                        Transfer this report to another user. This will change the report&apos;s owner
                        and the new user will have full access to manage it.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Current Report Info */}
                    <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                        <p className="text-sm font-medium">Current Report</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="w-4 h-4" />
                            <span>{report.reported_full_name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Report ID: {report.id}
                        </div>
                        <div className="pt-2 border-t">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Current Owner (Reporter)</p>
                            {reporterInfo && (
                                <div className="flex items-center gap-2 text-sm">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">{reporterInfo.email}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* User Search */}
                    <div className="space-y-2">
                        <Label>Search User</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {/* User List */}
                    <div className="space-y-2">
                        <Label>Select New Owner</Label>
                        <ScrollArea className="h-[200px] border rounded-lg">
                            {isLoadingUsers ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : users.length === 0 ? (
                                <div className="text-center py-8 text-sm text-muted-foreground">
                                    No users found
                                </div>
                            ) : (
                                <div className="p-2">
                                    {users.map((user) => (
                                        <button
                                            key={user.id}
                                            onClick={() => setSelectedUser(user)}
                                            className={`w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors ${
                                                selectedUser?.id === user.id
                                                    ? "bg-primary/10 border border-primary"
                                                    : "border border-transparent"
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">
                                                        {user.full_name || "No name"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {user.email}
                                                    </p>
                                                </div>
                                                {selectedUser?.id === user.id && (
                                                    <div className="flex-shrink-0">
                                                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                            <ArrowRight className="w-3 h-3 text-primary-foreground" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    {/* Selected User Preview */}
                    {selectedUser && (
                        <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                            <p className="text-sm font-medium mb-2">Transfer To:</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <User className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">{selectedUser.full_name || "No name"}</p>
                                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label>Reason for Transfer</Label>
                        <Textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Explain why this report is being transferred..."
                            className="min-h-[100px] resize-none"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isPending || !selectedUser || !reason.trim()}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Transferring...
                            </>
                        ) : (
                            "Transfer Report"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
