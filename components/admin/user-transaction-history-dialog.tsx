"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { getUserTransactionHistory, type UserTransaction } from "@/lib/actions/admin-credits"
import { ArrowDownCircle, ArrowUpCircle, Gift, Loader2, ShoppingCart } from "lucide-react"
import { useEffect, useState } from "react"

interface UserTransactionHistoryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    userId: string
    userName: string
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    bonus: { label: "Bonus", icon: <Gift className="w-4 h-4" />, color: "text-emerald-400" },
    usage: { label: "Usage", icon: <ArrowDownCircle className="w-4 h-4" />, color: "text-red-400" },
    purchase: { label: "Purchase", icon: <ShoppingCart className="w-4 h-4" />, color: "text-blue-400" },
    refund: { label: "Refund", icon: <ArrowUpCircle className="w-4 h-4" />, color: "text-amber-400" },
}

export function UserTransactionHistoryDialog({
    open,
    onOpenChange,
    userId,
    userName
}: UserTransactionHistoryDialogProps) {
    const [transactions, setTransactions] = useState<UserTransaction[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open && userId) {
            loadTransactions()
        }
    }, [open, userId])

    const loadTransactions = async () => {
        setLoading(true)
        const result = await getUserTransactionHistory(userId)
        if (result.success && result.data) {
            setTransactions(result.data)
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Credit History</DialogTitle>
                    <DialogDescription>
                        Transaction logs for {userName}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto -mx-6 px-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No transactions found.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {transactions.map((tx) => {
                                const config = TYPE_CONFIG[tx.type] || TYPE_CONFIG.usage
                                const isPositive = tx.amount > 0

                                return (
                                    <div
                                        key={tx.id}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border"
                                    >
                                        <div className={`${config.color}`}>
                                            {config.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {tx.description || config.label}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(tx.created_at).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: 'numeric',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={isPositive ? "default" : "secondary"}
                                            className={`font-mono ${isPositive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}
                                        >
                                            {isPositive ? '+' : ''}{tx.amount}
                                        </Badge>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
