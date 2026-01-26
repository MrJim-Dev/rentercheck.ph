'use client'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { betaRefillCredits, getCreditsBalance } from '@/lib/actions/credits'
import { cn } from '@/lib/utils'
import { Coins, Plus } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'

interface CreditBalanceProps {
    dependencies?: any[]
}

export function CreditBalance({ dependencies = [] }: CreditBalanceProps) {
    const [balance, setBalance] = useState<number | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    // Fetch balance on mount and when dependencies change
    useEffect(() => {
        getCreditsBalance().then(setBalance)
    }, [...dependencies])

    const handleRefill = () => {
        startTransition(async () => {
            try {
                const newBalance = await betaRefillCredits()
                setBalance(newBalance)
                toast.success("Added 10 Free Credits (Beta)")
                setIsOpen(false)
            } catch (error) {
                toast.error("Failed to add credits")
            }
        })
    }

    // Formatting
    const isLow = balance !== null && balance < 5
    const isZero = balance === 0

    return (
        <TooltipProvider>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <Tooltip delayDuration={0} open={isZero && !isOpen}>
                    <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "gap-2 font-semibold transition-all rounded-full h-9 px-4 ml-2 border shadow-sm",
                                    isLow
                                        ? "bg-red-500/10 text-red-200 hover:bg-red-500/20 hover:text-red-100 border-red-500/30"
                                        : "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-100 hover:from-blue-500/20 hover:to-indigo-500/20 border-blue-500/20"
                                )}
                            >
                                <Coins className={cn("h-4 w-4", isLow ? "text-red-400" : "text-blue-300")} />
                                <span className="text-sm tracking-wide">{balance === null ? '...' : balance}</span>
                                <div className={cn(
                                    "flex items-center justify-center w-5 h-5 rounded-full ml-1 transition-all",
                                    isLow
                                        ? "bg-red-500/20 text-red-200 group-hover:bg-red-500/30"
                                        : "bg-blue-500/20 text-blue-200 group-hover:bg-blue-500/30"
                                )}>
                                    <Plus className="h-3.5 w-3.5" />
                                </div>
                            </Button>
                        </DialogTrigger>
                    </TooltipTrigger>
                    {isZero && (
                        <TooltipContent
                            side="bottom"
                            align="end"
                            sideOffset={10}
                            className="max-w-[200px] text-center bg-red-950/90 border-red-500/30 text-red-100 animate-in fade-in zoom-in duration-300"
                        >
                            <p>You have 0 credits. You need credits to perform actions.</p>
                        </TooltipContent>
                    )}
                </Tooltip>

                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Get More Credits</DialogTitle>
                        <DialogDescription>
                            You need credits to run Tenant Reports.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 py-4">
                        <div className="p-4 bg-muted/50 rounded-lg border text-center">
                            <h3 className="font-semibold text-lg">Beta Tester Pack</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Thanks for testing RenterCheck! <br /> Here are some extra credits on us.
                            </p>
                            <Button
                                onClick={handleRefill}
                                disabled={isPending}
                                className="w-full"
                            >
                                {isPending ? "Adding..." : "Add +10 Credits (Free)"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    )
}
