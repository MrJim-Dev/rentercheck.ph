"use client"

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { adjustUserCredits } from "@/lib/actions/admin-credits"
import { Loader2 } from "lucide-react"
import { useState } from "react"

interface ManageUserCreditsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    userId: string
    userName: string
    currentBalance: number
    onSuccess?: () => void
}

export function ManageUserCreditsDialog({
    open,
    onOpenChange,
    userId,
    userName,
    currentBalance,
    onSuccess
}: ManageUserCreditsDialogProps) {
    const [amount, setAmount] = useState("")
    const [type, setType] = useState<"add" | "deduct">("add")
    const [reason, setReason] = useState("")
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const numAmount = parseInt(amount)
        if (isNaN(numAmount) || numAmount <= 0) {
            toast({
                title: "Invalid Amount",
                description: "Please enter a valid positive number",
                variant: "destructive"
            })
            return
        }

        if (!reason.trim()) {
            toast({
                title: "Reason Required",
                description: "Please provide a reason for this adjustment",
                variant: "destructive"
            })
            return
        }

        setLoading(true)
        // Calculate final adjustment amount (positive or negative)
        const finalAmount = type === "add" ? numAmount : -numAmount

        const result = await adjustUserCredits(userId, finalAmount, reason)

        if (result.success) {
            toast({
                title: "Success",
                description: `Successfully ${type === 'add' ? 'added' : 'deducted'} ${numAmount} credits.`,
            })
            onSuccess?.()
            onOpenChange(false)
            // Reset form
            setAmount("")
            setReason("")
            setType("add")
        } else {
            toast({
                title: "Error",
                description: result.error || "Failed to adjust credits",
                variant: "destructive"
            })
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Manage Credits</DialogTitle>
                    <DialogDescription>
                        Manually adjust credit balance for <span className="font-medium text-foreground">{userName}</span>.
                        <br />
                        Current Balance: <span className="font-mono">{currentBalance}</span>
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Action Type</Label>
                            <Select value={type} onValueChange={(v) => setType(v as "add" | "deduct")}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="add">Add Credits</SelectItem>
                                    <SelectItem value="deduct">Deduct Credits</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Amount</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                min="1"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Reason / Note</Label>
                        <Textarea
                            placeholder="e.g. Refund for failed report, manual bonus, etc."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="resize-none"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {type === "add" ? "Add Credits" : "Deduct Credits"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
